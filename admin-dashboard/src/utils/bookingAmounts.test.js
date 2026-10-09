import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingBaseAmount} from './bookingAmounts.js';

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
