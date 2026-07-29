const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const {
  sendOtpService,
  verifyOtpService,
  refreshTokenService,
  logoutService,
} = require("../../services/v1/auth.service");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");
const Partner = require("../../../partners/models/partner.model");
const PartnerSkillCategory = require("../../../skills/models/PartnerSkillCategory");

const saveBase64 = (dataUri, prefix, allowPdf = false) => {
  const imgMatch = dataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  const pdfMatch = allowPdf && dataUri.match(/^data:application\/pdf;base64,(.+)$/);
  const m = imgMatch || pdfMatch;
  if (!m) return null;
  const ext = imgMatch ? (imgMatch[1] === "jpeg" ? "jpg" : imgMatch[1]) : "pdf";
  const buf = Buffer.from(m[m.length - 1], "base64");
  const fname = `${prefix}-${Date.now()}.${ext}`;
  const dir = path.join(__dirname, "../../../../uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fname), buf);
  return `/uploads/${fname}`;
};

const partnerApplySchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({ "string.pattern.base": "Enter a valid 10-digit Indian mobile number" }),
  email: Joi.string().email().allow("", null),
  cityId: Joi.number().integer().positive().allow(null),
  city: Joi.string().trim().allow("", null),
  experience: Joi.number().integer().min(0).default(0),
  serviceCategoryIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  skillCategoryIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  professions: Joi.array().items(Joi.string().trim()).default([]),
  selfie: Joi.string().allow("", null),
  aadhar: Joi.string().allow("", null),
  agreement: Joi.string().allow("", null),
});

const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit Indian mobile number",
      "any.required": "Phone number is required",
    }),
  userType: Joi.string().valid("user", "partner").default("user"),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  otp: Joi.string().length(4).pattern(/^\d+$/).required().messages({
    "string.length": "OTP must be exactly 4 digits",
    "string.pattern.base": "OTP must contain only digits",
  }),
  userType: Joi.string().valid("user", "partner").default("user"),
});

/**
 * POST /api/v1/auth/send-otp
 */
const sendOtp = catchAsync(async (req, res, next) => {
  const { error, value } = sendOtpSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await sendOtpService(value.phone, value.userType);

  res.status(200).json({
    status: true,
    message: result.message,
  });
});

/**
 * POST /api/v1/auth/verify-otp
 */
const verifyOtp = catchAsync(async (req, res, next) => {
  const { error, value } = verifyOtpSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await verifyOtpService(value.phone, value.otp, value.userType);

  const entityKey = value.userType;
  const entity = result[entityKey];

  res.status(200).json({
    status: true,
    message: result.isNew ? "Account created successfully" : "Login successful",
    data: {
      token: result.token,
      isNew: result.isNew,
      [entityKey]: entity,
    },
  });
});

/**
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Token is required", 401));
  }

  const token = authHeader.split(" ")[1];
  const result = await refreshTokenService(token);

  res.status(200).json({
    status: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res, next) => {
  const { deviceToken } = req.body;
  const userId = req.user?.userId || req.partner?.userId;
  const userType = req.user ? "user" : "partner";

  if (!userId) return next(new AppError("Authentication required", 401));

  const result = await logoutService(userId, userType, deviceToken);

  res.status(200).json({
    status: true,
    message: result.message,
  });
});

/**
 * POST /api/v1/auth/partner-apply  (public — no auth)
 * Website partner registration form submission
 */
const partnerApply = catchAsync(async (req, res, next) => {
  const { error, value } = partnerApplySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const existing = await Partner.findOne({ where: { phone: value.phone } });
  if (existing) {
    if (existing.status === "rejected") return next(new AppError("Your previous application was rejected. Please contact support.", 400));
    return next(new AppError("An application with this phone number already exists.", 400));
  }

  const partnerData = {
    name: value.name,
    phone: value.phone,
    email: value.email || null,
    cityId: value.cityId || null,
    locationCity: value.city || null,
    experience: value.experience || 0,
    status: "pending",
    source: "website",
  };

  if (value.selfie?.startsWith("data:")) partnerData.profilePicture = saveBase64(value.selfie, "selfie") ?? null;
  if (value.aadhar?.startsWith("data:")) partnerData.aadharUrl = saveBase64(value.aadhar, "aadhar") ?? null;
  if (value.agreement?.startsWith("data:")) partnerData.agreementUrl = saveBase64(value.agreement, "agreement", true) ?? null;
  if (value.serviceCategoryIds?.length > 0) partnerData.serviceCategoryIds = value.serviceCategoryIds;
  if (value.professions?.length > 0) partnerData.professions = value.professions;

  const partner = await Partner.create(partnerData);

  // Save skill category selections
  if (Array.isArray(value.skillCategoryIds) && value.skillCategoryIds.length > 0) {
    await PartnerSkillCategory.bulkCreate(
      value.skillCategoryIds.map(skillCategoryId => ({ partnerId: partner.id, skillCategoryId })),
      { ignoreDuplicates: true }
    );
  }

  res.status(201).json({
    status: true,
    message: "Application submitted! Our team will review and contact you within 2–3 business days.",
  });
});

module.exports = { sendOtp, verifyOtp, refreshToken, logout, partnerApply };
