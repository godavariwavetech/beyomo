const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../utils/whatsappUtils.js'), 'utf8');
const booking = {
  id: 23, bookingCode: 'NLR2600023', scheduledAt: '2026-10-20T04:30:00Z', totalAmount: '1050.00',
  addressLine1: '10 Test Road', addressCity: 'Nellore', addressState: 'Andhra Pradesh', addressPincode: '524001',
};
const customer = { name: 'Test Customer', phone: '9876543210' };

function setup(overrides = {}, post = async () => ({ data: { messages: [{ id: 'wamid.test' }] } })) {
  const calls = [];
  const logs = [];
  const config = {
    WHATSAPP_ENABLED: true, WHATSAPP_ACCESS_TOKEN: 'test-secret', WHATSAPP_PHONE_NUMBER_ID: '123456789',
    WHATSAPP_API_VERSION: 'v23.0', WHATSAPP_BOOKING_TEMPLATE: 'beyomo_booking_confirmation', WHATSAPP_TEMPLATE_LANGUAGE: 'en',
    ...overrides,
  };
  const context = { module: { exports: {} }, require(name) {
    if (name === '../config') return config;
    if (name === './logger') return { warn: m => logs.push(m), info: m => logs.push(m) };
    if (name === 'axios') return { post: async (...args) => { calls.push(args); return post(...args); } };
    throw Error(`Unexpected module: ${name}`);
  } };
  vm.runInNewContext(source, context);
  return { ...context.module.exports, calls, logs };
}

test('normalizes Indian numbers and preserves explicit international codes', () => {
  const { normalizeWhatsAppPhone: normalize } = setup();
  for (const phone of ['9876543210', '09876543210', '919876543210', '+91 98765-43210', '00919876543210']) {
    assert.equal(normalize(phone), '919876543210', phone);
  }
  assert.equal(normalize('+1 (415) 555-1234'), '14155551234');
  for (const phone of [null, '', '123', 'abc9876543210', '+0000000000', '+1234567890123456']) assert.equal(normalize(phone), null);
});

test('disabled and incomplete configurations never make an HTTP request', async () => {
  for (const config of [
    { WHATSAPP_ENABLED: false }, { WHATSAPP_ACCESS_TOKEN: '' }, { WHATSAPP_PHONE_NUMBER_ID: '' },
    { WHATSAPP_API_VERSION: '' }, { WHATSAPP_API_VERSION: '../wrong' }, { WHATSAPP_PHONE_NUMBER_ID: '../wrong' },
  ]) {
    const api = setup(config);
    const result = await api.sendBookingWhatsAppConfirmation(booking, customer, 'Facial');
    assert.equal(result.status, 'skipped');
    assert.equal(api.calls.length, 0);
  }
});

test('sends the approved template with correct recipient and six positional parameters', async () => {
  const api = setup();
  const result = await api.sendBookingWhatsAppConfirmation(booking, customer, 'Facial');
  assert.equal(result.status, 'accepted');
  assert.equal(result.messageId, 'wamid.test');
  assert.equal(api.calls.length, 1);
  const [url, payload, options] = api.calls[0];
  assert.equal(url, 'https://graph.facebook.com/v23.0/123456789/messages');
  assert.equal(payload.to, '919876543210');
  assert.equal(payload.type, 'template');
  assert.equal(payload.messaging_product, 'whatsapp');
  assert.equal(payload.template.name, 'beyomo_booking_confirmation');
  assert.equal(payload.template.language.code, 'en');
  const params = payload.template.components[0].parameters;
  assert.equal(params.length, 6);
  assert.equal(params[0].text, 'Test Customer');
  assert.equal(params[1].text, 'NLR2600023');
  assert.equal(params[2].text, 'Facial');
  assert.match(params[3].text, /20 Oct 2026.*10:00.*am IST/i);
  assert.equal(params[4].text, '₹1,050.00');
  assert.match(params[5].text, /10 Test Road, Nellore/);
  assert.equal(options.headers.Authorization, 'Bearer test-secret');
  assert.equal(options.timeout, 5000);
  assert.equal(options.maxRedirects, 0);
});

test('invalid and missing recipients are skipped without sending', async () => {
  for (const value of [null, { phone: 'bad' }]) {
    const api = setup();
    assert.equal((await api.sendBookingWhatsAppConfirmation(booking, value, 'Facial')).reason, 'phone');
    assert.equal(api.calls.length, 0);
  }
});

test('API errors and timeouts do not reject the booking or expose private request details', async () => {
  const error = Object.assign(new Error('test-secret 9876543210 private customer info'), {
    response: { status: 400, data: { error: { code: 132001, message: 'test-secret private customer info' } } },
  });
  for (const failure of [error, Error('timeout')]) {
    const api = setup({}, async () => { throw failure; });
    assert.equal((await api.sendBookingWhatsAppConfirmation(booking, customer, 'Facial')).status, 'failed');
    assert.equal(api.calls.length, 1); // No automatic retry that could duplicate a message.
    assert.doesNotMatch(api.logs.join(' '), /test-secret|9876543210|private customer info/);
  }
});

