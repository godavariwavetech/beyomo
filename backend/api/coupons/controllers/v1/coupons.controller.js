const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const couponsService = require("../../services/v1/coupons.service");
const Joi = require("joi");

const applyCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  orderAmount: Joi.number().positive().required(),
});

/**
 * GET /api/v1/coupons
 */
const listCoupons = catchAsync(async (req, res) => {
  const cityId = req.query.cityId ? Number(req.query.cityId) : null;
  const coupons = await couponsService.listPublicCoupons(cityId);
  res.status(200).json({ status: true, data: { coupons } });
});

/**
 * POST /api/v1/coupons/validate
 */
const validateCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  if (!code) return next(new AppError("Coupon code is required", 400));
  const result = await couponsService.validateCoupon(code);
  res.status(200).json({ status: true, message: result.message, data: result });
});

/**
 * POST /api/v1/coupons/apply
 */
const applyCoupon = catchAsync(async (req, res, next) => {
  const { error, value } = applyCouponSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await couponsService.applyCoupon(value.code, value.orderAmount);

  res.status(200).json({
    status: true,
    message: "Coupon applied successfully",
    data: result,
  });
});

module.exports = { listCoupons, validateCoupon, applyCoupon };
