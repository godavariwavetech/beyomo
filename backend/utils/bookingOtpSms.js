const { sendBookingOtp } = require("./smsUtils");
const logger = require("./logger");

// Use the already-generated service OTP with booking-specific confirmation text.
// This never creates a login OTP or changes the booking's code.
const sendBookingOtpSms = async (booking, options = {}) => {
  if (!booking || booking.status !== "confirmed" || booking.otpVerifiedAt
      || !/^\d{4}$/.test(String(booking.serviceOtp ?? ""))) return;

  const deliver = async () => {
    try {
      const User = require("../api/users/models/user.model");
      const user = await User.findByPk(booking.userId, { attributes: ["phone"] });
      let phone = String(user?.phone ?? "").trim().replace(/[ ()-]/g, "");
      if (/^(?:\+91|91|0)[6-9]\d{9}$/.test(phone)) phone = phone.slice(-10);
      if (!/^[6-9]\d{9}$/.test(phone)) {
        logger.warn(`Booking OTP SMS skipped for booking ${booking.id}: invalid customer phone`);
        return;
      }
      await sendBookingOtp(phone, String(booking.serviceOtp), booking.bookingCode || String(booking.id));
    } catch (_) {
      // An SMS outage must not undo a confirmed booking or remove its in-app OTP.
      logger.warn(`Booking OTP SMS failed for booking ${booking.id}`);
    }
  };

  // Never send confirmation for a transaction that later rolls back.
  if (options.transaction) {
    options.transaction.afterCommit(deliver);
    return;
  }
  await deliver();
};

module.exports = { sendBookingOtpSms };
