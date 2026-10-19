import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsAppPhone, bookingWhatsAppMessage, bookingWhatsAppLink } from './bookingWhatsApp.js';

const customer = { name: 'Test & Customer', phone: '9876543210' };
const booking = { id: 1, bookingCode: 'NLR2600001', status: 'confirmed', serviceOtp: '0123',
  services: [{ name: 'Facial', qty: 2 }, { name: 'Removed service', removed: true }],
  scheduledAt: '2026-10-20T04:30:00Z', totalAmount: '1050.00', addressLine1: '10 Test Road', addressCity: 'Nellore' };

test('WhatsApp numbers support Indian local, country-prefixed, and explicit international formats', () => {
  for (const phone of ['9876543210', '09876543210', '+91 98765-43210', '919876543210', '00919876543210']) {
    assert.equal(whatsAppPhone(phone), '919876543210');
  }
  assert.equal(whatsAppPhone('+1 (415) 555-1234'), '14155551234');
  for (const phone of [null, '', 'invalid', '123', '+0000']) assert.equal(whatsAppPhone(phone), null);
});

test('confirmation includes saved booking details and the exact service OTP', () => {
  const message = bookingWhatsAppMessage(booking, customer);
  assert.match(message, /Hi Test & Customer/);
  assert.match(message, /NLR2600001 is confirmed/);
  assert.match(message, /Facial × 2/);
  assert.doesNotMatch(message, /Removed service/);
  assert.match(message, /20 Oct 2026.*10:00.*am IST/i);
  assert.match(message, /₹1,050/);
  assert.match(message, /Address: 10 Test Road, Nellore/);
  assert.match(message, /Service OTP: 0123/);
  assert.match(message, /only when the service starts/);
});

test('a pending booking is described as created, not confirmed', () => {
  const message = bookingWhatsAppMessage({ ...booking, status: 'pending' }, customer);
  assert.match(message, /has been created/);
  assert.doesNotMatch(message, /is confirmed/);
});

test('click-to-chat safely encodes the message and targets the selected customer', () => {
  const link = new URL(bookingWhatsAppLink(booking, customer));
  assert.equal(link.origin, 'https://wa.me');
  assert.equal(link.pathname, '/919876543210');
  assert.equal(link.searchParams.get('text'), bookingWhatsAppMessage(booking, customer));
});

test('no link is provided without a saved booking or valid phone', () => {
  assert.equal(bookingWhatsAppLink(null, customer), null);
  assert.equal(bookingWhatsAppLink({}, customer), null);
  assert.equal(bookingWhatsAppLink(booking, { phone: 'bad' }), null);
});

test('JSON service data works and missing or used OTPs are not invented or shared', () => {
  const message = bookingWhatsAppMessage({ ...booking, services: JSON.stringify(booking.services), serviceOtp: null }, customer);
  assert.match(message, /Facial/);
  assert.doesNotMatch(message, /Service OTP/);
  assert.doesNotMatch(bookingWhatsAppMessage({ ...booking, otpVerifiedAt: '2026-10-20' }, customer), /Service OTP/);
});
