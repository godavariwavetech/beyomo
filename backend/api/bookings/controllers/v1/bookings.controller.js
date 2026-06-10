const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const bookingsService = require("../../services/v1/bookings.service");
const Joi = require("joi");

const createBookingSchema = Joi.object({
  services: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
      qty: Joi.number().integer().min(1).default(1),
    })
  ).min(1).required(),
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

/**
 * POST /api/v1/bookings/:id/review
 */
const submitReview = catchAsync(async (req, res, next) => {
  const { error, value } = reviewSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const review = await bookingsService.submitReview(req.user.userId, req.params.id, value);
  res.status(201).json({ status: true, message: "Review submitted", data: review });
});

const respondServiceUpdate = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action))
    return next(new AppError("action must be 'approve' or 'reject'", 400));
  const booking = await bookingsService.respondServiceUpdate(req.user.userId, req.params.id, action);
  res.json({ status: true, message: action === 'approve' ? 'Changes approved' : 'Changes rejected', data: booking });
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

module.exports = { createBooking, getBookingById, cancelBooking, submitReview, respondServiceUpdate, addUserServices };
