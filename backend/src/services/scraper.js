/**
 * Aura Net — BMS Scraper Service
 * Puppeteer-based scraper for bms.libatech.net.lb (Radius BMS)
 * Handles login, pagination, data parsing, and alert rule evaluation.
 */
const puppeteer = require('puppeteer');
const User      = require('../models/User');
const Client    = require('../models/Client');
const Alert     = require('../models/Alert');
const SyncLog   = require('../models/SyncLog');

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

    // Fill username
    await page.waitForSelector('input[name="username"], input[type="text"]', { timeout: 10000 });
    await page.evaluate(() => {
      const el = document.querySelector('input[name="username"]') || document.querySelector('input[type="text"]');
      if (el) el.value = '';
    });
    await page.type('input[name="username"], input[type="text"]', bmsUser, { delay: 50 });

    // Fill password
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', bmsPass, { delay: 50 });

    // Submit
    const submitSel = 'button[type="submit"], input[type="submit"], .btn[type="submit"]';
    await page.click(submitSel);
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

    const afterUrl = page.url();
    if (afterUrl.includes('login')) {
      // Might be CAPTCHA or wrong credentials
      const pageText = await page.evaluate(() => document.body.innerText);
      const hasCaptchaErr = /captcha|invalid/i.test(pageText);
      throw new Error(hasCaptchaErr
        ? 'Login blocked — CAPTCHA or invalid credentials. Check your BMS username/password in Settings.'
        : 'Login failed — still on login page. Check credentials in Settings.');
    }
    await step(1, 'done');

    // ── Step 2: Navigate to client list ─────────────────────────────
    await step(2, 'running');

    // Radius BMS common paths for user/client list
    const candidatePaths = [
      '/index.php?module=Users&action=index',
      '/index.php?module=Clients&action=index',
      '/index.php?module=NAS&action=listUsers',
      '/users',
      '/clients',
    ];

    let listUrl = null;
    for (const p of candidatePaths) {
      try {
        await page.goto(`${bmsUrl}${p}`, { waitUntil: 'networkidle2', timeout: 8000 });
        const hasRows = await page.$('table tbody tr td');
        if (hasRows) { listUrl = p; break; }
      } catch (_) { continue; }
    }

    if (!listUrl) {
      // Try finding a nav link with keywords
      const links = await page.$$eval('a', els =>
        els.map(e => ({ href: e.href, text: e.textContent.trim() }))
           .filter(l => /user|client|subscriber|member/i.test(l.text) && l.href.includes('index.php'))
      );
      if (links.length) {
        await page.goto(links[0].href, { waitUntil: 'networkidle2', timeout: 8000 });
      }
    }
    await step(2, 'done');

    // ── Step 3: Scrape paginated table ───────────────────────────────
    await step(3, 'running');
    const allClients = [];
    let pageNum = 0;

    while (pageNum < 100) {
      pageNum++;
      const rows = await page.evaluate(() => {
        const trs = Array.from(document.querySelectorAll('table tbody tr'));
        return trs.map(tr => {
          const tds = Array.from(tr.querySelectorAll('td'));
          const t   = i => tds[i]?.innerText?.trim() || '';
          // Radius BMS typical column order (0-indexed):
          // 0:ID  1:Username  2:Name/FullName  3:Profile  4:Status  5:Group  6:Expiry  7:Last-Login
          return {
            bmsId:    t(0) || `row_${Math.random().toString(36).slice(2,8)}`,
            username: t(1),
            name:     t(2) || t(1),
            profile:  t(3),
            status:   /activ/i.test(t(4)) ? 'active' : /expir/i.test(t(4)) ? 'expired' : /pend/i.test(t(4)) ? 'pending' : 'inactive',
            group:    t(5),
            expiry:   t(6),
            lastSeen: t(7),
          };
        }).filter(r => r.username || r.name);
      });

      if (rows.length === 0) break;
      allClients.push(...rows);

      // Next page
      const next = await page.$('a.next, li.next:not(.disabled) a, [rel="next"], .pagination .next a');
      if (!next) break;
      await next.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    }

    await browser.close();
    browser = null;
    await step(3, 'done');

    // ── Step 4: Upsert into MongoDB ──────────────────────────────────
    let clientsNew = 0, clientsUpdated = 0;
    const prevClients = await Client.find({ owner: user._id }).select('bmsId status');
    const prevMap = new Map(prevClients.map(c => [c.bmsId, c]));

    for (const c of allClients) {
      const existing = prevMap.get(c.bmsId);
      const update   = { ...c, owner: user._id, syncedAt: new Date(), prevStatus: existing?.status || '' };
      const result   = await Client.findOneAndUpdate(
        { owner: user._id, bmsId: c.bmsId },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (!existing) clientsNew++;
      else if (existing.status !== c.status) clientsUpdated++;
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
    log.alertsCreated  = alertsCreated;
    log.durationMs     = Date.now() - start;
    await log.save();

    console.log(`✅ Sync done for ${user.email}: ${allClients.length} clients, ${alertsCreated} alerts in ${log.durationMs}ms`);
    return { success: true, clientsFound: allClients.length, clientsNew, clientsUpdated, alertsCreated };

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
  return toCreate.length;
}

module.exports = { syncAll, syncUser };
