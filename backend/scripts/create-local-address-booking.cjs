require('dotenv').config({quiet:true});
const assert = require('node:assert/strict');
const {chromium} = require('../../website-screenshots/node_modules/playwright');
const {signToken} = require('../utils/jwtUtils');
const {sequelize} = require('../utils/dbconnect');

(async () => {
  assert.ok(['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST || 'localhost'),'Local database only');
  const token = signToken({userId:1,userType:'admin',role:'super_admin'},'1h');
  const headers = {Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
  const base = 'http://localhost:3000/api/v1/admin';
  const list = await fetch(`${base}/users?search=9000000019`,{headers}).then(r=>r.json());
  let customer = (Array.isArray(list.data) ? list.data : list.data?.data || []).find(u=>u.phone==='9000000019');
  if (!customer) {
    const response = await fetch(`${base}/users`,{method:'POST',headers,
      body:JSON.stringify({name:'Local Address Test',phone:'9000000019'})});
    const result = await response.json();
    assert.equal(response.status,201,JSON.stringify(result)); customer=result.data;
  }
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const page = await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>{if (/photon|nominatim/.test(r.url())) console.log('Lookup failure:',r.url(),r.failure()?.errorText);});
  page.on('response',r=>{if (/photon|nominatim/.test(r.url())) console.log('Lookup response:',r.status(),r.url());});
  await page.addInitScript(({token})=>{
    localStorage.setItem('adminToken',token);
    localStorage.setItem('adminUser',JSON.stringify({id:1,name:'Local Admin',role:'super_admin'}));
  },{token});
  try {
    await page.goto('http://127.0.0.1:5173/bookings',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/New Booking/}).click();
    await page.locator('#booking-customer-search').fill(customer.phone);
    await page.locator('.booking-customer-result').filter({hasText:'Local Address Test'}).click();
    await page.getByRole('heading',{name:'Select Customer Service Address'}).waitFor();
    await page.waitForFunction(()=>document.querySelector('input[placeholder="House / Flat / Street"]')?.value, {timeout:45000});
    const detected = await page.locator('input[placeholder="House / Flat / Street"]').inputValue();
    const city = await page.getByRole('combobox',{name:'Service city'}).inputValue();
    const state = await page.locator('input[placeholder="State"]').inputValue();
    console.log('Detected address:',JSON.stringify({street:detected,city,state}));
    assert.ok(detected && city && state,'Automatic address detection must populate street, city and state');
    await page.getByRole('button',{name:'Confirm Address',exact:true}).click();
    // Select catalog services until the server minimum is met during review.
    const checks = page.locator('input[type="checkbox"]');
    await checks.first().waitFor();
    const count = await checks.count();
    assert.ok(count,'At least one local service must be available');
    for (let i=0;i<Math.min(count,5);i++) await checks.nth(i).check();
    const schedule = new Date(); schedule.setDate(schedule.getDate()+1); schedule.setHours(11,0,0,0);
    const pad=n=>String(n).padStart(2,'0');
    await page.locator('input[type="datetime-local"]').fill(`${schedule.getFullYear()}-${pad(schedule.getMonth()+1)}-${pad(schedule.getDate())}T11:00`);
    await page.locator('textarea').fill('LOCAL TEST ONLY — address detection verification. No real customer visit required.');
    const previewResponse = page.waitForResponse(r=>r.url().endsWith('/bookings/preview') && r.request().method()==='POST');
    await page.getByRole('button',{name:'Review Total',exact:true}).click();
    const preview=await previewResponse;
    assert.equal(preview.status(),200,await preview.text());
    const createResponse=page.waitForResponse(r=>r.url().endsWith('/bookings') && r.request().method()==='POST');
    await page.getByRole('button',{name:/^Create Booking/}).click();
    const created=await createResponse; const body=await created.json();
    assert.equal(created.status(),201,JSON.stringify(body));
    console.log('LOCAL BOOKING CREATED:',JSON.stringify({id:body.data.id,code:body.data.bookingCode,customer:customer.name,address:body.data.addressLine1,city:body.data.addressCity,total:body.data.totalAmount,status:body.data.status}));
    console.log('Browser errors:',JSON.stringify(errors));
    await page.screenshot({path:'logs/local-address-booking-created.png',fullPage:true});
  } catch(error) {
    await page.screenshot({path:'logs/local-address-booking-error.png',fullPage:true});
    console.log('Form text:',(await page.locator('body').innerText()).slice(-6500));
    throw error;
  } finally {await browser.close();await sequelize.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