test('a provider response without a message ID is not treated as accepted', async () => {
  const api = setup({}, async () => ({ data: {} }));
  assert.equal((await api.sendBookingWhatsAppConfirmation(booking, customer, 'Facial')).status, 'failed');
});

test('invalid booking details never reach the provider', async () => {
  for (const invalid of [{ scheduledAt: 'bad' }, { totalAmount: 'bad' }, { bookingCode: '' }]) {
    const api = setup();
    assert.equal((await api.sendBookingWhatsAppConfirmation({ ...booking, ...invalid }, customer, 'Facial')).status, 'failed');
    assert.equal(api.calls.length, 0);
  }
});

test('unnamed customers receive a usable greeting and template text is single line', async () => {
  const api = setup();
  await api.sendBookingWhatsAppConfirmation(booking, { ...customer, name: null }, 'Facial\n\tTreatment');
  const params = api.calls[0][1].template.components[0].parameters;
  assert.equal(params[0].text, 'Customer');
  assert.equal(params[2].text, 'Facial Treatment');
});

test('booking persistence triggers WhatsApp once after save and before other notifications', async () => {
  const events = [];
  const context = { module: { exports: {} }, require(name) {
    if (name === '../../models/booking.model') return {
      create: async () => { events.push('saved'); return booking; }, findByPk: async () => booking,
    };
    if (name.endsWith('/user.model')) return { findByPk: async () => customer };
    if (name.endsWith('/whatsappUtils')) return { sendBookingWhatsAppConfirmation: async (saved, recipient, service) => {
      assert.equal(saved, booking); assert.equal(recipient, customer); assert.equal(service, 'Facial');
      events.push('whatsapp'); return { status: 'failed' };
    } };
    if (name.endsWith('/firebaseUtils')) return { pushTokensFor: () => [], sendPushNotification: async () => {} };
    if (name.endsWith('/notification.model')) return { create: async () => { events.push('in-app'); } };
    return {};
  } };
  const service = fs.readFileSync(path.join(__dirname, '../api/bookings/services/v1/bookings.service.js'), 'utf8');
  vm.runInNewContext(service, context);
  const result = await context.module.exports.persistBooking({
    userId: 1, bookingRow: booking, primaryServiceName: 'Facial', partnerId: 2,
  });
  assert.equal(result, booking);
  assert.deepEqual(events, ['saved', 'whatsapp', 'in-app']);
});

test('legacy admin creation also sends once after saving a custom-service booking', async () => {
  const events = [];
  const context = { module: { exports: {} }, require(name) {
    if (name.endsWith('/booking.model')) return { create: async () => { events.push('saved'); return booking; } };
    if (name.endsWith('/user.model')) return { findByPk: async () => customer };
    if (name.endsWith('/partner.model')) return { findOne: async () => ({ id: 2 }) };
    if (name.endsWith('/revenueSplit')) return { resolveRatesForBooking: async () => ({ partnerPercent: 80, gstPercent: 5 }) };
    if (name.endsWith('/whatsappUtils')) return { sendBookingWhatsAppConfirmation: async (saved, recipient) => {
      assert.equal(saved, booking); assert.equal(recipient, customer); events.push('whatsapp');
    } };
    if (name.endsWith('/firebaseUtils')) return { pushTokensFor: () => [], sendPushNotification: async () => {} };
    if (name.endsWith('/notification.model')) return { create: async () => { events.push('in-app'); } };
    return {};
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../api/adminUsers/services/v1/admin.service.js'), 'utf8'), context);
  await context.module.exports.createBookingForCustomer(7, {
    userId: 1, partnerId: 2, address: { line1: 'Test road' }, scheduledAt: booking.scheduledAt,
    services: [{ isAddOn: true, name: 'Facial', price: 1000, qty: 1 }],
  });
  assert.deepEqual(events, ['saved', 'whatsapp', 'in-app']);
});

test('a failed booking save does not send a WhatsApp confirmation', async () => {
  let sent = false;
  const context = { module: { exports: {} }, require(name) {
    if (name === '../../models/booking.model') return { create: async () => { throw Error('save failed'); } };
    if (name.endsWith('/whatsappUtils')) return { sendBookingWhatsAppConfirmation: async () => { sent = true; } };
    return {};
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../api/bookings/services/v1/bookings.service.js'), 'utf8'), context);
  await assert.rejects(context.module.exports.persistBooking({ userId: 1, bookingRow: booking }), /save failed/);
  assert.equal(sent, false);
});
