// Exercise the admin edit path without persisting changes or sending notifications.
require('dotenv').config();
const assert = require('node:assert/strict');
const {sequelize} = require('../utils/dbconnect');
require('../utils/models');
const Booking = require('../api/bookings/models/booking.model');
const User = require('../api/users/models/user.model');
const Notification = require('../api/notifications/models/notification.model');
const Package = require('../api/packages/models/package.model');
const admin = require('../api/adminUsers/services/v1/admin.service');

(async () => {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST || 'localhost'));
  const original = {find: Booking.findByPk, user: User.findByPk, notification: Notification.create, packages: Package.findAll};
  try {
    let saved;
    const booking = {id: 1, bookingCode: 'TEST', status: 'confirmed', userId: 1,
      couponDiscountAmount: 0, packages: [{packageId: 39, price: 999, qty: 1}],
      services: [{serviceId: 264, price: 410, qty: 1, packageId: 39, addedByPackage: true},
        {serviceId: 165, price: 500, qty: 1, packageId: 39, addedByPackage: true},
        {serviceId: 126, price: 450, qty: 1, packageId: 39, addedByPackage: true},
        {serviceId: 96, price: 50, qty: 1}],
      update: async values => {saved = values;}};
    Booking.findByPk = async () => booking;
    User.findByPk = async () => null;
    Notification.create = async () => {};
    Package.findAll = async () => [{id:39, price:999, gstPercent:5, partnerPercent:70, adminPercent:30}];
    await admin.editBookingServices(1, [], [3]);
    assert.equal(saved.baseAmount, 999);
    assert.equal(saved.taxAmount, 49.95);
    assert.equal(saved.totalAmount, 1048.95);
    assert.equal(saved.partnerEarning, 699.3);
    assert.equal(saved.services[3].removed, true);
    booking.packages[0].qty = 2;
    await admin.editBookingServices(1, [], [3]);
    assert.equal(saved.baseAmount, 1998);
    assert.equal(saved.totalAmount, 2097.9);
    console.log('PASS: admin removal retains package price, GST, earnings and package quantity.');
  } finally {
    Booking.findByPk = original.find; User.findByPk = original.user;
    Notification.create = original.notification; Package.findAll = original.packages;
    await sequelize.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
