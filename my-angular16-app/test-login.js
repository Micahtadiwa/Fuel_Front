const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE   = 'http://localhost:4200';
const SHOTS  = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

async function shot(page, name) {
  const p = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  screenshot → ${p}`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: false,
    slowMo: 400
  });
  const page = await browser.newPage();
  page.on('console', m => console.log('  [browser]', m.text()));
  page.on('pageerror', e => console.error('  [page-error]', e.message));

  // ── 1. Load login page ─────────────────────────────────────────────────────
  console.log('\n=== 1. Loading login page ===');
  await page.goto(BASE + '/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000); // let Angular bootstrap
  await shot(page, '01-login-page');

  // ── 2. Bad credentials ─────────────────────────────────────────────────────
  console.log('\n=== 2. Wrong password test ===');
  await page.fill('input[name="loginEmail"]', 'wrong@email.com');
  await page.fill('input[name="loginPassword"]', 'wrongpass');

  // Handle alert dialogs
  page.once('dialog', async d => { console.log('  [alert]', d.message()); await d.accept(); });
  await page.click('.sign-in-container button');
  await page.waitForTimeout(2000);
  await shot(page, '02-bad-credentials');

  // ── 3. Valid login ─────────────────────────────────────────────────────────
  console.log('\n=== 3. Valid login ===');
  await page.fill('input[name="loginEmail"]', 'admin@fuel.com');
  await page.fill('input[name="loginPassword"]', 'admin123');
  page.once('dialog', async d => { console.log('  [alert]', d.message()); await d.accept(); });
  await page.click('.sign-in-container button');
  await page.waitForTimeout(3000);
  await shot(page, '03-after-login');

  const url = page.url();
  console.log('\n  Current URL after login:', url);

  if (url.includes('/login')) {
    console.log('  ⚠  Still on login — login may have failed (check credentials)');
  } else {
    console.log('  ✅  Navigated away from login →', url);
  }

  // ── 4. Check localStorage for token ───────────────────────────────────────
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const user  = await page.evaluate(() => localStorage.getItem('user'));
  console.log('\n  localStorage.token:', token ? token.substring(0, 40) + '…' : 'null');
  console.log('  localStorage.user: ', user);

  await browser.close();
  console.log('\nDone. Screenshots saved to:', SHOTS);
})().catch(err => { console.error(err); process.exit(1); });
