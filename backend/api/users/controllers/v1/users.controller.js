const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const usersService = require("../../services/v1/users.service");
const Joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60),
  email: Joi.string().email().trim().lowercase(),
  profilePicture: Joi.string().uri().allow(null, ""),
});

const addressSchema = Joi.object({
  label: Joi.string().trim().max(30).default("Home"),
  tag: Joi.string().trim().max(30),
  line1: Joi.string().trim().required(),
  line2: Joi.string().trim().allow("", null),
  city: Joi.string().trim().allow("", null).default(""),
  state: Joi.string().trim().allow("", null).default(""),
  pincode: Joi.string().allow("", null).default(""),
  lat: Joi.number().allow(null),
  lng: Joi.number().allow(null),
  isDefault: Joi.boolean().default(false),
}).unknown(true);

const addressUpdateSchema = Joi.object({
  label: Joi.string().trim().max(30),
  tag: Joi.string().trim().max(30),
  line1: Joi.string().trim(),
  line2: Joi.string().trim().allow("", null),
  city: Joi.string().trim().allow("", null),
  state: Joi.string().trim().allow("", null),
  pincode: Joi.string().allow("", null),
  lat: Joi.number().allow(null),
  lng: Joi.number().allow(null),
  isDefault: Joi.boolean(),
}).unknown(true);

/**
 * GET /api/v1/users/profile
 */
const getProfile = catchAsync(async (req, res, next) => {
  const user = await usersService.getProfile(req.user.userId);
  res.status(200).json({ status: true, message: "Profile fetched", data: user });
});

/**
 * PATCH /api/v1/users/profile
 */
const updateProfile = catchAsync(async (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const user = await usersService.updateProfile(req.user.userId, value);
  res.status(200).json({ status: true, message: "Profile updated", data: user });
});

/**
 * POST /api/v1/users/address
 */
const addAddress = catchAsync(async (req, res, next) => {
  const { error, value } = addressSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const address = await usersService.addAddress(req.user.userId, value);
  res.status(201).json({ status: true, message: "Address added", data: address });
});

/**
 * PUT /api/v1/users/address/:addressId
 */
const updateAddress = catchAsync(async (req, res, next) => {
  const { error, value } = addressUpdateSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const address = await usersService.updateAddress(req.user.userId, req.params.addressId, value);
  res.status(200).json({ status: true, message: "Address updated", data: address });
});

/**
 * DELETE /api/v1/users/address/:addressId
 */
const deleteAddress = catchAsync(async (req, res, next) => {
  const result = await usersService.deleteAddress(req.user.userId, req.params.addressId);
  res.status(200).json({ status: true, message: result.message });
});

/**
 * PATCH /api/v1/users/device-token
 */
const updateDeviceToken = catchAsync(async (req, res, next) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return next(new AppError("fcmToken is required", 400));

  const result = await usersService.updateDeviceToken(req.user.userId, fcmToken);
  res.status(200).json({ status: true, message: result.message });
});

/**
 * GET /api/v1/users/bookings
 */
const getBookings = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await usersService.getBookings(req.user.userId, page, limit);
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

/**
 * GET /api/v1/users/wallet
 */
const getWallet = catchAsync(async (req, res, next) => {
  const result = await usersService.getWallet(req.user.userId);
  res.status(200).json({ status: true, data: result });
});

/**
 * GET /api/v1/users/referral
 */
const getReferral = catchAsync(async (req, res) => {
  const result = await usersService.getReferral(req.user.userId);
  res.status(200).json({ status: true, data: result });
});

/**
 * GET /api/v1/users/reviews
 */
const getUserReviews = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await usersService.getUserReviews(req.user.userId, page, limit);
  res.status(200).json({ status: true, data: result.reviews, pagination: result.pagination });
});

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  updateDeviceToken,
  getBookings,
  getWallet,
  getReferral,
  getUserReviews,
};
