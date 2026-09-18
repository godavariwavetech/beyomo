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
const { isPartnerOnline } = require("../../../../utils/partnerPresence");
const { haversineKm } = require("../../../../utils/geoUtils");
const { resolveRatesForBooking, resolveRatesForMultiPackageBooking } = require("../../../../utils/revenueSplit");
const { cityPriceResolver } = require("../../../services/services/v1/cityPricing");

const MIN_BOOKING_AMOUNT = 500;

// Multi-package path: bookingData.packages = [{ packageId, qty, services: [{id, qty}] }, ...].
// Each package keeps its own price/discount/revenue-split intact instead of collapsing
// into one flat packageId (which can only ever represent a single package).
const buildMultiPackageBooking = async (packagesInput, serviceMap, priceOf = (svc) => parseFloat(svc.basePrice)) => {
  let enrichedServices = [];
  let packageBaseAmount = 0;
  const packagesSummary = [];
  const ratePools = [];

  for (const entry of packagesInput) {
    const appliedPackage = await packagesService.validateForBooking(entry.packageId);
    const qty = entry.qty || 1;
    const items = (entry.services || []).map(item => {
      const svc = serviceMap[parseInt(item.id)];
      const itemQty = item.qty || 1;
      return {
        serviceId: svc.id,
        name: svc.name,
        price: priceOf(svc),
        qty: itemQty,
        duration: svc.duration || null,
        image: svc.image || null,
        serviceStatus: 'unassigned',
        assignedPartnerId: null,
        assignedPartnerName: null,
        addedByPackage: true,
        packageId: appliedPackage.id,
      };
    });
    enrichedServices = [...enrichedServices, ...items];
    packageBaseAmount += parseFloat(appliedPackage.price) * qty;
    packagesSummary.push({
      packageId: appliedPackage.id,
      title: appliedPackage.title,
      qty,
      price: parseFloat(appliedPackage.price),
      originalPrice: appliedPackage.originalPrice != null ? parseFloat(appliedPackage.originalPrice) : null,
    });
    ratePools.push({ package: appliedPackage, qty });
  }

  return { enrichedServices, packageBaseAmount, packagesSummary, ratePools };
};

