const { chromium } = require('playwright');

function jumpTo(page, y) { return page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, y); }

(async () => {
  const browser = await chromium.launch();

  for (const vp of [{ w: 1440, h: 900, label: 'desktop' }, { w: 768, h: 1000, label: 'tablet' }, { w: 390, h: 900, label: 'mobile' }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 300) { await jumpTo(page, y); await page.waitForTimeout(60); }
    await page.waitForTimeout(300);

    const top = await page.evaluate(() => document.getElementById('services').getBoundingClientRect().top + window.scrollY);
    await jumpTo(page, top - 10);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `D:/client/beyomo_/website/a2_${vp.label}_services.png`, fullPage: false });

    await jumpTo(page, 0);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `D:/client/beyomo_/website/a2_${vp.label}_nav.png`, clip: { x: 0, y: 0, width: vp.w, height: 90 } });

    await page.close();
  }

  await browser.close();
})();
