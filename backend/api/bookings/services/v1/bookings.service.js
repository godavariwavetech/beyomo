const { Op } = require("sequelize");
const Booking = require("../../models/booking.model");
const Service = require("../../../services/models/service.model");
const Partner = require("../../../partners/models/partner.model");
const User = require("../../../users/models/user.model");
const Coupon = require("../../../coupons/models/coupon.model");
const offersService = require("../../../offers/services/v1/offers.service");
const packagesService = require("../../../packages/services/v1/packages.service");
const ServicePackage = require("../../../packages/models/package.model");
const Review = require("../../../reviews/models/review.model");
const Notification = require("../../../notifications/models/notification.model");
const Payment = require("../../../payments/models/payment.model");
const City = require("../../../cities/models/city.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const { sendPushNotification } = require("../../../../utils/firebaseUtils");
const { haversineKm } = require("../../../../utils/geoUtils");
const { resolveRatesForBooking } = require("../../../../utils/revenueSplit");

// TEMPORARY: no live Razorpay key is configured yet, so online payment is disabled at
// the source — every booking is forced to Cash on Delivery regardless of what the
// client requests. Revert by removing this flag (and the check below) once a real key
// is in place.
const ONLINE_PAYMENTS_ENABLED = false;

const createBooking = async (userId, bookingData) => {
  const { services: serviceItems, partnerId, address, scheduledAt, couponCode, offerId, packageId, paymentMode, notes } = bookingData;

  if (!ONLINE_PAYMENTS_ENABLED && paymentMode === "online") {
    throw new AppError("Online payment is currently unavailable. Please choose Cash on Delivery.", 400);
  }

  // Fetch all requested services
  const serviceIds = serviceItems.map(s => parseInt(s.id));
  const uniqueServiceIds = [...new Set(serviceIds)];
  const foundServices = await Service.findAll({ where: { id: uniqueServiceIds, isActive: true } });
  if (foundServices.length !== uniqueServiceIds.length) {
    throw new AppError("One or more services not found or unavailable", 404);
  }

  if (partnerId) {
    const partner = await Partner.findOne({ where: { id: partnerId, status: "approved" } });
    if (!partner) throw new AppError("Partner not found or not available", 404);
  }

  // Build enriched services list and calculate base amount
  const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
  const enrichedServices = serviceItems.map(item => {
    const svc = serviceMap[parseInt(item.id)];
    const qty = item.qty || 1;
    return {
      serviceId: svc.id,
      name: svc.name,
      price: parseFloat(svc.basePrice),
      qty,
      duration: svc.duration || null,
      image: svc.image || null,
      serviceStatus: 'unassigned',   // unassigned | claimed | completed
      assignedPartnerId: null,
      assignedPartnerName: null,
    };
  });

  let baseAmount = enrichedServices.reduce((sum, s) => sum + s.price * s.qty, 0);

  // If booking via a package, override the base amount with the package price
  let appliedPackageId = null;
  let appliedPackage = null;
  if (packageId) {
    appliedPackage = await packagesService.validateForBooking(packageId);
    baseAmount = parseFloat(appliedPackage.price);
    appliedPackageId = appliedPackage.id;
    // Mark each service as part of a package (for display/tracking)
    enrichedServices.forEach(s => { s.addedByPackage = true; });
  }

  let couponDiscount = 0;
  let couponId = null;
  let appliedCouponCode = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { [Op.lte]: new Date() },
        validTill: { [Op.gte]: new Date() },
      },
    });

    if (!coupon) throw new AppError("Invalid or expired coupon code", 400);
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new AppError("Coupon usage limit reached", 400);
    if (baseAmount < parseFloat(coupon.minOrderAmount)) {
      throw new AppError(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
    }

    if (coupon.type === "flat") {
      couponDiscount = parseFloat(coupon.discount);
      if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, parseFloat(coupon.maxDiscount));
      couponDiscount = Math.min(couponDiscount, baseAmount);
    } else {
      couponDiscount = (baseAmount * parseFloat(coupon.discount)) / 100;
      if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, parseFloat(coupon.maxDiscount));
    }

    couponId = coupon.id;
    appliedCouponCode = coupon.code;
    await coupon.increment("usedCount");
  }

  // Apply offer — adds free service with price=0
  let appliedOfferId = null;
  if (offerId) {
    const cartServiceIds = enrichedServices.map(s => s.serviceId);
    const { freeService } = await offersService.validateAndApply(offerId, { serviceIds: cartServiceIds, totalAmount: baseAmount });
    enrichedServices.push({
      serviceId: freeService.id,
      name: freeService.name,
      price: 0,
      qty: 1,
      duration: freeService.duration || null,
      image: freeService.image || null,
      serviceStatus: "unassigned",
      assignedPartnerId: null,
      assignedPartnerName: null,
      addedByOffer: true,
    });
    appliedOfferId = offerId;
  }

  const { partnerPercent, gstPercent } = await resolveRatesForBooking({
    serviceItems: enrichedServices,
    package: appliedPackage,
  });
  const taxableAmount = baseAmount - couponDiscount;
  const tax = parseFloat((taxableAmount * gstPercent / 100).toFixed(2));
  const total = parseFloat((taxableAmount + tax).toFixed(2));
  // Partner's actual share of the discounted, pre-tax amount — GST is a pass-through
  // to the government, not split between admin/partner.
  const partnerEarning = parseFloat((taxableAmount * partnerPercent / 100).toFixed(2));

  // Use first service as the primary serviceId (backward compat)
  const primaryServiceId = enrichedServices[0].serviceId;
  const primaryServiceName = enrichedServices.length === 1
    ? enrichedServices[0].name
    : `${enrichedServices.length} services`;

  // Resolve cityId from address city name so admin dashboard city filter works
  let cityId = null;
  if (address.city) {
    const city = await City.findOne({
      where: { name: { [Op.like]: `%${address.city.trim()}%` }, isActive: true },
    });
    cityId = city ? city.id : null;

    // Validate that address coordinates fall within the city's service radius
    if (city && city.lat && city.lng && address.lat && address.lng) {
      const dist = haversineKm(address.lat, address.lng, city.lat, city.lng);
      const limit = city.radius ?? 30;
      if (dist > limit) {
        throw new AppError(`Your location is outside the ${city.name} service area (${Math.round(dist)} km from city center)`, 400);
      }
    }
  }

  const booking = await Booking.create({
    userId,
    serviceId: primaryServiceId,
    services: enrichedServices,
    partnerId: partnerId || null,
    addressLabel: address.label || "Home",
    addressLine1: address.line1,
    addressLine2: address.line2 || null,
    addressCity: address.city || "",
    addressState: address.state || "",
    addressPincode: address.pincode || "",
    addressLat: address.lat || null,
    addressLng: address.lng || null,
    scheduledAt: new Date(scheduledAt),
    status: "pending",
    paymentMode: paymentMode === "cod" ? "cod" : "online",
    baseAmount,
    discountAmount: 0,
    couponDiscountAmount: couponDiscount,
    taxAmount: tax,
    totalAmount: total,
    partnerEarning,
    couponCode: appliedCouponCode,
    couponId,
    offerId: appliedOfferId,
    packageId: appliedPackageId,
    cityId,
    notes,
  });

  const user = await User.findByPk(userId);
  if (user?.fcmToken) {
    await sendPushNotification(
      [user.fcmToken],
      "Booking Confirmed",
      `Your booking for ${primaryServiceName} has been placed. Booking ID: ${booking.bookingCode}`,
      { bookingId: String(booking.id), type: "booking" },
      "beyomo_booking"
    );
  }

  await Notification.create({
    userId,
    title: "Booking Placed",
    body: `Your booking for ${primaryServiceName} (${booking.bookingCode}) has been placed.`,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  if (!partnerId && booking.addressCity) {
    const cityPartners = await Partner.findAll({
      where: { status: "approved", locationCity: booking.addressCity },
      attributes: ["id", "fcmToken"],
    });
    const tokens = cityPartners.map(p => p.fcmToken).filter(Boolean);
    if (tokens.length > 0) {
      await sendPushNotification(
        tokens,
        "New Job Available",
        `New booking for ${primaryServiceName} near you. Open the app to accept.`,
        { bookingId: String(booking.id), type: "available_booking" }
      );
    }
  }

  return Booking.findByPk(booking.id, {
    include: [
      { model: Service, as: "service", attributes: ["name", "image", "basePrice", "duration"] },
      { model: Partner, as: "partner", attributes: ["name", "profilePicture", "phone"] },
    ],
  });
};

const BOOKING_DETAIL_INCLUDES = [
  { model: Service, as: "service", attributes: ["name", "image", "basePrice", "duration"] },
  { model: Partner, as: "partner", attributes: ["name", "profilePicture", "phone", "ratingsAverage", "ratingsCount", "experience"] },
  { model: Payment, as: "payment", attributes: ["razorpayOrderId", "razorpayPaymentId", "amount", "status", "method"] },
  { model: Review, as: "review", attributes: ["rating", "comment", "createdAt"] },
];

const getBookingById = async (userId, bookingId) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: BOOKING_DETAIL_INCLUDES,
  });
  if (!booking) throw new AppError("Booking not found", 404);
  return booking;
};