// Validates + prices a booking without any DB writes/side effects — extracted so the
// pay-first flow (POST /payments/quote-order) can compute an accurate Razorpay amount
// from the same code that createBooking uses. Returns everything persistBooking needs
// to actually create the Booking row.
//   No side effects: coupon.increment happens in persistBooking, not here.
const prepareBooking = async (userId, bookingData) => {
  const { services: serviceItems = [], extraServices = [], packages: packagesInput = [], partnerId, address, scheduledAt, couponCode, offerId, packageId, packageQty = 1, paymentMode, notes, cityId: selectedCityId = null } = bookingData;
  const isMultiPackage = Array.isArray(packagesInput) && packagesInput.length > 0;

  // Fetch all requested services in one pass — the package/flexible-pick items (whether
  // via the single legacy packageId or the multi-package `packages` array) and any extra
  // individual services booked alongside them.
  const multiPackageServiceItems = isMultiPackage
    ? packagesInput.flatMap(p => p.services || [])
    : [];
  const allItems = [...serviceItems, ...extraServices, ...multiPackageServiceItems];
  const serviceIds = allItems.map(s => parseInt(s.id));
  const uniqueServiceIds = [...new Set(serviceIds)];
  const foundServices = await Service.findAll({ where: { id: uniqueServiceIds, isActive: true } });
  if (foundServices.length !== uniqueServiceIds.length) {
    throw new AppError("One or more services not found or unavailable", 404);
  }

  if (partnerId) {
    const partner = await Partner.findOne({ where: { id: partnerId, status: "approved" } });
    if (!partner) throw new AppError("Partner not found or not available", 404);
  }

  // Resolve cityId from the address BEFORE any pricing happens — the city decides
  // which rate card applies, so resolving it afterwards would bill every booking at
  // the global basePrice regardless of city. Also gates the service-radius check.
  let cityId = null;
  if (address.city) {
    // Exact name first, substring only as a fallback. A bare LIKE '%<city>%' matches
    // any city whose name merely CONTAINS the text — "Delhi" also matches "New Delhi" —
    // which silently files a booking under the wrong city, and the partner feed then
    // faithfully shows it to the wrong city's partners.
    const typed = address.city.trim();
    const city =
      (await City.findOne({ where: { name: typed, isActive: true } })) ||
      (await City.findOne({ where: { name: { [Op.like]: `%${typed}%` }, isActive: true } }));
    cityId = city ? city.id : null;

    // The app sends the city the customer is currently browsing in. If the service
    // address resolves to a different one, the booking would be stamped with the
    // address city while the customer believes they booked in the selected city —
    // exactly the "I made a Vijayawada booking but a Rajahmundry partner sees it"
    // case. The address is where the work actually happens, so it stays authoritative;
    // the mismatch is refused rather than silently resolved either way.
    if (selectedCityId && cityId && Number(selectedCityId) !== Number(cityId)) {
      const selected = await City.findByPk(selectedCityId, { attributes: ["name"] });
      throw new AppError(
        `This address is in ${city.name}, but your selected location is ${selected?.name ?? "another city"}. ` +
        `Pick an address in ${selected?.name ?? "your selected city"}, or switch your location to ${city.name}.`,
        400
      );
    }

    // Validate that address coordinates fall within the city's service radius
    if (city && city.lat && city.lng && address.lat && address.lng) {
      const dist = haversineKm(address.lat, address.lng, city.lat, city.lng);
      const limit = city.radius ?? 30;
      if (dist > limit) {
        throw new AppError(`Your location is outside the ${city.name} service area (${Math.round(dist)} km from city center)`, 400);
      }
    }
  }

  // Address text matched no known city (free-typed address, spelling, a city that was
  // deactivated). Without this the booking is saved with cityId NULL, and since the
  // partner feed matches on cityId it would then be offered to nobody at all.
  if (!cityId && selectedCityId) cityId = Number(selectedCityId);

  // Build enriched services list and calculate base amount
  const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
  const priceOf = await cityPriceResolver(uniqueServiceIds, cityId);
  const enrichItems = (items) => items.map(item => {
    const svc = serviceMap[parseInt(item.id)];
    const qty = item.qty || 1;
    return {
      serviceId: svc.id,
      name: svc.name,
      price: priceOf(svc),
      qty,
      duration: svc.duration || null,
      image: svc.image || null,
      serviceStatus: 'unassigned',   // unassigned | claimed | completed
      assignedPartnerId: null,
      assignedPartnerName: null,
    };
  });

  let enrichedServices;
  let baseAmount;
  let appliedPackageId = null;
  let appliedPackage = null;
  let multiPackageInfo = null; // { packagesSummary, ratePools } when isMultiPackage

  if (isMultiPackage) {
    const built = await buildMultiPackageBooking(packagesInput, serviceMap, priceOf);
    enrichedServices = built.enrichedServices;
    baseAmount = built.packageBaseAmount;
    multiPackageInfo = { packagesSummary: built.packagesSummary, ratePools: built.ratePools };
  } else {
    enrichedServices = enrichItems(serviceItems);
    baseAmount = enrichedServices.reduce((sum, s) => sum + s.price * s.qty, 0);

    // If booking via a single package, override the base amount with the package price
    if (packageId) {
      appliedPackage = await packagesService.validateForBooking(packageId);
      // Each package-tagged service's qty already reflects packageQty copies (the client
      // sends qty = packageQty per item), so the price must be multiplied the same way —
      // otherwise ordering 2 packages would still only charge for 1.
      baseAmount = parseFloat(appliedPackage.price) * packageQty;
      appliedPackageId = appliedPackage.id;
      // Mark each service as part of a package (for display/tracking)
      enrichedServices.forEach(s => { s.addedByPackage = true; });
    }
  }

  // Extra services booked alongside a package (or alongside a regular booking) are
  // billed additively on top, at their normal catalog price — never folded into the
  // package's fixed price.
  const enrichedExtraServices = enrichItems(extraServices);
  if (enrichedExtraServices.length > 0) {
    enrichedExtraServices.forEach(s => { s.addedByUser = true; });
    baseAmount += enrichedExtraServices.reduce((sum, s) => sum + s.price * s.qty, 0);
    enrichedServices = [...enrichedServices, ...enrichedExtraServices];
  }

  if (baseAmount < MIN_BOOKING_AMOUNT) {
    throw new AppError(`Minimum booking amount is ₹${MIN_BOOKING_AMOUNT}. Please add more services to continue.`, 400);
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
    // NOTE: coupon.increment("usedCount") is deferred to persistBooking so that a
    // quote which never gets paid doesn't burn a coupon slot.
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

  const { partnerPercent, gstPercent } = isMultiPackage
    ? await resolveRatesForMultiPackageBooking({
        packages: multiPackageInfo.ratePools,
        serviceItems: enrichedExtraServices,
      })
    : await resolveRatesForBooking({
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
  const primaryServiceName = isMultiPackage
    ? `${multiPackageInfo.packagesSummary.length} packages`
    : enrichedServices.length === 1
      ? enrichedServices[0].name
      : `${enrichedServices.length} services`;

  // Return the fully-priced, fully-validated payload. persistBooking (or the pay-first
  // flow) turns this into a real Booking row + side effects.
  return {
    userId,
    bookingRow: {
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
      packageQty: appliedPackageId ? packageQty : 1,
      packages: isMultiPackage ? multiPackageInfo.packagesSummary : null,
      cityId,
      notes,
    },
    couponId,
    primaryServiceName,
    partnerId: partnerId || null,
  };
};

// Persists the prepared booking + fires side effects (coupon.increment, notifications,
// partner alerts). `overrides` lets the pay-first flow set status/paymentStatus/paymentId
// atomically — for the classic COD flow, pass no overrides.
const persistBooking = async (prepared, overrides = {}) => {
  const { userId, bookingRow, couponId, primaryServiceName, partnerId } = prepared;

  // Coupon slot is only consumed at the moment we actually create the booking — an
  // abandoned quote will not have called increment.
  if (couponId) {
    const coupon = await Coupon.findByPk(couponId);
    if (coupon) await coupon.increment("usedCount");
  }

  const booking = await Booking.create({ ...bookingRow, ...overrides });

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
    // Only partners who are actually online are alerted to a new job. isOnline is the
    // toggle they set in the app; isPartnerOnline additionally requires a recent
    // heartbeat, so a partner whose app was force-quit while "online" is not paged for
    // work they cannot see or accept.
    const cityPartners = await Partner.findAll({
      where: { status: "approved", locationCity: booking.addressCity, isOnline: true },
      attributes: ["id", "fcmToken", "isOnline", "lastSeenAt"],
    });
    const tokens = cityPartners.filter(isPartnerOnline).map(p => p.fcmToken).filter(Boolean);
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
      { model: ServicePackage, as: "package", attributes: ["id", "title", "price", "image"] },
    ],
  });
};

