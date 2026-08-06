const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const bookingsService = require("../../services/v1/bookings.service");
const Joi = require("joi");

const serviceItemSchema = Joi.object({
  id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  qty: Joi.number().integer().min(1).default(1),
});

const createBookingSchema = Joi.object({
  // Single package (or no package) bookings carry their services here. Multi-package
  // bookings carry services inside each `packages[]` entry instead, so this is only
  // required when `packages` isn't used.
  services: Joi.array().items(serviceItemSchema).min(1)
    .when('packages', { is: Joi.array().min(1), then: Joi.optional().default([]), otherwise: Joi.required() }),
  // Multiple distinct packages in one booking — each keeps its own price/discount and
  // revenue split rather than collapsing into the single packageId below.
  packages: Joi.array().items(
    Joi.object({
      packageId: Joi.number().integer().positive().required(),
      qty: Joi.number().integer().min(1).default(1),
      services: Joi.array().items(serviceItemSchema).min(1).required(),
    })
  ).optional(),
  // Extra individual services booked alongside a package/combo — billed additively on
  // top of the package's fixed price, instead of being folded into it.
  extraServices: Joi.array().items(serviceItemSchema).optional().default([]),
  partnerId: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null, ""),
  address: Joi.object({
    label: Joi.string().allow("", null),
    line1: Joi.string().required(),
    line2: Joi.string().allow("", null),
    city: Joi.string().allow("", null).default(""),
    state: Joi.string().allow("", null).default(""),
    pincode: Joi.string().allow("", null).default(""),
    lat: Joi.number().allow(null),
    lng: Joi.number().allow(null),
  }).required(),
  scheduledAt: Joi.date().required(),
  couponCode: Joi.string().trim().uppercase().allow("", null),
  offerId:    Joi.number().integer().allow(null),
  packageId:  Joi.number().integer().positive().allow(null),
  packageQty: Joi.number().integer().min(1).default(1),
  paymentMode: Joi.string().valid("online", "cod").default("online"),
  notes: Joi.string().trim().max(500).allow("", null),
}).unknown(true);

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow("", null),
  images: Joi.array().items(Joi.string().uri()).max(5),
});

/**
 * POST /api/v1/bookings
 */
const createBooking = catchAsync(async (req, res, next) => {
  const { error, value } = createBookingSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const now = Date.now();
  const scheduledMs = new Date(value.scheduledAt).getTime();
  if (scheduledMs < now + 60 * 60 * 1000) {
    return next(new AppError("Booking must be scheduled at least 1 hour from now", 400));
  }
  if (scheduledMs > now + 30 * 24 * 60 * 60 * 1000) {
    return next(new AppError("Booking cannot be scheduled more than 1 month in advance", 400));
  }
  // Compare against India time regardless of the server's own timezone.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(scheduledMs + IST_OFFSET_MS);
  const istMinutesOfDay = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
  if (istMinutesOfDay < 8 * 60 || istMinutesOfDay > 20 * 60) {
    return next(new AppError("Bookings are only available between 8 AM and 8 PM. Please choose a slot in that window.", 400));
  }

  const booking = await bookingsService.createBooking(req.user.userId, value);
  res.status(201).json({ status: true, message: "Booking created successfully", data: booking });
});

/**
 * GET /api/v1/bookings/:id
 */
const getBookingById = catchAsync(async (req, res, next) => {
  const booking = await bookingsService.getBookingById(req.user.userId, req.params.id);
  res.status(200).json({ status: true, data: booking });
});

/**
 * PATCH /api/v1/bookings/:id/cancel
 */
const cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await bookingsService.cancelBooking(
    req.user.userId,
    req.params.id,
    req.body.reason
  );
  res.status(200).json({ status: true, message: "Booking cancelled", data: booking });
});

const rescheduleSchema = Joi.object({
  scheduledAt: Joi.date().required(),
  reason: Joi.string().trim().max(500).allow("", null),
});

/**
 * PATCH /api/v1/bookings/:id/reschedule
 */
const rescheduleBooking = catchAsync(async (req, res, next) => {
  const { error, value } = rescheduleSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const now = Date.now();
  const scheduledMs = new Date(value.scheduledAt).getTime();
  if (scheduledMs < now + 60 * 60 * 1000) {
    return next(new AppError("Booking must be scheduled at least 1 hour from now", 400));
  }
  if (scheduledMs > now + 30 * 24 * 60 * 60 * 1000) {
    return next(new AppError("Booking cannot be scheduled more than 1 month in advance", 400));
  }
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(scheduledMs + IST_OFFSET_MS);
  const istMinutesOfDay = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
  if (istMinutesOfDay < 8 * 60 || istMinutesOfDay > 20 * 60) {
    return next(new AppError("Bookings are only available between 8 AM and 8 PM. Please choose a slot in that window.", 400));
  }

  const booking = await bookingsService.rescheduleBooking(req.user.userId, req.params.id, value.scheduledAt, value.reason);
  res.status(200).json({ status: true, message: "Booking rescheduled", data: booking });
});

/**
 * POST /api/v1/bookings/:id/review
 */
const submitReview = catchAsync(async (req, res, next) => {
  const { error, value } = reviewSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const review = await bookingsService.submitReview(req.user.userId, req.params.id, value);
  res.status(201).json({ status: true, message: "Review submitted", data: review });
});

const addServicesSchema = Joi.object({
  services: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
      qty: Joi.number().integer().min(1).default(1),
    })
  ).min(1).required(),
});

const addUserServices = catchAsync(async (req, res, next) => {
  const { error, value } = addServicesSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const booking = await bookingsService.addUserServices(req.user.userId, req.params.id, value.services);
  res.status(200).json({ status: true, message: 'Services added to booking', data: booking });
});

const updateServiceQtySchema = Joi.object({
  index: Joi.number().integer().min(0).required(),
  qty: Joi.number().integer().min(1).required(),
});

const updateServiceQty = catchAsync(async (req, res, next) => {
  const { error, value } = updateServiceQtySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const booking = await bookingsService.updateServiceQty(req.user.userId, req.params.id, value.index, value.qty);
  res.status(200).json({ status: true, message: 'Service quantity updated', data: booking });
});

const removeServiceSchema = Joi.object({
  index: Joi.number().integer().min(0).required(),
});

const removeService = catchAsync(async (req, res, next) => {
  const { error, value } = removeServiceSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const booking = await bookingsService.removeService(req.user.userId, req.params.id, value.index);
  res.status(200).json({ status: true, message: 'Service removed from booking', data: booking });
});

const removePackage = catchAsync(async (req, res, next) => {
  const booking = await bookingsService.removePackage(req.user.userId, req.params.id);
  res.status(200).json({ status: true, message: 'Package removed from booking', data: booking });
});

module.exports = { createBooking, getBookingById, cancelBooking, rescheduleBooking, submitReview, addUserServices, updateServiceQty, removeService, removePackage };
