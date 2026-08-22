const { Op } = require("sequelize");
const Otp = require("../../models/otp.model");
const User = require("../../../users/models/user.model");
const Partner = require("../../../partners/models/partner.model");
const { sendOtp } = require("../../../../utils/smsUtils");
const { signToken } = require("../../../../utils/jwtUtils");
const AppError = require("../../../../utils/errorHandlers/appError");
const logger = require("../../../../utils/logger");

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 0;

const TEST_PHONE_NUMBERS = ["7997753587"];

const generateOtp = (phone) => {
  if (TEST_PHONE_NUMBERS.includes(String(phone))) return "1234";
  return String(Math.floor(1000 + Math.random() * 9000));
};

const sendOtpService = async (phone, userType = "user") => {
  if (userType === "partner") {
    const partner = await Partner.findOne({ where: { phone } });
    if (partner && partner.status === "suspended") {
      throw new AppError("Your partner account has been suspended. Please contact support.", 403);
    }
  }

  const recentOtp = await Otp.findOne({
    where: {
      phone,
      userType,
      isUsed: false,
      createdAt: { [Op.gte]: new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000) },
    },
  });

  if (recentOtp) {
    const waitSeconds = Math.ceil(
      (new Date(recentOtp.createdAt).getTime() + RATE_LIMIT_MINUTES * 60 * 1000 - Date.now()) / 1000
    );
    throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP`, 429);
  }

  await Otp.update({ isUsed: true }, { where: { phone, userType, isUsed: false } });

  const otp = generateOtp(phone);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await Otp.create({ phone, otp, userType, expiresAt, attempts: 0, isUsed: false });

  await sendOtp(phone, otp);
  logger.info(`OTP sent to ${phone} for userType=${userType}`);
  return { message: "OTP sent successfully" };
};

const verifyOtpService = async (phone, otp, userType = "user") => {
  const otpDoc = await Otp.findOne({
    where: {
      phone,
      userType,
      isUsed: false,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [["createdAt", "DESC"]],
  });

  if (!otpDoc) throw new AppError("OTP has expired or is invalid. Please request a new one.", 400);

  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await otpDoc.update({ isUsed: true });
    throw new AppError("Maximum OTP attempts exceeded. Please request a new one.", 400);
  }

  if (otpDoc.otp !== String(otp)) {
    await otpDoc.increment("attempts");
    const remaining = MAX_ATTEMPTS - (otpDoc.attempts + 1);
    throw new AppError(
      `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "No attempts remaining."}`,
      400
    );
  }

  await otpDoc.update({ isUsed: true });

  let entity;
  let isNew = false;

  if (userType === "user") {
    entity = await User.findOne({ where: { phone } });
    if (!entity) {
      entity = await User.create({ phone, status: "active" });
      isNew = true;
    } else if (entity.status === "blocked") {
      throw new AppError("Your account has been blocked. Please contact support.", 403);
    } else if (entity.status === "deleted") {
      throw new AppError("Account not found.", 404);
    }
  } else if (userType === "partner") {
    entity = await Partner.findOne({ where: { phone } });
    if (!entity) {
      entity = await Partner.create({ phone, status: "pending" });
      isNew = true;
    } else if (entity.status === "suspended") {
      throw new AppError("Your partner account has been suspended. Please contact support.", 403);
    } else if (entity.status === "deleted") {
      throw new AppError("Account not found.", 404);
    }
  } else {
    throw new AppError("Invalid userType", 400);
  }

  const token = signToken({
    userId: entity.id,
    userType,
    role: userType,
    phone: entity.phone,
  });

  return { token, isNew, [userType]: entity };
};

const refreshTokenService = async (token) => {
  const { decodeToken } = require("../../../../utils/jwtUtils");
  let decoded;
  try {
    decoded = decodeToken(token);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const { userId, userType } = decoded;
  let entity;

  if (userType === "user") {
    entity = await User.findByPk(userId);
    if (!entity || entity.status !== "active") throw new AppError("User account not found or inactive", 401);
  } else if (userType === "partner") {
    entity = await Partner.findByPk(userId);
    if (!entity) throw new AppError("Partner account not found", 401);
  } else {
    throw new AppError("Invalid token type for refresh", 401);
  }

  const newToken = signToken({ userId: entity.id, userType, role: userType, phone: entity.phone });
  return { token: newToken };
};

const logoutService = async (userId, userType, deviceToken) => {
  if (userType === "user") {
    const user = await User.findByPk(userId);
    if (user) {
      const tokens = (user.deviceTokens || []).filter((t) => t !== deviceToken);
      await user.update({ deviceTokens: tokens, fcmToken: null });
    }
  } else if (userType === "partner") {
    const partner = await Partner.findByPk(userId);
    if (partner) {
      const tokens = (partner.deviceTokens || []).filter((t) => t !== deviceToken);
      await partner.update({ deviceTokens: tokens, fcmToken: null });
    }
  }
  return { message: "Logged out successfully" };
};

module.exports = { sendOtpService, verifyOtpService, refreshTokenService, logoutService };