// Classic entry point — same signature as before. Prepare then persist in one call.
const createBooking = async (userId, bookingData) => {
  const prepared = await prepareBooking(userId, bookingData);
  return persistBooking(prepared);
};

const BOOKING_DETAIL_INCLUDES = [
  { model: Service, as: "service", attributes: ["name", "image", "basePrice", "duration"] },
  { model: Partner, as: "partner", attributes: ["name", "profilePicture", "phone", "ratingsAverage", "ratingsCount", "experience"] },
  { model: Payment, as: "payment", attributes: ["razorpayOrderId", "razorpayPaymentId", "amount", "status", "method"] },
  { model: Review, as: "review", attributes: ["rating", "comment", "createdAt"] },
  { model: ServicePackage, as: "package", attributes: ["id", "title", "price", "image"] },
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

const parseServicesField = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

// A package booking's total isn't the sum of its (real, undiscounted) per-service
// prices — its package-tagged items keep contributing the package's own fixed price,
// and only genuinely extra items add on top. Recomputing from raw prices here would
// silently erase the package discount the moment anything changes.
// Entries the admin has soft-removed (`removed: true`, kept in the array for its own
// audit trail) are excluded here too, so acting on a booking via these endpoints never
// resurrects a removed item's price into the total.
//
// `packagesOverride`, when passed, is used instead of `booking.packages` — callers that
// are themselves in the middle of changing the multi-package set (e.g. dropping one
// package) pass the already-updated array here rather than relying on the stale one
// still on the booking row.
const recomputeBookingAmounts = async (booking, updatedServices, packagesOverride) => {
  const activeServices = updatedServices.filter(s => !s.removed);
  const multiPackages = packagesOverride !== undefined ? packagesOverride : parseServicesField(booking.packages);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);

  let newBase, partnerPercent, gstPercent;

  if (Array.isArray(multiPackages) && multiPackages.length > 0) {
    const nonPackageAmount = activeServices
      .filter(s => !s.packageId)
      .reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
    const packageAmount = multiPackages.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * (p.qty || 1), 0);
    newBase = packageAmount + nonPackageAmount;

    const pkgModels = await ServicePackage.findAll({ where: { id: multiPackages.map(p => p.packageId) } });
    const ratePools = multiPackages.map(p => ({ package: pkgModels.find(pk => pk.id === p.packageId), qty: p.qty || 1 }))
      .filter(p => p.package);
    ({ partnerPercent, gstPercent } = await resolveRatesForMultiPackageBooking({ packages: ratePools, serviceItems: activeServices }));
  } else {
    const pkg = booking.packageId ? await ServicePackage.findByPk(booking.packageId) : null;
    const nonPackageAmount = activeServices
      .filter(s => !s.addedByPackage)
      .reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
    newBase = pkg
      ? parseFloat(pkg.price) + nonPackageAmount
      : activeServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
    ({ partnerPercent, gstPercent } = await resolveRatesForBooking({ serviceItems: activeServices, package: pkg }));
  }

  const taxable = newBase - couponDiscount;
  const tax = parseFloat((taxable * gstPercent / 100).toFixed(2));
  const total = parseFloat((taxable + tax).toFixed(2));
  const partnerEarning = parseFloat((taxable * partnerPercent / 100).toFixed(2));
  return { newBase, tax, total, partnerEarning };
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
  const priceOf = await cityPriceResolver(serviceIds, booking.cityId);
  const newEntries = serviceItems.map(item => {
    const svc = serviceMap[parseInt(item.id)];
    return { serviceId: svc.id, name: svc.name, price: priceOf(svc), qty: item.qty || 1, duration: svc.duration || null, image: svc.image || null, addedByUser: true };
  });

  const existing = parseServicesField(booking.services);
  const updatedServices = [...existing, ...newEntries];

  const { newBase, tax, total, partnerEarning } = await recomputeBookingAmounts(booking, updatedServices);
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

