const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const paymentsService = require("../../services/v1/payments.service");
const { verifyWebhookSignature } = require("../../../../utils/paymentUtils");
const logger = require("../../../../utils/logger");
const Joi = require("joi");

const createOrderSchema = Joi.object({
  bookingId: Joi.string().required(),
});

const verifySchema = Joi.object({
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
  bookingId: Joi.string().required(),
});

/**
 * POST /api/v1/payments/create-order
 */
const createOrder = catchAsync(async (req, res, next) => {
  const { error, value } = createOrderSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await paymentsService.createPaymentOrder(req.user.userId, value.bookingId);
  res.status(200).json({ status: true, message: "Order created", data: result });
});

/**
 * POST /api/v1/payments/verify
 */
const verifyPayment = catchAsync(async (req, res, next) => {
  const { error, value } = verifySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await paymentsService.verifyPayment(req.user.userId, value);
  res.status(200).json({ status: true, message: "Payment verified successfully", data: result });
});

/**
 * GET /api/v1/payments/history
 */
const getHistory = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await paymentsService.getPaymentHistory(req.user.userId, page, limit);
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

/**
 * POST /api/v1/payments/webhook
 * Called directly by Razorpay's servers (not the app) — no user auth, verified instead
 * by an HMAC signature over the raw request body.
 */
const webhook = catchAsync(async (req, res, next) => {
  const signature = req.get("X-Razorpay-Signature");
  if (!signature || !verifyWebhookSignature(req.rawBody, signature)) {
    logger.error("Rejected Razorpay webhook: invalid or missing signature");
    return next(new AppError("Invalid signature", 400));
  }

  await paymentsService.handleWebhookEvent(req.body.event, req.body.payload);
  res.status(200).json({ status: true });
});

module.exports = { createOrder, verifyPayment, getHistory, webhook };
