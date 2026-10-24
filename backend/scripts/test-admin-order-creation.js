// Local integration check. All fixtures and created bookings are rolled back.
require('dotenv').config({quiet: true});
const assert = require('node:assert/strict');
const {sequelize} = require('../utils/dbconnect');
const firebase = require('../utils/firebaseUtils');
firebase.sendPushNotification = async () => {};
require('../utils/models');
const User = require('../api/users/models/user.model');
const City = require('../api/cities/models/city.model');
const Category = require('../api/services/models/serviceCategory.model');
const Service = require('../api/services/models/service.model');
const Mapping = require('../api/services/models/service_city_map.model');
const Package = require('../api/packages/models/package.model');
const Coupon = require('../api/coupons/models/coupon.model');
const Offer = require('../api/offers/models/offer.model');
const Booking = require('../api/bookings/models/booking.model');
const Partner = require('../api/partners/models/partner.model');
const orders = require('../api/adminUsers/services/v1/orderCreation.service');
const express = require('express');
const {signToken} = require('../utils/jwtUtils');

(async () => {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST || 'localhost'), 'Local database only');
  const transaction = await sequelize.transaction();
  const originalQuery = sequelize.query;
  sequelize.query = function(sql, options = {}) {
    return originalQuery.call(this, sql, {...options, transaction: options.transaction ?? transaction});
  };
  let server;
  try {
    const suffix = Date.now().toString();
    const city = await City.findOne({where: {isActive: true}});
    assert.ok(city, 'Local DB needs one active city');
    const customer = await User.create({name: 'Order integration fixture', phone: `test-${suffix}`});
    const category = await Category.create({name: `Order fixture ${suffix}`, gstPercent: 10, adminPercent: 20, partnerPercent: 80});
    const service = await Service.create({name:'Fixture service', categoryId:category.id, basePrice:1000, offerPrice:550, isActive:true});
    await Mapping.create({serviceId:service.id, cityId:city.id, customPrice:800, isActive:true});
    const combo = await Package.create({title:'Fixture combo', packageType:'fixed', price:700, originalPrice:1000,
      services:[{serviceId:service.id}], gstPercent:5, adminPercent:25, partnerPercent:75, cityIds:[city.id]});
    const flexible = await Package.create({title:'Fixture flexible', packageType:'flexible', price:600, serviceCount:1,
      services:[{serviceId:service.id}], gstPercent:10, adminPercent:20, partnerPercent:80, cityIds:[city.id]});
    const dates = {validFrom:new Date(Date.now()-86400000), validTill:new Date(Date.now()+7*86400000)};
    const coupon = await Coupon.create({code:`TEST${suffix}`, type:'flat', discount:100, ...dates});
    const offer = await Offer.create({title:'Fixture free offer', triggerType:'min_spend', triggerValue:{amount:500}, freeServiceId:service.id, cityId:city.id, ...dates});
    const payload = {useCustomerFlow:true, userId:customer.id, cityId:city.id,
      services:[{id:service.id, qty:1}], packages:[],
      address:{label:'Home',line1:'Test address',city:city.name,state:'Andhra Pradesh',pincode:'520001'},
      scheduledAt:new Date(Date.now()+86400000), paymentMode:'cod'};
    let row = await orders.preview(payload);
    assert.equal(row.baseAmount,550); assert.equal(row.totalAmount,605);
    assert.equal(await Booking.count({where:{userId:customer.id}}),0);
    const discounted = {...payload, couponCode:coupon.code, offerId:offer.id};
    row = await orders.preview(discounted);
    assert.equal(row.couponDiscountAmount,100); assert.equal(row.totalAmount,495);
    assert.ok(row.services.some(s => s.addedByOffer && s.price === 0));
    assert.equal((await coupon.reload()).usedCount,0);
    assert.equal((await offer.reload()).usedCount,0);
    const mixed = {...payload, packages:[{packageId:combo.id,qty:2,services:[{id:service.id,qty:2}]}]};
    row = await orders.preview(mixed);
    assert.equal(row.baseAmount,1950); assert.equal(row.packages[0].qty,2);
    assert.equal(row.totalAmount,2075.00); // weighted rate rounds to 6.41%
    row = await orders.preview({...payload, services:[], packages:[{packageId:flexible.id,qty:1,services:[{id:service.id,qty:1}]}]});
    assert.equal(row.totalAmount,660);
    // Customer carts can hold the same catalog package with different selections.
    // Preserve a distinct identity for each entry even when their service IDs overlap.
    const repeated = await require('../api/bookings/services/v1/bookings.service').prepareBooking(customer.id, {
      ...payload, services: [], packages: [0, 1].map(() => ({
        packageId: flexible.id, qty: 1, services: [{id: service.id, qty: 1}],
      })),
    });
    const selections = repeated.bookingRow.packages;
    assert.equal(selections.length, 2);
    assert.notEqual(selections[0].packageSelectionId, selections[1].packageSelectionId);
    assert.equal(repeated.bookingRow.baseAmount, 1200);
    assert.ok(selections.every(p => p.serviceCount === 1));
    assert.deepEqual(repeated.bookingRow.services.map(s => s.packageSelectionId), selections.map(p => p.packageSelectionId));
    row = await orders.preview({...payload, services:[{isAddOn:true,name:'Custom service',price:500,qty:1}]});
    assert.equal(row.totalAmount,525);
    await assert.rejects(orders.preview({...payload, services:[{isAddOn:true,name:'Small',price:100,qty:1}]}), /Minimum booking/);
    await assert.rejects(orders.preview({...mixed, packages:[{packageId:combo.id,qty:2,services:[{id:service.id,qty:1}]}]}), /quantity/);
    await assert.rejects(orders.create(1,{...payload,expectedTotal:1}), /Prices have changed/);

    const app = express(); app.use(express.json());
    app.use('/api/v1/admin',require('../api/adminUsers/routes/v1/admin.routes'));
    app.use((err,req,res,next) => res.status(err.statusCode || 500).json({message:err.message}));
    server = await new Promise(resolve => {const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const url=`http://127.0.0.1:${server.address().port}/api/v1/admin`;
    const token=signToken({userId:1,userType:'admin',role:'super_admin'});
    const headers={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
    assert.equal((await fetch(`${url}/booking-catalog?cityId=${city.id}`)).status,401);
    assert.equal((await fetch(`${url}/booking-catalog?cityId=${city.id}`,{headers})).status,200);
    assert.equal((await fetch(`${url}/bookings/preview`,{method:'POST',headers,body:JSON.stringify({...payload,paymentMode:'online'})})).status,400);
    assert.equal((await fetch(`${url}/bookings/preview`,{method:'POST',headers,body:JSON.stringify(discounted)})).status,200);

    const created = await fetch(`${url}/bookings`,{method:'POST',headers,body:JSON.stringify({...discounted,expectedTotal:495})});
    const createdBody = await created.json();
    assert.equal(created.status,201,JSON.stringify(createdBody));
    const booking = await Booking.findByPk(createdBody.data.id);
    assert.equal(booking.userId,customer.id); assert.equal(booking.createdByAdminId,1);
    assert.equal(booking.paymentMode,'cod'); assert.equal(booking.status,'pending');
    assert.equal(booking.paymentStatus,'pending');
    assert.ok(booking.bookingCode); assert.match(booking.serviceOtp,/^\d{4}$/);
    assert.equal((await coupon.reload()).usedCount,1); assert.equal((await offer.reload()).usedCount,1);
    const customerBookings = await require('../api/users/services/v1/users.service').getBookings(customer.id);
    assert.ok(customerBookings.data.some(b => b.id === booking.id));
    const adminBookings = await require('../api/adminUsers/services/v1/admin.service').listBookings({userId:customer.id});
    assert.ok(adminBookings.data.some(b => b.id === booking.id));
    const partner = await Partner.create({name:'Fixture partner',phone:`partner-${suffix}`,status:'approved',isOnline:true,cityId:city.id});
    const available = await require('../api/partners/services/v1/partners.service').getAvailableBookings(partner.id);
    assert.ok(available.some(b => b.id === booking.id));
    const paidPayload = {...payload,paymentMode:'paid'};
    const paidPreviewResponse = await fetch(`${url}/bookings/preview`,{method:'POST',headers,body:JSON.stringify(paidPayload)});
    const paidPreviewBody = await paidPreviewResponse.json();
    assert.equal(paidPreviewResponse.status,200,JSON.stringify(paidPreviewBody));
    assert.equal(paidPreviewBody.data.paymentStatus,'paid');
    assert.equal(paidPreviewBody.data.totalAmount,605);
    const paidResponse = await fetch(`${url}/bookings`,{method:'POST',headers,body:JSON.stringify({...paidPayload,expectedTotal:605})});
    const paidBody = await paidResponse.json();
    assert.equal(paidResponse.status,201,JSON.stringify(paidBody));
    const paidBooking = await Booking.findByPk(paidBody.data.id);
    assert.equal(paidBooking.paymentStatus,'paid');
    assert.equal(paidBooking.paymentMode,'online');
    assert.equal(paidBooking.createdByAdminId,1);
    const assignedPayload = {...payload, partnerId: partner.id};
    const assignedPreview = await orders.preview(assignedPayload);
    assert.equal(assignedPreview.totalAmount,605);
    assert.equal(assignedPreview.status,'confirmed');
    assert.ok(assignedPreview.services.every(s => s.serviceStatus === 'claimed' && s.assignedPartnerId === partner.id));
    const assignedResponse = await fetch(`${url}/bookings`,{method:'POST',headers,
      body:JSON.stringify({...assignedPayload,expectedTotal:605})});
    const assignedBody = await assignedResponse.json();
    assert.equal(assignedResponse.status,201,JSON.stringify(assignedBody));
    const assignedBooking = await Booking.findByPk(assignedBody.data.id);
    assert.equal(assignedBooking.partnerId,partner.id);
    assert.equal(assignedBooking.status,'confirmed');
    const assignedServices = typeof assignedBooking.services === 'string' ? JSON.parse(assignedBooking.services) : assignedBooking.services;
    assert.ok(assignedServices.every(s => s.assignedPartnerId === partner.id));
    const Notification = require('../api/notifications/models/notification.model');
    assert.ok(await Notification.findOne({where:{partnerId:partner.id,title:'New Booking Assigned'}}));
    await partner.update({status:'pending'});
    await assert.rejects(orders.preview(assignedPayload), /approved partner/);
    await partner.update({status:'approved',cityId:null});
    await assert.rejects(orders.preview(assignedPayload), /service city/);
    console.log('PASS: city/offer pricing, weighted GST, packages, combos, custom services, coupons, preview without writes, API auth/validation, booking creation and all three app lists.');
    console.log('PASS: optional partner selection, confirmed service assignments, partner notification, and rejection of unapproved or out-of-city partners.');
    console.log('PASS: Paid bookings preview and persist as paid; COD bookings remain pending payment.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    sequelize.query = originalQuery;
    await transaction.rollback(); await sequelize.close();
    console.log('Rolled back all test fixtures and orders.');
  }
})().catch(err => {console.error(err); process.exitCode=1;});
