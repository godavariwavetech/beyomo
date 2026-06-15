
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/HP/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_home2.png', fullPage: true });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
