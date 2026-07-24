const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const partnersService = require("../../services/v1/partners.service");
const settlementsService = require("../../../settlements/services/v1/settlements.service");
const {sendSinglePushNotification} = require("../../../../utils/firebaseUtils");
const Joi = require("joi");

const claimServicesSchema = Joi.object({
  serviceIndices: Joi.array().items(Joi.number().integer().min(0)).min(1).required(),
});

const addExtraServicesSchema = Joi.object({
  services: Joi.array().items(
    Joi.alternatives().try(
      Joi.object({
        id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        qty: Joi.number().integer().min(1).default(1),
      }),
      Joi.object({
        isAddOn: Joi.boolean().valid(true).required(),
        name: Joi.string().trim().min(1).max(120).required(),
        price: Joi.number().min(0).required(),
        qty: Joi.number().integer().min(1).default(1),
      })
    )
  ).optional().default([]),
  removeIndices: Joi.array().items(Joi.number().integer().min(0)).optional().default([]),
  updateQty: Joi.array().items(
    Joi.object({
      index: Joi.number().integer().min(0).required(),
      qty: Joi.number().integer().min(1).required(),
    })
  ).optional().default([]),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60),
  email: Joi.string().email().trim().lowercase(),
  profilePicture: Joi.string().allow(null, ""), // accepts both https:// URLs and data: base64 URIs
  bio: Joi.string().trim().max(500).allow("", null),
  experience: Joi.number().min(0).max(50),
  cityId: Joi.number().integer().positive(),
  location: Joi.object({
    lat: Joi.number(),
    lng: Joi.number(),
    address: Joi.string().trim(),
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    pincode: Joi.string().pattern(/^\d{6}$/),
  }),
  services: Joi.array().items(
    Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.object({
        categoryId: Joi.alternatives().try(Joi.string(), Joi.number()),
        serviceId: Joi.alternatives().try(Joi.string(), Joi.number()),
        price: Joi.number().min(0).required(),
      })
    )
  ),
  skillCategoryIds: Joi.array().items(Joi.number().integer().positive()),
  serviceCategoryIds: Joi.array().items(Joi.number().integer().positive()),
  professions: Joi.array().items(Joi.string().trim()),
  gender: Joi.string().valid("female", "male"),
  homeServicesConsent: Joi.boolean(),
});

const documentsSchema = Joi.object({
  aadhar: Joi.string().allow(null, ""),   // base64 data URI or URL
  agreement: Joi.string().allow(null, ""), // base64 data URI or URL
  pan: Joi.string().allow(null, ""),
  bankDetails: Joi.object({
    accountNo: Joi.string().trim(),
    ifsc: Joi.string().trim().uppercase(),
    bankName: Joi.string().trim(),
    holderName: Joi.string().trim(),
  }),
});

/**
 * GET /api/v1/partners/profile
 */
const getProfile = catchAsync(async (req, res, next) => {
  const partner = await partnersService.getProfile(req.partner.userId);
  res.status(200).json({ status: true, message: "Profile fetched", data: partner });
});

/**
 * PATCH /api/v1/partners/profile
 */
const updateProfile = catchAsync(async (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const partner = await partnersService.updateProfile(req.partner.userId, value);
  res.status(200).json({ status: true, message: "Profile updated", data: partner });
});

/**
 * POST /api/v1/partners/documents
 */
const uploadDocuments = catchAsync(async (req, res, next) => {
  const { error, value } = documentsSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const documents = await partnersService.updateDocuments(req.partner.userId, value);
  res.status(200).json({ status: true, message: "Documents updated", data: documents });
});

/**
 * GET /api/v1/partners/dashboard
 */