const updateServiceQty = async (userId, bookingId, index, qty) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("Services can only be edited on pending or confirmed bookings", 400);

  const existing = parseServicesField(booking.services);
  if (index < 0 || index >= existing.length) throw new AppError("Service not found on this booking", 404);
  const item = existing[index];
  if (item.removed) throw new AppError("This service has been removed from the booking", 400);
  if (item.addedByPackage) throw new AppError("Package services can't be changed individually", 400);

  const updatedServices = existing.map((s, i) => (i === index ? { ...s, qty } : s));
  const { newBase, tax, total, partnerEarning } = await recomputeBookingAmounts(booking, updatedServices);
  if (newBase < MIN_BOOKING_AMOUNT) {
    throw new AppError(`Booking total can't go below the ₹${MIN_BOOKING_AMOUNT} minimum — cancel the booking instead`, 400);
  }
  await booking.update({ services: updatedServices, baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning });

  return booking;
};

const removeService = async (userId, bookingId, index) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("Services can only be removed from pending or confirmed bookings", 400);

  const existing = parseServicesField(booking.services);
  if (index < 0 || index >= existing.length) throw new AppError("Service not found on this booking", 404);
  const item = existing[index];
  if (item.removed) throw new AppError("This service has already been removed", 400);
  if (item.addedByPackage) throw new AppError("Package services can't be removed individually", 400);
  const activeCount = existing.filter(s => !s.removed).length;
  if (activeCount <= 1) throw new AppError("A booking must have at least one service — cancel the booking instead", 400);

  const updatedServices = existing.filter((_, i) => i !== index);
  const { newBase, tax, total, partnerEarning } = await recomputeBookingAmounts(booking, updatedServices);
  if (newBase < MIN_BOOKING_AMOUNT) {
    throw new AppError(`Booking total can't go below the ₹${MIN_BOOKING_AMOUNT} minimum — cancel the booking instead`, 400);
  }
  await booking.update({ services: updatedServices, baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning });

  return booking;
};