const cancelBooking = async (userId, bookingId, reason) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new AppError(`Cannot cancel a booking with status "${booking.status}"`, 400);
  }

  await booking.update({
    status: "cancelled",
    cancelledBy: "user",
    cancellationReason: reason || "Cancelled by user",
  });

  await Notification.create({
    userId,
    title: "Booking Cancelled",
    body: `Your booking ${booking.bookingCode} has been cancelled.`,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  // Edge case 7: notify any partners who had already claimed services
  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const claimedPartnerIds = [
    ...new Set(
      svcs
        .filter(s => s.assignedPartnerId)
        .map(s => s.assignedPartnerId)
    ),
  ];
  if (claimedPartnerIds.length > 0) {
    const claimedPartners = await Partner.findAll({
      where: { id: claimedPartnerIds },
      attributes: ["id", "fcmToken"],
    });
    const tokens = claimedPartners.map(p => p.fcmToken).filter(Boolean);
    if (tokens.length > 0) {
      await sendPushNotification(
        tokens,
        "Booking Cancelled",
        `Booking ${booking.bookingCode} has been cancelled by the customer.`,
        { bookingId: String(booking.id), type: "booking" }
      );
    }
  }

  return Booking.findOne({ where: { id: bookingId, userId }, include: BOOKING_DETAIL_INCLUDES });
};

const rescheduleBooking = async (userId, bookingId, scheduledAt, reason) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new AppError(`Cannot reschedule a booking with status "${booking.status}"`, 400);
  }

  const previousScheduledAt = booking.scheduledAt;
  const newScheduledAt = new Date(scheduledAt);

  await booking.update({
    scheduledAt: newScheduledAt,
    previousScheduledAt,
    rescheduledBy: "user",
    rescheduleReason: reason || null,
    rescheduledCount: (booking.rescheduledCount || 0) + 1,
  });

  const newTimeStr = newScheduledAt.toLocaleString("en-IN");

  const user = await User.findByPk(userId);
  if (user?.fcmToken) {
    await sendPushNotification(
      [user.fcmToken],
      "Booking Rescheduled",
      `Your booking ${booking.bookingCode} has been rescheduled to ${newTimeStr}.`,
      { bookingId: String(booking.id), type: "booking" },
      "beyomo_booking"
    ).catch(() => {});
  }

  await Notification.create({
    userId,
    title: "Booking Rescheduled",
    body: `Your booking ${booking.bookingCode} has been rescheduled to ${newTimeStr}.`,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  if (booking.partnerId) {
    const partner = await Partner.findByPk(booking.partnerId, { attributes: ["fcmToken"] });
    if (partner?.fcmToken) {
      await sendPushNotification(
        [partner.fcmToken],
        "Booking Rescheduled",
        `Booking ${booking.bookingCode} has been rescheduled by the customer to ${newTimeStr}.`,
        { bookingId: String(booking.id), type: "booking" }
      ).catch(() => {});
    }
  }

  return Booking.findOne({ where: { id: bookingId, userId }, include: BOOKING_DETAIL_INCLUDES });
};

const submitReview = async (userId, bookingId, reviewData) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.status !== "completed") throw new AppError("Reviews can only be submitted for completed bookings", 400);

  const existingReview = await Review.findOne({ where: { bookingId } });
  if (existingReview) throw new AppError("You have already reviewed this booking", 400);
  if (!booking.partnerId) throw new AppError("Cannot review a booking without an assigned partner", 400);

  const review = await Review.create({
    bookingId,
    userId,
    partnerId: booking.partnerId,
    serviceId: booking.serviceId,
    rating: reviewData.rating,
    comment: reviewData.comment,
    images: reviewData.images || [],
  });

  // Recalculate partner average rating
  const { sequelize } = require("../../../../utils/dbconnect");
  const { fn, col, literal } = require("sequelize");
  const stats = await Review.findOne({
    where: { partnerId: booking.partnerId, status: "visible" },
    attributes: [
      [fn("AVG", col("rating")), "avgRating"],
      [fn("COUNT", col("id")), "count"],
    ],
    raw: true,
  });

  if (stats && stats.avgRating) {
    await Partner.update(
      {
        ratingsAverage: parseFloat(parseFloat(stats.avgRating).toFixed(1)),
        ratingsCount: parseInt(stats.count, 10),
      },
      { where: { id: booking.partnerId } }
    );
  }

  return review;
};

