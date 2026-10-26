import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingBaseAmount, bookingServicePayouts} from './bookingAmounts.js';

test('adding a service updates the displayed base immediately even with an old base field', () => {
  const previous = {baseAmount: '500.00', totalAmount: '525.00', taxAmount: '25.00'};
  const saved = {totalAmount: '735.00', taxAmount: '35.00'};
  assert.equal(bookingBaseAmount({...previous, ...saved}), 700);
});

test('coupon discount is included in the base amount', () => {
  assert.equal(bookingBaseAmount({totalAmount: 630, taxAmount: 30, couponDiscountAmount: 100}), 700);
});

test('package pricing uses the billed amount rather than individual service prices', () => {
  assert.equal(bookingBaseAmount({baseAmount: 1500, totalAmount: 1048.95, taxAmount: 49.95,
    services: [{price: 1000}, {price: 500}]}), 999);
});

test('zero amounts and legacy bookings are supported', () => {
  assert.equal(bookingBaseAmount({baseAmount: 500, totalAmount: 0, taxAmount: 0}), 0);
  assert.equal(bookingBaseAmount({baseAmount: '999.00'}), 999);
  assert.equal(bookingBaseAmount(), 0);
});

test('removed services do not reduce the current partner payout', () => {
  const payouts = bookingServicePayouts([
    {price: '1859', assignedPartnerId: 1},
    {price: '50', removed: true},
    {price: '100', removed: true, assignedPartnerId: 2},
  ], 1301);
  assert.deepEqual(payouts, [{name: 'Partner', amount: 1301}]);
});

test('active package services divide the billed earning by price and quantity', () => {
  const payouts = bookingServicePayouts([
    {price: '100', qty: 2, assignedPartnerId: 1},
    {price: '100', assignedPartnerId: 2},
  ], 210);
  assert.deepEqual(payouts.map(p => p.amount), [140, 70]);
});

test('unassigned active services reserve their share and zero earnings stay zero', () => {
  const services = [{price: 100, assignedPartnerId: 1}, {price: 100}];
  assert.equal(bookingServicePayouts(services, 140)[0].amount, 70);
  assert.equal(bookingServicePayouts(services, 0)[0].amount, 0);
  assert.deepEqual(bookingServicePayouts(null, 140), []);
});
