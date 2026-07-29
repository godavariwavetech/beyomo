const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:5173/my-bookings', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'mybookings_check.png', fullPage: true });
  await browser.close();
})();