const respondServiceUpdate = async (userId, bookingId, action) => {
  const { sendPushNotification } = require("../../../../utils/firebaseUtils");

  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (String(booking.userId) !== String(userId)) throw new AppError("Not your booking", 403);
  if (!booking.serviceUpdatePending) throw new AppError("No pending service update", 400);

  const parseTv = (s) => { if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; };
  const pending = (() => { const p = booking.pendingServicesUpdate; if (typeof p === 'string') { try { return JSON.parse(p); } catch { return null; } } return p; })();

  if (action === "approve" && pending?.services) {
    const svcs = parseTv(pending.services);
    const newBase  = svcs.reduce((s, i) => s + (parseFloat(i.price) || 0) * (i.qty || 1), 0);
    const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
    const taxable  = newBase - couponDiscount;
    const pkg = booking.packageId ? await ServicePackage.findByPk(booking.packageId) : null;
    const { partnerPercent, gstPercent } = await resolveRatesForBooking({ serviceItems: svcs, package: pkg });
    const tax = parseFloat((taxable * gstPercent / 100).toFixed(2));
    const newTotal = parseFloat((taxable + tax).toFixed(2));
    const partnerEarning = parseFloat((taxable * partnerPercent / 100).toFixed(2));
    await booking.update({
      services: svcs,
      baseAmount: newBase,
      taxAmount: tax,
      totalAmount: newTotal,
      partnerEarning,
      serviceUpdatePending: false,
      pendingServicesUpdate: null,
      lastServiceUpdateDecision: "approved",
    });
  } else {
    await booking.update({
      serviceUpdatePending: false,
      pendingServicesUpdate: null,
      lastServiceUpdateDecision: "rejected",
    });
  }

  // Notify partner
  if (booking.partnerId) {
    const partner = await Partner.findByPk(booking.partnerId, { attributes: ["fcmToken", "name"] });
    const msg = action === "approve"
      ? `Customer approved your service changes for booking ${booking.bookingCode}.`
      : `Customer rejected your service changes for booking ${booking.bookingCode}.`;
    if (partner?.fcmToken) {
      await sendPushNotification([partner.fcmToken], action === "approve" ? "Changes Approved" : "Changes Rejected", msg,
        { bookingId: String(booking.id), type: "service_update" }).catch(() => {});
    }
  }

  return booking;
};

