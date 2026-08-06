const axios = require("axios");
const logger = require("./logger");
const {
  MOCK_SMS,
  SUNSTECH_SMS_KEY,
  SUNSTECH_SMS_ROUTE_ID,
  SUNSTECH_SMS_SENDER_ID,
  SUNSTECH_SMS_TEMPLATE_ID,
} = require("../config");

const SUNSTECH_SMS_URL = "https://sms.sunstechit.com/app/smsapi/index.php";

/**
 * Send OTP via SunsTechIT
 * @param {String} phone - 10-digit phone number (without country code)
 * @param {String} otp - OTP
 * @returns {Promise<Object>} SunsTechIT response
 */
const sendOtp = async (phone, otp) => {
  if (MOCK_SMS) {
    logger.info(`[MOCK SMS] OTP ${otp} sent to ${phone}`);
    return { success: true, mock: true };
  }

  try {
    const msg = `Your OTP for verification is ${otp}. Do not share this with anyone. - Godavari Wave Technologies`;

    const response = await axios.get(SUNSTECH_SMS_URL, {
      params: {
        key: SUNSTECH_SMS_KEY,
        campaign: 0,
        routeid: SUNSTECH_SMS_ROUTE_ID,
        type: "text",
        contacts: phone,
        senderid: SUNSTECH_SMS_SENDER_ID,
        msg,
        template_id: SUNSTECH_SMS_TEMPLATE_ID,
      },
    });

    logger.info(`OTP sent to ${phone} via SunsTechIT`);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error(`SMS send error for ${phone}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendOtp };
