const axios = require("axios");
const logger = require("./logger");
const {
  MOCK_SMS,
  SUNSTECH_SMS_KEY,
  SUNSTECH_SMS_ROUTE_ID,
  SUNSTECH_SMS_SENDER_ID,
  SUNSTECH_SMS_TEMPLATE_ID,
  SUNSTECH_BOOKING_SMS_TEMPLATE_ID,
} = require("../config");

const SUNSTECH_SMS_URL = "https://sms.sunstechit.com/app/smsapi/index.php";

/**
 * Send OTP via SunsTechIT
 * @param {String} phone - 10-digit phone number (without country code)
 * @param {String} otp - OTP
 * @returns {Promise<Object>} SunsTechIT response
 */
const sendOtp = async (phone, otp, options = {}) => {
  const msg = options.message || `Your OTP for verification is ${otp}. Do not share this with anyone. - Godavari Wave Technologies`;
  if (MOCK_SMS) {
    logger.info(options.message ? `[MOCK SMS] ${msg} sent to ${phone}` : `[MOCK SMS] OTP ${otp} sent to ${phone}`);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.get(SUNSTECH_SMS_URL, {
      ...(options.timeout ? { timeout: options.timeout } : {}),
      params: {
        key: SUNSTECH_SMS_KEY,
        campaign: 0,
        routeid: SUNSTECH_SMS_ROUTE_ID,
        type: "text",
        contacts: phone,
        senderid: SUNSTECH_SMS_SENDER_ID,
        msg,
        template_id: options.templateId || SUNSTECH_SMS_TEMPLATE_ID,
      },
    });

    logger.info(`OTP sent to ${phone} via SunsTechIT`);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error(`SMS send error for ${phone}: ${error.message}`);
    throw error;
  }
};

const sendBookingOtp = async (phone, otp, bookingCode) => {
  if (!MOCK_SMS && !SUNSTECH_BOOKING_SMS_TEMPLATE_ID) {
    logger.warn('Booking confirmation SMS using the existing OTP template until SUNSTECH_BOOKING_SMS_TEMPLATE_ID is configured');
    return sendOtp(phone, otp, { timeout: 5000 });
  }
  const message = `Your Beyomo booking ${bookingCode} is confirmed. Your service OTP is ${otp}. Share this code with your partner only when the service starts. - Godavari Wave Technologies`;
  return sendOtp(phone, otp, { message, templateId: SUNSTECH_BOOKING_SMS_TEMPLATE_ID, timeout: 5000 });
};

module.exports = { sendOtp, sendBookingOtp };
