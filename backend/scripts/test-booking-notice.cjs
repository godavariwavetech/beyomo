// Exercise real controllers and app date helpers without DB writes or notifications.
process.env.TZ = 'Asia/Kolkata';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const parser = require('../../beyomo/node_modules/@babel/parser');
const generate = require('../../beyomo/node_modules/@babel/generator').default;
let now = Date.parse('2030-10-24T05:30:00Z'); // 11 AM IST
class Clock extends Date { static now() { return now; } }

function loadController(relative) {
  const module = {exports: {}};
  const service = new Proxy({}, {get: () => async () => ({id: 1})});
  const execute = vm.runInThisContext(`(function(require, module, exports, Date) {\n${fs.readFileSync(path.resolve(__dirname, relative), 'utf8')}\n})`);
  execute(id => {
      if (id === 'joi') return require('joi');
      if (id.endsWith('/catchAsync')) return fn => fn;
      if (id.endsWith('/appError')) return require('../utils/errorHandlers/appError');
      return service;
    }, module, module.exports, Clock);
  return module.exports;
}

(async () => {
  const customer = loadController('../api/bookings/controllers/v1/bookings.controller.js');
  const admin = loadController('../api/adminUsers/controllers/v1/admin.controller.js');
  const body = {userId: 1, services: [{id: 1, qty: 1}], address: {line1: 'Test', city: 'Nellore'}, paymentMode: 'cod'};
  for (const [name, handler, create, isAdmin] of [
    ['customer create', customer.createBooking, true, false],
    ['customer reschedule', customer.rescheduleBooking, false, false],
    ['admin create', admin.createBookingForCustomer, true, true],
    ['admin reschedule', admin.rescheduleBooking, false, true],
  ]) {
    for (const [delta, accepted] of [[30 * 60000 - 1, false], [30 * 60000, true], [45 * 60000, true]]) {
      let error, status;
      const scheduledAt = new Date(now + delta).toISOString();
      const payload = create ? {...body, scheduledAt} : {scheduledAt};
      if (!isAdmin) delete payload.userId;
      const req = {body: payload, user: {userId: 1}, admin: {userId: 1}, params: {id: 1}};
      const res = {status(code) {status = code; return this;}, json() {}};
      await handler(req, res, err => {error = err;});
      if (accepted) {
        assert.equal(error, undefined, `${name}: ${error?.message}`);
        assert.ok(status === 200 || status === 201);
      } else assert.match(error?.message || '', /30 minutes/);
    }
    console.log(`PASS ${name}: rejects under 30 minutes, accepts 30 and 45 minutes.`);
  }

  const source = fs.readFileSync(path.resolve(__dirname, '../../beyomo/src/screens/Order/AddressPaymentScreen.tsx'), 'utf8');
  const ast = parser.parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
  const declaration = ast.program.body.flatMap(node => node.declarations || []).find(node => node.id?.name === 'getDefaultDate');
  const getDefault = vm.runInNewContext(generate(declaration.init).code, {
    Date: Clock, MIN_BOOKING_NOTICE_MS: 30 * 60000, BOOKING_WINDOW_START_HOUR: 8, BOOKING_WINDOW_END_HOUR: 20,
  });
  for (const [time, expected] of [
    ['2030-10-24T11:00:00+05:30', '2030-10-24T11:30:00+05:30'],
    ['2030-10-24T11:00:25+05:30', '2030-10-24T11:31:00+05:30'],
    ['2030-10-24T06:00:00+05:30', '2030-10-24T08:00:00+05:30'],
    ['2030-10-24T19:45:00+05:30', '2030-10-25T08:00:00+05:30'],
  ]) {
    now = Date.parse(time);
    assert.equal(getDefault().getTime(), Date.parse(expected));
    assert.ok(getDefault().getTime() >= now + 30 * 60000);
  }
  console.log('PASS checkout default: 11 AM becomes 11:30, rounds up seconds, respects opening and closing.');
})().catch(error => {console.error(error); process.exitCode = 1;});
