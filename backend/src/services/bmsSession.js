/**
 * Shared BMS login helper — reused by both the scraper and the action service.
 * Returns { browser, page } with an authenticated BMS session.
 */
const puppeteer     = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const LAUNCH_ARGS = [
  '--no-sandbox', '--disable-setuid-sandbox',
  '--disable-dev-shm-usage', '--disable-gpu',
  '--single-process', '--no-zygote',
];

async function bmsLogin(bmsUrl, bmsUser, bmsPass) {
  const browser = await puppeteer.launch({ headless: 'new', args: LAUNCH_ARGS });
  const page    = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto(`${bmsUrl}/login.php`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#login_username', { timeout: 10000 });
  await page.type('#login_username', bmsUser, { delay: 50 });
  await page.type('#login_password', bmsPass, { delay: 50 });

  const cookiesBefore   = await page.cookies();
  const originalSession = cookiesBefore.find(c => c.name === 'PHPSESSID');

  const check = await page.evaluate(async (u, p) => {
    const csrf = document.querySelector('input[name="csrf_token"]')?.value || '';
    return new Promise(resolve => {
      $.ajax({
        type: 'POST', url: 'checklogin.php',
        data: { login_username: u, login_password: p, csrf_token: csrf },
        success: resolve, error: () => resolve('ajax_error'),
      });
    });
  }, bmsUser, bmsPass);

  if (check === 'false')   throw new Error('BMS login failed — wrong credentials.');
  if (check === 'captcha') throw new Error('BMS CAPTCHA required — login manually once to clear it.');

  const nav = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => null);
  await page.evaluate(() => document.querySelector('form#login')?.submit()).catch(() => {});
  await nav;

  if (originalSession) {
    await page.setCookie({ ...originalSession, value: originalSession.value });
  }
  await page.goto(`${bmsUrl}/resellerUsers.php`, { waitUntil: 'networkidle2', timeout: 20000 });

  const url = page.url();
  if (url.includes('login') || url.includes('logout')) {
    throw new Error('BMS session not established after login.');
  }
  return { browser, page };
}

module.exports = { bmsLogin };
