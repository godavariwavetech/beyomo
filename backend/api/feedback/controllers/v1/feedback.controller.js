const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const feedbackService = require("../../services/v1/feedback.service");
const Joi = require("joi");

const feedbackSchema = Joi.object({
  type: Joi.string().valid("service", "app", "suggestion", "bug").required(),
  message: Joi.string().trim().min(10).max(2000).required(),
  rating: Joi.number().integer().min(1).max(5).allow(null),
  serviceBooked: Joi.string().trim().allow("", null),
  category: Joi.string().trim().allow("", null),
  version: Joi.string().trim().allow("", null),
  userName: Joi.string().trim().allow("", null),
});

/**
 * POST /api/v1/feedback
 */
const submitFeedback = catchAsync(async (req, res, next) => {
  const { error, value } = feedbackSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const userId = req.user?.userId || null;
  const userName = value.userName || "Anonymous";

  const feedback = await feedbackService.submitFeedback(userId, userName, value);
  res.status(201).json({ status: true, message: "Feedback submitted successfully", data: feedback });
});

module.exports = { submitFeedback };