const getDashboard = catchAsync(async (req, res, next) => {
  const data = await partnersService.getDashboard(req.partner.userId);
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/partners/bookings
 */
const getBookings = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status } = req.query;

  const result = await partnersService.getBookings(req.partner.userId, page, limit, status);
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

/**
 * GET /api/v1/partners/bookings/:id
 */
const getBookingById = catchAsync(async (req, res, next) => {
  const booking = await partnersService.getBookingById(req.partner.userId, req.params.id);
  res.status(200).json({ status: true, data: booking });
});

/**
 * PATCH /api/v1/partners/bookings/:id/status
 */
const updateBookingStatus = catchAsync(async (req, res, next) => {
  const { status, cashCollected } = req.body;
  const validStatuses = ["in_progress", "completed"];
  if (!status || !validStatuses.includes(status)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const booking = await partnersService.updateBookingStatus(
    req.partner.userId,
    req.params.id,
    status,
    cashCollected === true
  );
  res.status(200).json({ status: true, message: "Booking status updated", data: booking });
});

/**
 * PATCH /api/v1/partners/bookings/:id/arrived
 */
const markArrived = catchAsync(async (req, res, next) => {
  const booking = await partnersService.markArrived(req.partner.userId, req.params.id);
  res.status(200).json({ status: true, message: "Arrival recorded", data: booking });
});

/**
 * PATCH /api/v1/partners/device-token
 */
const updateDeviceToken = catchAsync(async (req, res, next) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return next(new AppError("fcmToken is required", 400));

  const result = await partnersService.updateDeviceToken(req.partner.userId, fcmToken);
  res.status(200).json({ status: true, message: result.message });
});

/**
 * GET /api/v1/partners/bookings/available
 */
const getAvailableBookings = catchAsync(async (req, res) => {
  const bookings = await partnersService.getAvailableBookings(req.partner.userId);
  res.status(200).json({ status: true, data: bookings });
});

/**
 * POST /api/v1/partners/bookings/:id/accept
 */
const acceptBooking = catchAsync(async (req, res, next) => {
  const booking = await partnersService.acceptBooking(req.partner.userId, req.params.id);
  res.status(200).json({ status: true, message: 'Booking accepted', data: booking });
});

/**
 * GET /api/v1/partners/earnings?period=week|month|all
 */
const getEarnings = catchAsync(async (req, res) => {
  const period = ["week", "month", "all"].includes(req.query.period)
    ? req.query.period
    : "month";
  const data = await partnersService.getEarnings(req.partner.userId, period);
  res.status(200).json({ status: true, data });
});

/**
 * POST /api/v1/partners/test-notification
 */
const sendTestNotification = catchAsync(async (req, res, next) => {
  const partner = await partnersService.getProfile(req.partner.userId);

  if (!partner.fcmToken) {
    return next(new AppError("No device token registered for this partner", 400));
  }

  const result = await sendSinglePushNotification(
    partner.fcmToken,
    "Test Notification",
    "This is a test notification from Beyomo",
    {type: "test", timestamp: new Date().toISOString()}
  );

  if (!result.success) {
    return next(new AppError(`Failed to send notification: ${result.reason || result.error}`, 500));
  }

  res.status(200).json({
    status: true,
    message: "Test notification sent successfully",
    data: {token: partner.fcmToken.substring(0, 20) + "..."}
  });
});

/**
 * POST /api/v1/partners/bookings/:id/claim-services
 * Partner selects which specific services in a multi-service booking they will handle.
 */
const claimServices = catchAsync(async (req, res, next) => {
  const { error, value } = claimServicesSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const booking = await partnersService.claimServices(req.partner.userId, req.params.id, value.serviceIndices);
  res.status(200).json({ status: true, message: 'Services claimed successfully', data: booking });
});

/**
 * PATCH /api/v1/partners/bookings/:id/extra-services
 */
const addExtraServices = catchAsync(async (req, res, next) => {
  const { error, value } = addExtraServicesSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  if (!value.services.length && !value.removeIndices.length && !value.updateQty.length)
    return next(new AppError("Provide services to add, indices to remove, or quantities to update", 400));

  const booking = await partnersService.addExtraServices(req.partner.userId, req.params.id, value);
  res.status(200).json({ status: true, message: 'Booking services updated', data: booking });
});

/**
 * GET /api/v1/partners/wallet
 */
const getWallet = catchAsync(async (req, res) => {
  const result = await settlementsService.getPartnerLedger(req.partner.userId, {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadDocuments,
  getDashboard,
  getBookings,
  getBookingById,
  getAvailableBookings,
  acceptBooking,
  claimServices,
  updateBookingStatus,
  markArrived,
  updateDeviceToken,
  getEarnings,
  addExtraServices,
  sendTestNotification,
  getWallet,
};