const addUserServices = async (userId, bookingId, serviceItems) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("Services can only be added to pending or confirmed bookings", 400);

  const serviceIds = serviceItems.map(s => parseInt(s.id));
  const foundServices = await Service.findAll({ where: { id: serviceIds, isActive: true } });
  if (foundServices.length !== serviceIds.length)
    throw new AppError("One or more services not found or unavailable", 404);

  const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
  const newEntries = serviceItems.map(item => {
    const svc = serviceMap[parseInt(item.id)];
    return { serviceId: svc.id, name: svc.name, price: parseFloat(svc.basePrice), qty: item.qty || 1, duration: svc.duration || null, image: svc.image || null, addedByUser: true };
  });

  const existing = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const updatedServices = [...existing, ...newEntries];

  const newBase = updatedServices.reduce((sum, s) => sum + s.price * (s.qty || 1), 0);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
  const taxable = newBase - couponDiscount;
  const pkg = booking.packageId ? await ServicePackage.findByPk(booking.packageId) : null;
  const { partnerPercent, gstPercent } = await resolveRatesForBooking({ serviceItems: updatedServices, package: pkg });
  const tax = parseFloat((taxable * gstPercent / 100).toFixed(2));
  const total = parseFloat((taxable + tax).toFixed(2));
  const partnerEarning = parseFloat((taxable * partnerPercent / 100).toFixed(2));

  await booking.update({ services: updatedServices, baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning });

  if (booking.partnerId) {
    const partner = await Partner.findByPk(booking.partnerId, { attributes: ['fcmToken'] });
    if (partner?.fcmToken) {
      const addedNames = newEntries.map(s => s.name).join(', ');
      await sendPushNotification(
        [partner.fcmToken],
        'Customer Added Services',
        `${addedNames} added to booking ${booking.bookingCode}. New total: ₹${total}`,
        { bookingId: String(booking.id), type: 'booking' }
      ).catch(() => {});
    }
  }

  return booking;
};

module.exports = { createBooking, getBookingById, cancelBooking, rescheduleBooking, submitReview, respondServiceUpdate, addUserServices };
