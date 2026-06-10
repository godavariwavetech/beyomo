const axios = require("axios");
const logger = require("./logger");
const { MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID, MOCK_SMS } = require("../config");

/**
 * Send OTP via MSG91
 * @param {String} phone - 10-digit phone number (without country code)
 * @param {String} otp - 6-digit OTP
 * @returns {Promise<Object>} MSG91 response
 */
const sendOtp = async (phone, otp) => {
  if (MOCK_SMS) {
    logger.info(`[MOCK SMS] OTP ${otp} sent to ${phone}`);
    return { success: true, mock: true };
  }

  try {
    // Format phone number with country code
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    const url = `https://api.msg91.com/api/v5/otp`;
    const params = {
      template_id: MSG91_TEMPLATE_ID,
      mobile: formattedPhone,
      authkey: MSG91_AUTH_KEY,
      otp: otp,
    };

    const response = await axios.post(url, null, { params });

    if (response.data && response.data.type === "success") {
      logger.info(`OTP sent successfully to ${phone}`);
      return { success: true, data: response.data };
    } else {
      logger.error(`MSG91 OTP failed for ${phone}: ${JSON.stringify(response.data)}`);
      throw new Error(response.data?.message || "Failed to send OTP");
    }
  } catch (error) {
    logger.error(`SMS send error for ${phone}: ${error.message}`);
    throw error;
  }
};

/**
 * Resend OTP via MSG91
 * @param {String} phone - 10-digit phone number
 * @returns {Promise<Object>}
 */
const resendOtp = async (phone) => {
  if (MOCK_SMS) {
    logger.info(`[MOCK SMS] OTP resend triggered for ${phone}`);
    return { success: true, mock: true };
  }

  try {
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const url = `https://api.msg91.com/api/v5/otp/retry`;
    const params = {
      authkey: MSG91_AUTH_KEY,
      mobile: formattedPhone,
      retrytype: "text",
    };

    const response = await axios.post(url, null, { params });
    logger.info(`OTP resend triggered for ${phone}`);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error(`SMS resend error for ${phone}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendOtp, resendOtp };
