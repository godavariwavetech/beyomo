const assert = require('node:assert/strict');
const { chromium } = require('../website-screenshots/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  const admin = { id: 1, name: 'Test Admin', role: 'super_admin', allowedZones: null };
  const customer = { id: 900, name: 'WhatsApp Test Customer', phone: '9876543210', addresses: [
    { id: 901, isDefault: true, label: 'Home', line1: '10 Test Road', city: 'Nellore', state: 'Andhra Pradesh', pincode: '524001' },
  ] };
  const city = { id: 2478, name: 'Nellore', isActive: true };
  const service = { id: 123, name: 'Test Facial', basePrice: 1000, duration: 30 };
  const scheduled = new Date(); scheduled.setDate(scheduled.getDate() + 1); scheduled.setHours(11, 0, 0, 0);
  const saved = { id: 999999, bookingCode: 'TEST-WA-001', status: 'confirmed', serviceOtp: '0123',
    userId: customer.id, services: [{ ...service, price: 1000, qty: 1 }], scheduledAt: scheduled.toISOString(),
    totalAmount: 1050, baseAmount: 1000, taxAmount: 50, addressLine1: '10 Test Road', addressCity: 'Nellore' };
  let creates = 0;
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(admin => {
    localStorage.setItem('adminUser', JSON.stringify(admin)); localStorage.setItem('adminToken', 'mock-token');
  }, admin);
  await page.route('**/api/v1/admin/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api/v1/admin', '');
    let data = [];
    let status = 200;
    if (path === '/auth/me') data = admin;
    else if (path === '/cities') data = [city];
    else if (path === '/users/900') data = customer;
    else if (path === '/users') data = [customer];
    else if (path === '/booking-catalog') data = { services: [service], packages: [] };
    else if (path === '/bookings/preview') data = saved;
    else if (path === '/bookings' && req.method() === 'POST') { creates++; data = saved; status = 201; }
    await route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ status: true, data }) });
  });
  try {
    await page.goto('http://127.0.0.1:5173/bookings');
    await page.getByRole('button', { name: 'New Booking', exact: true }).click();
    assert.equal(await page.getByRole('link', { name: 'Open WhatsApp' }).count(), 0);
    await page.locator('#booking-customer-search').fill('9876543210');
    await page.locator('.booking-customer-result').filter({ hasText: customer.name }).click();
    await page.locator('input[type="checkbox"]').first().check();
    const pad = n => String(n).padStart(2, '0');
    await page.locator('input[type="datetime-local"]').fill(`${scheduled.getFullYear()}-${pad(scheduled.getMonth()+1)}-${pad(scheduled.getDate())}T11:00`);
    await page.getByRole('button', { name: 'Review Total', exact: true }).click();
    await page.getByRole('button', { name: /^Create Booking/ }).click();
    await page.getByRole('heading', { name: 'Booking Created', exact: true }).waitFor();
    const link = page.getByRole('link', { name: 'Open WhatsApp', exact: true });
    const href = new URL(await link.getAttribute('href'));
    assert.equal(href.origin, 'https://wa.me');
    assert.equal(href.pathname, '/919876543210');
    assert.match(href.searchParams.get('text'), /TEST-WA-001 is confirmed/);
    assert.match(href.searchParams.get('text'), /Service OTP: 0123/);
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.equal(creates, 1);
    await page.screenshot({ path: 'logs/admin-whatsapp-booking-success.png', fullPage: true });
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    assert.equal(await page.getByRole('link', { name: 'Open WhatsApp' }).count(), 0);
    await page.getByRole('button', { name: 'New Booking', exact: true }).click();
    assert.equal(await page.locator('#booking-customer-search').inputValue(), '');
    assert.deepEqual(errors, []);
    console.log('PASS: Create booking -> success preview -> correct customer WhatsApp link and OTP -> Done -> clean new form.');
    console.log('All API responses were mocked; no booking was written and no WhatsApp message was sent.');
  } catch (e) {
    await page.screenshot({ path: 'logs/admin-whatsapp-flow-error.png', fullPage: true });
    throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e.stack); process.exit(1); });
