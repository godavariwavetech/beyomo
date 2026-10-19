const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../utils/bookingOtpSms.js'), 'utf8');
const booking = { id: 23, bookingCode: 'NLR2600023', userId: 1, status: 'confirmed', serviceOtp: '0123', otpVerifiedAt: null };

function setup(phone = '9876543210', failure = false) {
  const sends = [];
  const logs = [];
  const context = { module: { exports: {} }, require(name) {
    if (name === './smsUtils') return { sendBookingOtp: async (...args) => {
      sends.push(args);
      if (failure) throw Error('private provider details');
    } };
    if (name === './logger') return { warn: m => logs.push(m) };
    if (name.endsWith('/user.model')) return { findByPk: async id => {
      assert.equal(id, 1); return phone === null ? null : { phone };
    } };
    throw Error(`Unexpected module: ${name}`);
  } };
  vm.runInNewContext(source, context);
  return { ...context.module.exports, sends, logs };
}

function modelHooks(sendBookingOtpSms) {
  let hooks;
  const context = { module: { exports: {} }, require(name) {
    if (name === 'crypto' || name === 'sequelize') return require(name);
    if (name.endsWith('/dbconnect')) return { sequelize: { define: (name, fields, options) => {
      hooks = options.hooks; return {};
    } } };
    if (name.endsWith('/bookingOtpSms')) return { sendBookingOtpSms };
    return {};
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../api/bookings/models/booking.model.js'), 'utf8'), context);
  return hooks;
}

test('sends the same in-app service OTP through the existing SMS sender, preserving leading zeroes', async () => {
  const api = setup();
  const original = { ...booking };
  await api.sendBookingOtpSms(booking);
  assert.equal(api.sends.length, 1);
  assert.equal(api.sends[0][0], '9876543210');
  assert.equal(api.sends[0][1], '0123');
  assert.equal(api.sends[0][2], 'NLR2600023');
  assert.deepEqual(booking, original);
});

test('pending, completed, missing, and already-verified OTPs do not send', async () => {
  const api = setup();
  for (const values of [{ status: 'pending' }, { status: 'completed' }, { serviceOtp: null }, { serviceOtp: 'bad' }, { otpVerifiedAt: new Date() }]) {
    await api.sendBookingOtpSms({ ...booking, ...values });
  }
  assert.equal(api.sends.length, 0);
});

test('uses the customer phone, normalizing Indian country codes', async () => {
  for (const phone of ['+91 98765-43210', '919876543210', '09876543210']) {
    const api = setup(phone);
    await api.sendBookingOtpSms(booking);
    assert.equal(api.sends[0][0], '9876543210');
  }
});

test('missing and invalid customer phones do not break confirmation', async () => {
  for (const phone of [null, 'invalid', '123']) {
    const api = setup(phone);
    await api.sendBookingOtpSms(booking);
    assert.equal(api.sends.length, 0);
  }
});

test('SMS failure does not reject confirmation or log the OTP/private error', async () => {
  const api = setup('9876543210', true);
  await api.sendBookingOtpSms(booking);
  assert.equal(api.sends.length, 1);
  assert.doesNotMatch(api.logs.join(' '), /0123|private provider details/);
});

test('transactional confirmation waits for commit and sends nothing on rollback', async () => {
  const api = setup();
  const callbacks = [];
  await api.sendBookingOtpSms(booking, { transaction: { afterCommit: fn => callbacks.push(fn) } });
  assert.equal(api.sends.length, 0);
  await callbacks[0]();
  assert.equal(api.sends.length, 1);
  const rolledBack = setup();
  await rolledBack.sendBookingOtpSms(booking, { transaction: { afterCommit() {} } });
  assert.equal(rolledBack.sends.length, 0);
});

test('model hooks cover confirmed creation and status transitions, skipping unrelated edits', async () => {
  const api = setup();
  const hooks = modelHooks(api.sendBookingOtpSms);
  await hooks.afterCreate({ ...booking, status: 'pending' }, {});
  assert.equal(api.sends.length, 0);
  await hooks.afterCreate(booking, {});
  assert.equal(api.sends.length, 1);
  await hooks.afterUpdate({ ...booking, changed: () => true }, {});
  assert.equal(api.sends.length, 2);
  await hooks.afterUpdate({ ...booking, changed: () => false }, {});
  await hooks.afterUpdate({ ...booking, status: 'in_progress', changed: () => true }, {});
  assert.equal(api.sends.length, 2);
});

test('the existing login SMS text and provider template remain intact', async () => {
  const calls = [];
  const context = { module: { exports: {} }, require(name) {
    if (name === 'axios') return { get: async (...args) => { calls.push(args); return { data: 'OK' }; } };
    if (name === './logger') return { info() {}, error() {} };
    if (name === '../config') return { MOCK_SMS: false, SUNSTECH_SMS_KEY: 'test', SUNSTECH_SMS_ROUTE_ID: '13', SUNSTECH_SMS_SENDER_ID: 'GDWOTP', SUNSTECH_SMS_TEMPLATE_ID: 'template-id', SUNSTECH_BOOKING_SMS_TEMPLATE_ID: 'booking-template-id' };
    throw Error(name);
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../utils/smsUtils.js'), 'utf8'), context);
  await context.module.exports.sendOtp('9876543210', '4321');
  assert.equal(calls[0][1].params.msg, 'Your OTP for verification is 4321. Do not share this with anyone. - Godavari Wave Technologies');
  assert.equal(calls[0][1].params.template_id, 'template-id');
  assert.equal(calls[0][1].timeout, undefined);
  await context.module.exports.sendOtp('9876543210', '0123', { timeout: 5000 });
  assert.equal(calls[1][1].timeout, 5000);
  assert.match(calls[1][1].params.msg, /0123/);
  await context.module.exports.sendBookingOtp('9876543210', '0123', 'NLR2600023');
  assert.equal(calls[2][1].params.msg, 'Your Beyomo booking NLR2600023 is confirmed. Your service OTP is 0123. Share this code with your partner only when the service starts. - Godavari Wave Technologies');
  assert.equal(calls[2][1].params.template_id, 'booking-template-id');
  assert.equal(calls[2][1].timeout, 5000);
});

test('Admin status confirmation sends once; repeating the same status does not resend', async () => {
  let sends = 0;
  const saved = { ...booking, status: 'pending', services: [], reload: async () => saved };
  const context = { module: { exports: {} }, require(name) {
    if (name.endsWith('/booking.model')) return {
      findByPk: async () => saved,
      update: async values => { Object.assign(saved, values); return [1]; },
    };
    if (name.endsWith('/bookingOtpSms')) return { sendBookingOtpSms: async b => {
      assert.equal(b.status, 'confirmed'); assert.equal(b.serviceOtp, '0123'); sends++;
    } };
    return {};
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../api/adminUsers/services/v1/admin.service.js'), 'utf8'), context);
  await context.module.exports.updateBookingStatus(saved.id, 'confirmed');
  await context.module.exports.updateBookingStatus(saved.id, 'confirmed');
  assert.equal(sends, 1);
});

test('missing booking template falls back to the working OTP text and template', async () => {
  const requests = [];
  const config = { MOCK_SMS: false, SUNSTECH_SMS_TEMPLATE_ID: 'login-only' };
  const logs = [];
  const context = { module: { exports: {} }, require(name) {
    if (name === '../config') return config;
    if (name === 'axios') return { get: async (...args) => { requests.push(args); return { data: 'OK' }; } };
    if (name === './logger') return { warn: m => logs.push(m), info: m => logs.push(m), error() {} };
    throw Error(name);
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../utils/smsUtils.js'), 'utf8'), context);
  const result = await context.module.exports.sendBookingOtp('9876543210', '0123', 'NLR2600023');
  assert.equal(result.success, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0][1].params.template_id, 'login-only');
  assert.equal(requests[0][1].params.msg, 'Your OTP for verification is 0123. Do not share this with anyone. - Godavari Wave Technologies');
  assert.equal(requests[0][1].timeout, 5000);
});

test('payment verification sends only when it changes a pending booking to confirmed', async () => {
  let sends = 0;
  const saved = { ...booking, status: 'pending' };
  const context = { module: { exports: {} }, require(name) {
    if (name.endsWith('/payment.model')) return { update: async () => {}, findOne: async () => ({ id: 1, bookingId: saved.id }) };
    if (name.endsWith('/booking.model')) return {
      update: async values => {
        if (values.status && saved.status !== 'pending') return [0];
        Object.assign(saved, values); return [1];
      },
      findByPk: async () => saved,
    };
    if (name.endsWith('/notification.model')) return { create: async () => {} };
    if (name.endsWith('/paymentUtils')) return { verifySignature: () => true };
    if (name.endsWith('/bookingOtpSms')) return { sendBookingOtpSms: async b => {
      assert.equal(b.serviceOtp, '0123'); sends++;
    } };
    return {};
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../api/payments/services/v1/payments.service.js'), 'utf8'), context);
  await context.module.exports.verifyPayment(1, {});
  await context.module.exports.verifyPayment(1, {});
  assert.equal(sends, 1);
});
