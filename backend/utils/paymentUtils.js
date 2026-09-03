const Razorpay = require("razorpay");
const crypto = require("crypto");
const logger = require("./logger");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = require("../config");

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order
 * @param {Number} amount - amount in paise (multiply INR by 100)
 * @param {String} currency - default INR
 * @param {String} receipt - unique receipt ID
 * @param {Object} notes - optional notes
 * @returns {Promise<Object>} Razorpay order
 */
const createOrder = async (amount, currency = "INR", receipt, notes = {}) => {
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);
    logger.info(`Razorpay order created: ${order.id}`);
    return order;
  } catch (error) {
    // Razorpay SDK sometimes throws non-Error shapes (statusCode + error.description).
    // Log everything we can so undefined stops hiding the real cause.
    const desc = error?.error?.description ?? error?.description;
    const code = error?.statusCode ?? error?.error?.code;
    logger.error(`Razorpay order creation error: ${error?.message ?? desc ?? 'unknown'} | code=${code} | raw=${JSON.stringify(error)}`);
    throw new Error(desc || error?.message || 'Razorpay order creation failed');
  }
};

/**
 * Verify Razorpay payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature from payment response
 * @returns {Boolean} isValid
 */
const verifySignature = (orderId, paymentId, signature) => {
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === signature;
    if (!isValid) {
      logger.warn(`Invalid Razorpay signature for order: ${orderId}`);
    }
    return isValid;
  } catch (error) {
    logger.error(`Signature verification error: ${error.message}`);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {String} paymentId
 * @returns {Promise<Object>}
 */
const fetchPayment = async (paymentId) => {
  try {
    const razorpay = getRazorpayInstance();
    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    logger.error(`Razorpay fetch payment error: ${error.message}`);
    throw error;
  }
};

/**
 * Initiate refund
 * @param {String} paymentId
 * @param {Number} amount - amount in paise (optional, full refund if not provided)
 * @returns {Promise<Object>}
 */
const initiateRefund = async (paymentId, amount = null) => {
  try {
    const razorpay = getRazorpayInstance();
    const options = amount ? { amount: Math.round(amount * 100) } : {};
    const refund = await razorpay.payments.refund(paymentId, options);
    logger.info(`Refund initiated for payment ${paymentId}: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error(`Razorpay refund error: ${error.message}`);
    throw error;
  }
};

/**
 * Verify a Razorpay webhook request signature (HMAC-SHA256 over the raw request body,
 * keyed with the webhook secret configured in the Razorpay dashboard — separate from
 * the per-payment signature used by verifySignature above).
 * @param {Buffer|String} rawBody - exact bytes of the request body
 * @param {String} signature - value of the X-Razorpay-Signature header
 * @returns {Boolean} isValid
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    logger.error("RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook");
    return false;
  }
  try {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return expectedSignature === signature;
  } catch (error) {
    logger.error(`Webhook signature verification error: ${error.message}`);
    return false;
  }
};

module.exports = { createOrder, verifySignature, verifyWebhookSignature, fetchPayment, initiateRefund };
