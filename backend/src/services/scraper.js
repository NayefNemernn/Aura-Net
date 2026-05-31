/**
 * Aura Net — BMS Scraper Service
 * Puppeteer-based scraper for bms.libatech.net.lb (Radius BMS)
 * Handles login, pagination, data parsing, and alert rule evaluation.
 */
const puppeteer      = require('puppeteer-extra');
const StealthPlugin  = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const User      = require('../models/User');
const Client    = require('../models/Client');
const Alert     = require('../models/Alert');
const SyncLog   = require('../models/SyncLog');
const tg        = require('./telegram');

// ── Sync all active users (called by cron) ────────────────────────────
async function syncAll() {
  const users = await User.find({ isActive: true }).select('+bmsPass');
  for (const user of users) {
    try { await syncUser(user); } catch (e) { console.error(`Sync failed for ${user.email}:`, e.message); }
  }
}

// ── Sync a single user ────────────────────────────────────────────────
async function syncUser(user) {
  const start = Date.now();

  // Resolve credentials: user settings > env fallback
  const bmsUrl  = (user.bmsUrl  || process.env.BMS_URL  || 'https://bms.libatech.net.lb').replace(/\/$/, '');
  const bmsUser = user.bmsUser || process.env.BMS_USER || '';
  const bmsPass = user.bmsPass || process.env.BMS_PASS || '';

  if (!bmsUser || !bmsPass) {
    return { success: false, error: 'BMS credentials not set. Configure them in Settings.' };
  }

  // Create SyncLog record
  const log = await SyncLog.create({
    owner: user._id,
    status: 'running',
    steps: [
      { label: 'Launching browser',   status: 'pending', ts: new Date() },
      { label: 'Authenticating',      status: 'pending', ts: new Date() },
      { label: 'Loading client list', status: 'pending', ts: new Date() },
      { label: 'Parsing records',     status: 'pending', ts: new Date() },
      { label: 'Evaluating rules',    status: 'pending', ts: new Date() },
    ],
  });

  const step = async (idx, status) => {
    log.steps[idx].status = status;
    log.steps[idx].ts = new Date();
    await log.save();
  };

  let browser;
  try {
    // ── Step 0: Launch ───────────────────────────────────────────────
    await step(0, 'running');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
    });
    await step(0, 'done');

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    // ── Step 1: Login ────────────────────────────────────────────────
    await step(1, 'running');
    await page.goto(`${bmsUrl}/login.php`, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('#login_username', { timeout: 10000 });
    await page.type('#login_username', bmsUser, { delay: 60 });
    await page.type('#login_password', bmsPass, { delay: 60 });

    // Capture the original PHPSESSID before login.php deletes it.
    // The server sends Set-Cookie: PHPSESSID=deleted on login success, but the
    // session data on disk stays valid — restoring the original ID after the
    // redirect chain finishes lets us resume the authenticated session directly.
    const cookiesBefore = await page.cookies();
    const originalSession = cookiesBefore.find(c => c.name === 'PHPSESSID');

    // Validate credentials via checklogin.php AJAX
    const checkResult = await page.evaluate(async (user, pass) => {
      const csrf = document.querySelector('input[name="csrf_token"]')?.value || '';
      return await new Promise(resolve => {
        $.ajax({
          type: 'POST', url: 'checklogin.php',
          data: { login_username: user, login_password: pass, csrf_token: csrf },
          success: resolve,
          error: () => resolve('ajax_error'),
        });
      });
    }, bmsUser, bmsPass);

    if (checkResult === 'false') {
      throw new Error('BMS login failed — wrong username or password. Update credentials in Settings.');
    }
    if (checkResult === 'captcha') {
      throw new Error('BMS login blocked — CAPTCHA required. Try logging in manually to clear it.');
    }

    // Submit the form; server will 302 → resellerUsers.php → logout.php → login.php
    // (server deletes PHPSESSID but keeps session data on disk)
    const nav = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => null);
    await page.evaluate(() => document.querySelector('form#login').submit()).catch(() => {});
    await nav;

    // Restore original session cookie, then navigate directly to the dashboard
    if (originalSession) {
      await page.setCookie({ ...originalSession, value: originalSession.value });
    }
    await page.goto(`${bmsUrl}/resellerUsers.php`, { waitUntil: 'networkidle2', timeout: 20000 });

    const afterUrl = page.url();
    if (afterUrl.includes('login') || afterUrl.includes('logout')) {
      throw new Error('BMS login failed — session not established. Check credentials in Settings.');
    }
    await step(1, 'done');

    // ── Step 2: Navigate to client list ─────────────────────────────
    await step(2, 'running');
    // Krypton BMS: reseller user list is at resellerUsers.php (already loaded after login)
    if (!page.url().includes('resellerUsers')) {
      await page.goto(`${bmsUrl}/resellerUsers.php`, { waitUntil: 'networkidle2', timeout: 15000 });
    }
    // Page uses DataTables with default 50 rows shown — enough for typical reseller accounts.
    // Increase the DataTables page length via the UI length selector if present.
    await page.evaluate(() => {
      const sel = document.querySelector('select[name$="_length"]');
      if (sel) {
        const opts = Array.from(sel.options).map(o => parseInt(o.value));
        const biggest = opts.filter(v => v > 0).sort((a,b) => b-a)[0];
        if (biggest) { sel.value = biggest; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await step(2, 'done');

    // ── Step 3: Scrape paginated table ───────────────────────────────
    await step(3, 'running');
    const allClients = [];
    let pageNum = 0;

    // Krypton BMS uses DataTables (client-side rendering). We set length=-1 above
    // to show all rows at once, so only one pass is needed.
    while (pageNum < 2) {
      pageNum++;
      const rows = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        if (!tables.length) return [];
        const mainTable = tables.reduce((a, b) =>
          b.querySelectorAll('tbody tr').length > a.querySelectorAll('tbody tr').length ? b : a, tables[0]);

        // Build keyword → column-index map from the header row
        const hdrCells = Array.from(mainTable.querySelectorAll('thead th, thead td'));
        const hdrs     = hdrCells.map(th => th.innerText.trim().toLowerCase().replace(/\s+/g, ' '));
        const col = (...kws) => { for (const k of kws) { const i = hdrs.findIndex(h => h.includes(k)); if (i >= 0) return i; } return -1; };

        const CI = {
          name:       col('name'),
          username:   col('username'),
          status:     col('status'),
          uptime:     col('uptime'),
          address:    col('address'),
          ip:         col('ip'),
          dquota:     col('d. quota', 'd quota', 'daily'),
          mquota:     col('m. quota', 'm quota', 'monthly'),
          service:    col('service'),
          expiry:     col('expiry date', 'expiry'),
          fup:        col('fup'),
          autoRefill: col('autorefill', 'auto refill'),
          speed:      col('current speed', 'speed'),
          phone:      col('phone number', 'phone'),
          mobile:     col('mobile'),
          startDate:  col('start date', 'start'),
          lastSeen:   col('last active', 'last seen', 'last login'),
          // Extended columns
          fq:             col('f-q', 'f q'),
          note:           col('notes', 'note'),
          buildingDetail: col('b.d.', 'b. d.', 'b d', 'building'),
          sector:         col('sector'),
          station:        col('station'),
          cpe:            col('cpe'),
          radioName:      col('radio name'),
          rxccq:          col('rxccq'),
          signalNoise:    col('signal noise'),
          signalStrength: col('signal strength'),
          routerOsVersion:col('router os version', 'router os', 'os version'),
          sellingPrice:   col('selling price', 'price'),
          vlan:           col('vlan'),
          nationality:    col('nationality'),
          whishPayments:  col('whish payments', 'whish'),
          zone:           col('zone'),
        };

        const trs = Array.from(mainTable.querySelectorAll('tbody tr'))
          .filter(tr => tr.querySelectorAll('td').length > 3);

        return trs.map(tr => {
          const tds = Array.from(tr.querySelectorAll('td'));
          const t   = i => i >= 0 && i < tds.length ? tds[i]?.innerText?.trim().replace(/\s+/g, ' ') || '' : '';
          const clean = s => s.replace(/ \d{2}:\d{2}:\d{2}$/, '').replace(' 23:46:00', '');

          const username  = t(CI.username);
          const statusRaw = t(CI.status);
          const ipMacRaw  = t(CI.ip);
          const ipMatch   = ipMacRaw.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/);
          const macMatch  = ipMacRaw.match(/\b([0-9a-fA-F]{2}(?:[:-][0-9a-fA-F]{2}){5})\b/);

          return {
            bmsId:        username || `row_${Math.random().toString(36).slice(2,8)}`,
            username,
            name:         t(CI.name) || username,
            status:       /online/i.test(statusRaw)  ? 'online'
                        : /expir/i.test(statusRaw)    ? 'expired'
                        : /pend/i.test(statusRaw)     ? 'pending'
                        : /active/i.test(statusRaw)   ? 'active'
                        : 'inactive',
            uptime:       t(CI.uptime),
            address:      t(CI.address),
            ipAddress:    ipMatch?.[1]  || '',
            mac:          macMatch?.[1] || '',
            dailyQuota:   t(CI.dquota),
            monthlyQuota: t(CI.mquota),
            profile:      t(CI.service),
            expiry:       clean(t(CI.expiry)),
            fup:          /\bon\b/i.test(t(CI.fup)),
            autoRefill:   /yes/i.test(t(CI.autoRefill)),
            currentSpeed: t(CI.speed),
            phone:        t(CI.phone).replace(/[\s\-]/g, ''),
            mobile:       t(CI.mobile).replace(/[\s\-]/g, ''),
            startDate:    clean(t(CI.startDate)),
            lastSeen:     clean(t(CI.lastSeen)),
            group:        '',
            // Extended fields (blank when BMS leaves them empty)
            fq:              t(CI.fq),
            note:            t(CI.note),
            buildingDetail:  t(CI.buildingDetail),
            sector:          t(CI.sector),
            station:         t(CI.station),
            cpe:             t(CI.cpe),
            radioName:       t(CI.radioName),
            rxccq:           t(CI.rxccq),
            signalNoise:     t(CI.signalNoise),
            signalStrength:  t(CI.signalStrength),
            routerOsVersion: t(CI.routerOsVersion),
            sellingPrice:    t(CI.sellingPrice),
            vlan:            t(CI.vlan),
            nationality:     t(CI.nationality),
            whishPayments:   t(CI.whishPayments),
            zone:            t(CI.zone),
          };
        }).filter(r => r.username);
      });

      if (rows.length === 0) break;
      allClients.push(...rows);
      break; // DataTables: all rows loaded in single pass
    }

    await browser.close();
    browser = null;
    await step(3, 'done');

    // ── Step 4: Upsert into MongoDB ──────────────────────────────────
    let clientsNew = 0, clientsUpdated = 0;
    const prevClients = await Client.find({ owner: user._id }).select('bmsId status');
    const prevMap = new Map(prevClients.map(c => [c.bmsId, c]));

    // Volatile/operational fields always reflect live BMS state — overwrite even when
    // cleared (e.g. IP/uptime drop when a client goes offline). Every other field is
    // only written when BMS returns a non-empty value, so admin-filled blanks survive.
    const ALWAYS_WRITE = new Set([
      'status','ipAddress','mac','uptime','dailyQuota','monthlyQuota',
      'currentSpeed','lastSeen','fup','autoRefill',
    ]);
    for (const c of allClients) {
      const existing = prevMap.get(c.bmsId);
      const set = { owner: user._id, syncedAt: new Date(), prevStatus: existing?.status || '' };
      for (const [k, v] of Object.entries(c)) {
        if (ALWAYS_WRITE.has(k) || (v !== '' && v !== null && v !== undefined)) set[k] = v;
      }
      await Client.findOneAndUpdate(
        { owner: user._id, bmsId: c.bmsId },
        { $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (!existing) clientsNew++;
      else if (existing.status !== c.status) clientsUpdated++;
    }

    // ── Prune clients that vanished from the BMS feed ───────────────
    // A client no longer in the reseller list was deleted/renamed in BMS.
    // SAFETY GUARD: only prune when the scrape returned a healthy row count
    // (>= 50% of the previous total), so a transient or partial scrape can
    // never wipe the dataset. With no previous data, any non-empty scrape is fine.
    let clientsRemoved = 0;
    const prevCount = prevMap.size;
    const healthyScrape = allClients.length > 0 && (prevCount === 0 || allClients.length >= prevCount * 0.5);
    if (healthyScrape) {
      const seenIds  = allClients.map(c => c.bmsId);
      const pruneRes = await Client.deleteMany({ owner: user._id, bmsId: { $nin: seenIds } });
      clientsRemoved = pruneRes.deletedCount || 0;
    } else if (allClients.length > 0) {
      console.warn(`⚠️  Skipping prune for ${user.email}: scraped ${allClients.length} vs previous ${prevCount} (below 50% safety threshold)`);
    }

    // ── Step 5: Evaluate alert rules ────────────────────────────────
    await step(4, 'running');
    const alertsCreated = await evaluateRules(user, allClients, prevMap);
    await step(4, 'done');

    // Finalize log
    log.status         = 'success';
    log.clientsFound   = allClients.length;
    log.clientsNew     = clientsNew;
    log.clientsUpdated = clientsUpdated;
    log.clientsRemoved = clientsRemoved;
    log.alertsCreated  = alertsCreated;
    log.durationMs     = Date.now() - start;
    await log.save();

    console.log(`✅ Sync done for ${user.email}: ${allClients.length} clients (${clientsRemoved} pruned), ${alertsCreated} alerts in ${log.durationMs}ms`);
    return { success: true, clientsFound: allClients.length, clientsNew, clientsUpdated, clientsRemoved, alertsCreated };

  } catch (err) {
    if (browser) { try { await browser.close(); } catch (_) {} }
    log.status   = 'error';
    log.error    = err.message;
    log.durationMs = Date.now() - start;
    await log.save();
    console.error(`❌ Sync error for ${user.email}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── Alert rule evaluator ──────────────────────────────────────────────
async function evaluateRules(user, freshClients, prevMap) {
  const rules = user.alertRules || {};
  const oid   = user._id;
  const now   = new Date();

  // Dismiss stale auto-alerts before creating fresh ones
  await Alert.updateMany({ owner: oid, dismissed: false }, { dismissed: true, dismissedAt: now });

  const toCreate = [];

  // ── Rule: sync_ok ────────────────────────────────────────────────
  if (rules.syncOk !== false) {
    toCreate.push({ owner: oid, sev: 'ok', title: `Sync complete — ${freshClients.length} clients loaded`, detail: `Duration: just now`, rule: 'syncOk' });
  }

  // ── Rule: inactive30 ─────────────────────────────────────────────
  if (rules.inactive30 !== false) {
    const threshold = new Date(Date.now() - 30*864e5).toISOString().split('T')[0];
    const stale = freshClients.filter(c => c.lastSeen && c.lastSeen < threshold);
    if (stale.length) {
      toCreate.push({
        owner: oid, sev: 'critical',
        title: `${stale.length} client${stale.length > 1 ? 's' : ''} not seen in 30+ days`,
        detail: stale.slice(0,5).map(c => c.name || c.username).join(', ') + (stale.length > 5 ? ` +${stale.length-5} more` : ''),
        rule: 'inactive30',
      });
    }
  }

  // ── Rule: expiry7d ───────────────────────────────────────────────
  if (rules.expiry7d !== false) {
    const today = now.toISOString().split('T')[0];
    const soon  = new Date(Date.now() + 7*864e5).toISOString().split('T')[0];
    const expiring = freshClients.filter(c => c.expiry && c.expiry >= today && c.expiry <= soon);
    if (expiring.length) {
      toCreate.push({
        owner: oid, sev: 'warning',
        title: `${expiring.length} account${expiring.length > 1 ? 's' : ''} expiring within 7 days`,
        detail: expiring.slice(0,4).map(c => `${c.name||c.username} (${c.expiry})`).join(', '),
        rule: 'expiry7d',
      });
    }
  }

  // ── Rule: statusChange ───────────────────────────────────────────
  if (rules.statusChange !== false && prevMap.size > 0) {
    const changed = freshClients.filter(c => {
      const prev = prevMap.get(c.bmsId);
      return prev && prev.status !== c.status;
    });
    if (changed.length) {
      toCreate.push({
        owner: oid, sev: 'warning',
        title: `${changed.length} client status change${changed.length > 1 ? 's' : ''} detected`,
        detail: changed.slice(0,4).map(c => { const p = prevMap.get(c.bmsId); return `${c.name||c.username}: ${p?.status} → ${c.status}`; }).join('; '),
        rule: 'statusChange',
      });
    }
  }

  // ── Rule: batchNew ───────────────────────────────────────────────
  if (rules.batchNew !== false && prevMap.size > 0) {
    const newCount = freshClients.filter(c => !prevMap.has(c.bmsId)).length;
    if (newCount >= 5) {
      toCreate.push({
        owner: oid, sev: 'info',
        title: `${newCount} new client records imported`,
        detail: 'New records added during this sync',
        rule: 'batchNew',
      });
    }
  }

  // ── Rule: drop10pct ──────────────────────────────────────────────
  if (rules.drop10pct === true && prevMap.size > 0) {
    const prevActive = [...prevMap.values()].filter(c => c.status === 'active').length;
    const newActive  = freshClients.filter(c => c.status === 'active').length;
    const drop       = prevActive > 0 ? (prevActive - newActive) / prevActive : 0;
    if (drop >= 0.1) {
      toCreate.push({
        owner: oid, sev: 'critical',
        title: `Active clients dropped ${Math.round(drop*100)}% since last sync`,
        detail: `Was ${prevActive}, now ${newActive} active clients`,
        rule: 'drop10pct',
      });
    }
  }

  if (toCreate.length) await Alert.insertMany(toCreate);

  // Forward to Telegram at most once per hour, even if syncs run more often.
  // (55-min window so an on-the-hour cron never skips an hour to clock drift.)
  const THROTTLE_MS = 55 * 60 * 1000;
  const lastTg = user.lastTelegramAt ? user.lastTelegramAt.getTime() : 0;
  if (toCreate.length && Date.now() - lastTg >= THROTTLE_MS) {
    for (const a of toCreate) {
      await tg.sendAlert(user, a.sev, a.title, a.detail).catch(() => {});
    }
    user.lastTelegramAt = new Date();
    await user.save().catch(() => {});
  }

  return toCreate.length;
}

module.exports = { syncAll, syncUser };
