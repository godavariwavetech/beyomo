const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const helperSource = fs.readFileSync(path.join(__dirname, '../api/partners/services/v1/staleServiceOffers.js'), 'utf8');
async function checkSaved({status = 'confirmed', offer = null, overrides = {}, unavailable = false, packages = []} = {}) {
  let writes = 0;
  const booking = {
    status, cityId: 2, baseAmount: 260, couponDiscountAmount: 10, discountAmount: 5, packages,
    services: [
      {serviceId: 3, name: 'Extra', price: 80, basePrice: 100, offerPrice: 80, qty: 2, addedByPartner: true, ...overrides},
      {serviceId: 4, name: 'Original', price: 100, qty: 1},
    ],
    async update(values) {writes++; Object.assign(this, values);},
    async reload() {return this;},
    setDataValue(key, value) {this[key] = value;},
  };
  const context = {module: {exports: {}}, require(name) {
    if (name.includes('service.model')) return {findAll: async () => unavailable ? [] : [{id: 3, basePrice: 100, offerPrice: offer}]};
    if (name.includes('package.model')) return {findAll: async () => [{id: 10}], findByPk: async () => null};
    if (name.includes('cityPricing')) return {cityPriceResolver: async () => () => 120};
    if (name.includes('revenueSplit')) return {
      resolveRatesForBooking: async () => ({gstPercent: 5, partnerPercent: 80}),
      resolveRatesForMultiPackageBooking: async () => ({gstPercent: 5, partnerPercent: 80}),
    };
    if (name.includes('appError')) return Error;
    throw Error(name);
  }};
  vm.createContext(context);
  vm.runInContext(helperSource, context);
  const names = await context.module.exports(booking);
  return {booking, names, writes, refresh: () => context.module.exports(booking)};
}

async function checkClient() {
  const babel = require('../../beyomopartner/node_modules/@babel/core');
  const source = fs.readFileSync(path.join(__dirname, '../../beyomopartner/src/hooks/usePartnerStaleOffers.ts'), 'utf8');
  const code = babel.transformSync(source, {filename: 'usePartnerStaleOffers.ts',
    presets: [require.resolve('../../beyomopartner/node_modules/@babel/preset-typescript')],
    plugins: [require.resolve('../../beyomopartner/node_modules/@babel/plugin-transform-modules-commonjs')],
    configFile: false, babelrc: false}).code;
  const calls = [];
  const options = {bookingId: 9, cityId: 2,
    savedServices: [{serviceId: 3, name: 'Saved', basePrice: 100, offerPrice: 80, addedByPartner: true}],
    localServices: [{id: 4, name: 'Selected', basePrice: 100, offerPrice: 80}],
    onLocalUpdates: updates => calls.push(['local', updates]),
    onBookingUpdate: booking => calls.push(['saved', booking]),
    showAlert: (title, message) => calls.push(['alert', title, message]),
  };
  let failed = false;
  const api = {
    get: async (endpoint, config) => {
      assert.equal(config.params.cityId, 2);
      if (failed) throw Error('Network failed');
      const id = Number(endpoint.split('/').pop());
      return {data: {status: true, data: {id, name: id === 3 ? 'Saved' : 'Selected', basePrice: 120, offerPrice: null}}};
    },
    patch: async (endpoint, body) => {
      assert.equal(body.refreshRemovedOffers, true);
      return {data: {status: true, data: {services: [{serviceId: 3, name: 'Saved', price: 120, offerPrice: null}], totalAmount: 126, staleOfferServices: ['Saved']}}};
    },
  };
  const context = {exports: {}, require(name) {
    if (name === 'react') return {useCallback: fn => fn, useRef: value => ({current: value})};
    if (name === 'react-native') return {};
    if (name === '@react-navigation/native') return {useFocusEffect: () => {}};
    if (name.includes('utils/api')) return {__esModule: true, default: api};
    if (name.includes('config/config')) return {endpoints: {SERVICES: '/services', PARTNER_EXTRA_SERVICES: id => id}};
    throw Error(name);
  }};
  vm.createContext(context);
  vm.runInContext(code, context);
  const snapshot = {serviceId: 3, basePrice: 100, offerPrice: 80};
  const restored = context.exports.retainServiceOfferSnapshots([{serviceId: 3, addedByPartner: true, price: 80}], [snapshot]);
  assert.equal(restored[0].offerPrice, 80, 'Saving must retain the known offer when the response omits metadata');
  assert.equal(context.exports.retainServiceOfferSnapshots([{serviceId: 3, addedByPartner: true, price: 100}], [snapshot])[0].offerPrice, undefined, 'A saved normal price must not regain the offer');
  const refresh = context.exports.default(options);
  assert.equal(await refresh(), true, 'Stale offer pauses the next action');
  assert.equal(calls.find(c => c[0] === 'local')[1].get('4').basePrice, 120);
  assert.equal(calls.find(c => c[0] === 'saved')[1].totalAmount, 126);
  assert.match(calls.find(c => c[0] === 'alert')[2], /Offer is no longer available for this service/);
  failed = true;
  await assert.rejects(refresh(), /Network failed/, 'Verification failure must block the action');
  failed = false;
  calls.length = 0;
  api.patch = async () => {throw Error('Old backend rejects refreshRemovedOffers');};
  assert.equal(await refresh(), true, 'An unpatched backend must not allow Start Service with a known stale offer');
  assert.match(calls.find(c => c[0] === 'alert')[2], /Offer is no longer available for this service/);
  assert.match(calls.find(c => c[0] === 'alert')[2], /Unable to update the booking total/);
}

