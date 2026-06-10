const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp, refreshToken, logout, partnerApply } = require("../../controllers/v1/auth.controller");
const rateLimit = require("express-rate-limit");

// Rate limiter for OTP sending
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 OTP requests per 10 minutes per IP
  message: {
    status: false,
    message: "Too many OTP requests. Please try again after 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-otp", otpRateLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/partner-apply", partnerApply);

module.exports = router;