// Drops a package from a booking: strips its services, drops it from `packages` (or
// clears `packageId` for the legacy single-package case), and re-prices whatever's left.
// A booking can hold more than one package/combo booked together (see `packages` on the
// model) — `packageId` then identifies *which* one to remove; for a legacy single-package
// booking (packageId column set, `packages` empty) it's not needed since there's only one.
// Exported so admin's own remove-package action can reuse the same array-surgery + repricing
// logic without duplicating it (admin skips the userId ownership check user bookings need).
const buildPackageRemoval = async (booking, packageId) => {
  const multiPackages = parseServicesField(booking.packages);
  const existing = parseServicesField(booking.services);

  if (multiPackages.length > 0) {
    if (!packageId) throw new AppError("packageId is required to remove a package from a multi-package booking", 400);
    const targetId = parseInt(packageId);
    if (!multiPackages.some(p => p.packageId === targetId))
      throw new AppError("This booking doesn't include that package", 404);

    const remainingPackages = multiPackages.filter(p => p.packageId !== targetId);
    const remainingServices = existing.filter(s => s.packageId !== targetId);
    if (remainingPackages.length === 0 && remainingServices.filter(s => !s.removed && !s.addedByPackage).length === 0)
      throw new AppError("Removing this package would leave the booking with no services — cancel the booking instead", 400);

    const { newBase, tax, total, partnerEarning } = await recomputeBookingAmounts(booking, remainingServices, remainingPackages);
    if (newBase < MIN_BOOKING_AMOUNT)
      throw new AppError(`Booking total can't go below the ₹${MIN_BOOKING_AMOUNT} minimum — cancel the booking instead`, 400);

    return {
      services: remainingServices,
      packages: remainingPackages.length > 0 ? remainingPackages : null,
      baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning,
    };
  }

  if (!booking.packageId) throw new AppError("This booking doesn't have a package attached", 400);
  const remaining = existing.filter(s => !s.addedByPackage);
  if (remaining.filter(s => !s.removed).length === 0)
    throw new AppError("Removing this package would leave the booking with no services — cancel the booking instead", 400);

  const { newBase, tax, total, partnerEarning } = await recomputeBookingAmounts(
    { packageId: null, couponDiscountAmount: booking.couponDiscountAmount },
    remaining
  );
  return { services: remaining, packageId: null, packages: null, baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning };
};