async function checkStatusGuards() {
  const source = fs.readFileSync(path.join(__dirname, '../api/partners/services/v1/partners.service.js'), 'utf8');
  const start = source.indexOf('const updateBookingStatus =');
  const end = source.indexOf('\nconst ', start + 1);
  for (const [initial, target] of [['confirmed', 'in_progress'], ['in_progress', 'completed']]) {
    const booking = {partnerId: 7, status: initial, services: [],
      update: async () => {throw Error('Status must not change before reviewing the new price');}};
    const context = {Booking: {findByPk: async () => booking},
      refreshRemovedServiceOffers: async () => ['Extra'], AppError: Error};
    vm.createContext(context);
    vm.runInContext(source.slice(start, end) + '\nthis.updateStatus = updateBookingStatus;', context);
    assert.equal(await context.updateStatus(7, 9, target), booking);
    assert.equal(booking.status, initial);
  }
}

(async () => {
  for (const status of ['confirmed', 'in_progress']) {
    const {booking, names, writes, refresh} = await checkSaved({status});
    assert.equal(booking.status, status, 'Offer correction must not advance job status');
    assert.equal(names[0], 'Extra');
    assert.equal(writes, 1);
    assert.equal(booking.services[0].price, 120, 'Use city base price');
    assert.equal(booking.services[0].offerPrice, null);
    assert.equal(booking.services[0].qty, 2);
    assert.equal(booking.services[1].price, 100);
    assert.equal(booking.baseAmount, 340);
    assert.equal(booking.totalAmount, 341.25);
    assert.equal(booking.partnerEarning, 260);
    assert.equal((await refresh()).length, 0, 'Correction is idempotent');
  }
  assert.equal((await checkSaved({offer: 80})).writes, 0);
  for (const overrides of [{removed: true}, {addedByPackage: true}, {addedByOffer: true}, {isAddOn: true}, {addedByPartner: false}]) {
    assert.equal((await checkSaved({overrides})).writes, 0);
  }
  const packaged = await checkSaved({packages: [{packageId: 10, price: 999, qty: 1}]});
  assert.equal(packaged.booking.baseAmount, 340, 'Preserve existing package base and apply only price difference');
  await assert.rejects(checkSaved({unavailable: true}), /Unable to verify/);
  await checkClient();
  await checkStatusGuards();
  console.log('Partner saved and selected stale-offer checks passed for Review Order and In Progress');
})().catch(error => {console.error(error); process.exitCode = 1;});
