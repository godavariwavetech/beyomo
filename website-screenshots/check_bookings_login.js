const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:5173/my-bookings', { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="tel"], input[placeholder*="Mobile" i]', { timeout: 10000 });
  await page.fill('input[type="tel"], input[placeholder*="Mobile" i]', '7997753587');
  await page.click('button:has-text("Send OTP")');
  await page.waitForTimeout(1500);
  const otpInputs = await page.$$('input');
  // try filling OTP field(s) with 1234
  const otpField = await page.$('input[placeholder*="OTP" i], input[maxlength="4"], input[maxlength="1"]');
  if (otpField) {
    const allOtpBoxes = await page.$$('input[maxlength="1"]');
    if (allOtpBoxes.length >= 4) {
      for (let i = 0; i < 4; i++) await allOtpBoxes[i].type(String('1234'[i]));
    } else {
      await otpField.fill('1234');
    }
  }
  await page.waitForTimeout(500);
  const verifyBtn = await page.$('button:has-text("Verify")');
  if (verifyBtn) await verifyBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'mybookings_loggedin.png', fullPage: true });
  await browser.close();
})();
