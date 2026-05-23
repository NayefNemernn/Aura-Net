/**
 * BMS Action Executor — uses Puppeteer to perform live actions on the BMS
 * for a given user (refill, disconnect, block, edit, ping, etc.)
 */
const { bmsLogin } = require('./bmsSession');
const User = require('../models/User');

const DELAY = ms => new Promise(r => setTimeout(r, ms));

async function withSession(userId, fn) {
  const user = await User.findById(userId).select('+bmsPass');
  const bmsUrl  = (user?.bmsUrl  || process.env.BMS_URL  || '').replace(/\/$/, '');
  const bmsUser = user?.bmsUser  || process.env.BMS_USER  || '';
  const bmsPass = user?.bmsPass  || process.env.BMS_PASS  || '';
  if (!bmsUrl || !bmsUser || !bmsPass) throw new Error('BMS credentials not configured');
  const { browser, page } = await bmsLogin(bmsUrl, bmsUser, bmsPass);
  try {
    return await fn(page, bmsUrl);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function ensureUsersPage(page, bmsUrl) {
  if (!page.url().includes('resellerUsers')) {
    await page.goto(`${bmsUrl}/resellerUsers.php`, { waitUntil: 'networkidle2', timeout: 20000 });
  }
  // Show all rows so we can find any username
  await page.evaluate(() => {
    const sel = document.querySelector('select[name$="_length"]');
    if (!sel) return;
    const opts = Array.from(sel.options).map(o => parseInt(o.value)).filter(v => v > 0);
    const biggest = opts.sort((a, b) => b - a)[0];
    if (biggest) { sel.value = biggest; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }).catch(() => {});
  await DELAY(800);
}

async function searchAndExpand(page, username) {
  // Filter DataTable to just this user
  await page.evaluate(uname => {
    const inp = document.querySelector('input[type="search"]');
    if (inp) {
      inp.value = uname;
      ['input', 'keyup', 'change'].forEach(ev =>
        inp.dispatchEvent(new Event(ev, { bubbles: true }))
      );
    }
  }, username);
  await DELAY(1500);

  // Click the first-column expand control on the matching row
  const found = await page.evaluate(uname => {
    const rows = Array.from(document.querySelectorAll('table.dataTable tbody tr'))
      .filter(r => !r.classList.contains('child') && r.querySelectorAll('td').length > 2);
    for (const row of rows) {
      const tds = Array.from(row.querySelectorAll('td'));
      const match = tds.some(td => {
        const t = td.textContent.trim();
        return t === uname || (t.length < 60 && t.includes(uname));
      });
      if (match) { tds[0].click(); return true; }
    }
    return false;
  }, username);

  if (!found) throw new Error(`User "${username}" not found in BMS`);
  await DELAY(1000);
}

async function clickChildBtn(page, label) {
  const lc = label.toLowerCase();
  return page.evaluate(lc => {
    // DataTables child rows
    for (const row of document.querySelectorAll('tr.child, tr.shown + tr, tr.detail')) {
      for (const el of row.querySelectorAll('a, button, [onclick]')) {
        if (el.textContent.trim().toLowerCase().includes(lc)) {
          el.click();
          return { ok: true, text: el.textContent.trim() };
        }
      }
    }
    // Any visible element (fallback)
    for (const el of document.querySelectorAll('a, button')) {
      if (el.offsetParent && el.textContent.trim().toLowerCase().includes(lc)) {
        el.click();
        return { ok: true, text: el.textContent.trim() };
      }
    }
    return { ok: false };
  }, lc);
}

async function autoConfirm(page) {
  await DELAY(500);
  await page.evaluate(() => {
    // Bootstrap bootbox / modal confirm
    for (const btn of document.querySelectorAll(
      '.modal.show .btn-primary, .modal.show .btn-success, [data-bb-handler="confirm"], .swal2-confirm'
    )) {
      if (btn.offsetParent) { btn.click(); return; }
    }
  }).catch(() => {});
  await DELAY(500);
}

async function readResult(page) {
  await DELAY(1800);
  return page.evaluate(() => {
    for (const sel of [
      '.alert', '[role="alert"]', '.bootbox-body', '.swal2-html-container',
      '.modal-body', '.success', '.error', '#resultMsg', '#message', '.msg',
    ]) {
      for (const el of document.querySelectorAll(sel)) {
        const t = el.textContent.trim();
        if (t && el.offsetParent !== null) return t.slice(0, 400);
      }
    }
    return null;
  });
}

// ── Simple one-click actions ────────────────────────────────────────

const SIMPLE_ACTIONS = {
  refill:      'refill',
  disconnect:  'disconnect',
  block:       'block',
  resetMac:    'reset mac',
  changeplan:  'change plan',
};

async function performSimpleAction(userId, username, action) {
  const label = SIMPLE_ACTIONS[action];
  if (!label) throw new Error(`Unknown simple action: ${action}`);

  return withSession(userId, async (page, bmsUrl) => {
    page.on('dialog', async d => { await d.accept(); });
    await ensureUsersPage(page, bmsUrl);
    await searchAndExpand(page, username);

    const clicked = await clickChildBtn(page, label);
    if (!clicked.ok) throw new Error(`"${label}" button not found on BMS for user "${username}"`);

    await autoConfirm(page);
    const msg = await readResult(page);
    return { success: true, action, username, message: msg || 'Action completed' };
  });
}

// ── Ping ────────────────────────────────────────────────────────────

async function pingUser(userId, username) {
  return withSession(userId, async (page, bmsUrl) => {
    page.on('dialog', async d => { await d.accept(); });
    await ensureUsersPage(page, bmsUrl);
    await searchAndExpand(page, username);

    const clicked = await clickChildBtn(page, 'ping');
    if (!clicked.ok) throw new Error(`Ping button not found for "${username}"`);

    // Ping takes a few seconds to return output
    await DELAY(4000);

    const output = await page.evaluate(() => {
      for (const sel of ['pre', 'code', '.ping-result', '#pingOutput', '.modal-body pre', '.modal-body code']) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) return el.textContent.trim();
      }
      return null;
    });

    const msg = await readResult(page);
    return { success: true, username, output: output || msg || 'Ping completed (no output captured)' };
  });
}

// ── Capture-output actions (View Rules, User Traffic, Status on BNG) ──

async function captureActionOutput(userId, username, label) {
  return withSession(userId, async (page, bmsUrl) => {
    page.on('dialog', async d => { await d.accept(); });
    await ensureUsersPage(page, bmsUrl);
    await searchAndExpand(page, username);

    const clicked = await clickChildBtn(page, label);
    if (!clicked.ok) throw new Error(`"${label}" button not found for "${username}"`);

    await DELAY(2500);

    const output = await page.evaluate(() => {
      // Grab anything that appeared in a modal or result area
      const candidates = [
        '.modal.show .modal-body',
        '.modal.show pre',
        '#outputArea', '#resultArea',
        'pre', 'code',
        '[role="alert"]',
        '.result', '.output',
      ];
      const parts = [];
      for (const sel of candidates) {
        for (const el of document.querySelectorAll(sel)) {
          const t = el.textContent.trim();
          if (t && el.offsetParent !== null && !parts.includes(t)) parts.push(t);
        }
      }
      return parts.join('\n\n') || null;
    });

    return { success: true, username, label, output: output || 'No output captured' };
  });
}

// ── Edit User — get current form data ───────────────────────────────

async function getEditFormData(userId, username) {
  return withSession(userId, async (page, bmsUrl) => {
    page.on('dialog', async d => { await d.accept(); });
    await ensureUsersPage(page, bmsUrl);
    await searchAndExpand(page, username);

    const clicked = await clickChildBtn(page, 'edit user');
    if (!clicked.ok) throw new Error(`Edit User button not found for "${username}"`);

    await DELAY(2500);

    const formData = await page.evaluate(uname => {
      // Try modal form first, then any non-login form on the page
      const form =
        document.querySelector('.modal.show form') ||
        document.querySelector('.modal-body form') ||
        Array.from(document.querySelectorAll('form')).find(f => !f.id?.includes('login'));

      if (!form) return null;

      function labelFor(el) {
        if (el.id) {
          const lbl = document.querySelector(`label[for="${el.id}"]`);
          if (lbl) return lbl.textContent.replace(':', '').trim();
        }
        const wrap = el.closest('.form-group, .field, .row');
        if (wrap) {
          const lbl = wrap.querySelector('label');
          if (lbl) return lbl.textContent.replace(':', '').trim();
        }
        return el.placeholder || el.name || el.id || '';
      }

      const fields = [];
      form.querySelectorAll('input, select, textarea').forEach(el => {
        if (!el.name && !el.id) return;
        const t = el.type;
        if (t === 'submit' || t === 'button' || t === 'reset' || t === 'image') return;

        const field = {
          name:  el.name || el.id,
          id:    el.id || el.name,
          type:  t === 'textarea' ? 'textarea' : el.tagName === 'SELECT' ? 'select' : t || 'text',
          label: labelFor(el),
          value: t === 'checkbox' ? el.checked : el.value,
        };

        if (el.tagName === 'SELECT') {
          field.options = Array.from(el.options).map(o => ({ value: o.value, label: o.text.trim() }));
        }

        fields.push(field);
      });

      return { action: form.action, method: form.method || 'POST', fields };
    }, username);

    if (!formData) throw new Error('Edit form not found — BMS may have navigated differently');
    return { success: true, username, formData };
  });
}

// ── Edit User — submit changes ───────────────────────────────────────

async function saveEditFormData(userId, username, fieldValues) {
  return withSession(userId, async (page, bmsUrl) => {
    page.on('dialog', async d => { await d.accept(); });
    await ensureUsersPage(page, bmsUrl);
    await searchAndExpand(page, username);

    const clicked = await clickChildBtn(page, 'edit user');
    if (!clicked.ok) throw new Error(`Edit User button not found for "${username}"`);

    await DELAY(2500);

    const filled = await page.evaluate(values => {
      const form =
        document.querySelector('.modal.show form') ||
        document.querySelector('.modal-body form') ||
        Array.from(document.querySelectorAll('form')).find(f => !f.id?.includes('login'));
      if (!form) return { error: 'Form not found' };

      for (const [name, value] of Object.entries(values)) {
        const el = form.querySelector(`[name="${name}"]`) || form.querySelector(`#${name}`);
        if (!el) continue;
        if (el.type === 'checkbox') {
          el.checked = Boolean(value);
        } else if (el.tagName === 'SELECT') {
          el.value = value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.value = value;
          el.dispatchEvent(new Event('input',  { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.click(); return { ok: true }; }
      form.submit();
      return { ok: true };
    }, fieldValues);

    if (filled.error) throw new Error(filled.error);

    await DELAY(2000);
    const msg = await readResult(page);
    return { success: true, username, message: msg || 'User updated successfully' };
  });
}

// ── User Page URL ────────────────────────────────────────────────────

async function getUserPageUrl(userId, username) {
  const user = await User.findById(userId).select('bmsUrl');
  const bmsUrl = (user?.bmsUrl || process.env.BMS_URL || '').replace(/\/$/, '');
  // Common patterns for user page in libatech BMS
  return {
    success: true,
    url: `${bmsUrl}/resellerUserInfo.php?user=${encodeURIComponent(username)}`,
  };
}

module.exports = {
  performSimpleAction,
  pingUser,
  captureActionOutput,
  getEditFormData,
  saveEditFormData,
  getUserPageUrl,
};