const removePackage = async (userId, bookingId, packageId) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("The package can only be removed from a pending or confirmed booking", 400);

  const updates = await buildPackageRemoval(booking, packageId);
  await booking.update(updates);

  return booking;
};

// Adds a new package/combo to a booking that already exists. The client resolves which
// services the package covers (its own fixed list for a "fixed" package, or the user's
// N picks for a "flexible" one — same contract createBooking's multi-package path already
// uses) and sends them here; this function doesn't re-derive that itself.
// A booking already on the legacy single-package shape (packageId/packageQty columns,
// empty `packages`) gets folded into the array the first time a second package is added,
// so from then on `packages` is the one source of truth for every package on it.
// Exported for admin's own add-package action to reuse, same as buildPackageRemoval.
const buildPackageAddition = async (booking, packageId, qty, serviceItems) => {
  const appliedPackage = await packagesService.validateForBooking(packageId);
  const packageQty = qty || 1;

  const serviceIds = [...new Set((serviceItems || []).map(s => parseInt(s.id)))];
  if (serviceIds.length === 0) throw new AppError("Select at least one service for this package", 400);
  const foundServices = await Service.findAll({ where: { id: serviceIds, isActive: true } });
  if (foundServices.length !== serviceIds.length) throw new AppError("One or more services not found or unavailable", 404);
  const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
  const priceOf = await cityPriceResolver(serviceIds, booking.cityId);

  const newItems = serviceItems.map(item => {
    const svc = serviceMap[parseInt(item.id)];
    return {
      serviceId: svc.id, name: svc.name, price: priceOf(svc), qty: item.qty || 1,
      duration: svc.duration || null, image: svc.image || null,
      serviceStatus: 'unassigned', assignedPartnerId: null, assignedPartnerName: null,
      addedByPackage: true, packageId: appliedPackage.id,
    };
  });

  let existingServices = parseServicesField(booking.services);
  let existingPackages = parseServicesField(booking.packages);

  if (existingPackages.length === 0 && booking.packageId) {
    const currentPkg = await ServicePackage.findByPk(booking.packageId);
    if (currentPkg) {
      existingPackages = [{
        packageId: currentPkg.id, title: currentPkg.title, qty: booking.packageQty || 1,
        price: parseFloat(currentPkg.price), originalPrice: currentPkg.originalPrice != null ? parseFloat(currentPkg.originalPrice) : null,
      }];
      // Legacy items only carry `addedByPackage: true`, no `packageId` — backfill it now
      // that they're joining the array shape, so grouping/removal keeps working for them.
      existingServices = existingServices.map(s => (s.addedByPackage && s.packageId == null) ? { ...s, packageId: currentPkg.id } : s);
    }
  }

  if (existingPackages.some(p => p.packageId === appliedPackage.id))
    throw new AppError("This package is already part of the booking", 400);

  const updatedPackages = [...existingPackages, {
    packageId: appliedPackage.id, title: appliedPackage.title, qty: packageQty,
    price: parseFloat(appliedPackage.price), originalPrice: appliedPackage.originalPrice != null ? parseFloat(appliedPackage.originalPrice) : null,
  }];
  const updatedServices = [...existingServices, ...newItems];

  const { newBase, tax, total, partnerEarning } = await recomputeBookingAmounts(booking, updatedServices, updatedPackages);

  return { services: updatedServices, packages: updatedPackages, baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning };
};

const addPackage = async (userId, bookingId, packageId, qty, serviceItems) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("A package can only be added to a pending or confirmed booking", 400);

  const updates = await buildPackageAddition(booking, packageId, qty, serviceItems);
  await booking.update(updates);

  return booking;
};

module.exports = { createBooking, prepareBooking, persistBooking, getBookingById, cancelBooking, rescheduleBooking, submitReview, addUserServices, updateServiceQty, removeService, removePackage, buildPackageRemoval, addPackage, buildPackageAddition };
