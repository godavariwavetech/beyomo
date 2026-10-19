const axios = require("axios");
const config = require("../config");
const logger = require("./logger");

// India is the app's service area. Preserve explicit international country codes.
const normalizeWhatsAppPhone = (value) => {
  const input = String(value ?? "").trim();
  if (!/^\+?[\d ()-]+$/.test(input)) return null;
  const international = input.startsWith("+") || input.startsWith("00");
  let digits = input.replace(/\D/g, "");
  if (input.startsWith("00")) digits = digits.slice(2);
  if (!international) {
    if (/^0\d{10}$/.test(digits)) digits = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(digits)) digits = `91${digits}`;
    else if (!/^91[6-9]\d{9}$/.test(digits)) return null;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
};

const templateText = (value, fallback) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 500) || fallback;

// Positional body parameters must match the approved template in .env.example.
const bookingTemplateParameters = (booking, customer, serviceName) => {
  const scheduled = new Date(booking.scheduledAt);
  const amount = Number(booking.totalAmount);
  if (!booking.bookingCode || !Number.isFinite(scheduled.getTime()) || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid booking confirmation details");
  }
  const date = scheduled.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  return [
    templateText(customer.name, "Customer"),
    templateText(booking.bookingCode, String(booking.id)),
    templateText(serviceName, "Home service"),
    `${date} IST`,
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount),
    templateText([booking.addressLine1, booking.addressLine2, booking.addressCity, booking.addressState, booking.addressPincode].filter(Boolean).join(", "), "See your booking in the app"),
  ].map(text => ({ type: "text", text }));
};

// Called once after persistence by both booking paths. Never reject a saved booking
// because messaging is unavailable. API acceptance is not proof of delivery.
const sendBookingWhatsAppConfirmation = async (booking, customer, serviceName) => {
  if (!config.WHATSAPP_ENABLED) return { status: "skipped", reason: "disabled" };
  if (!config.WHATSAPP_ACCESS_TOKEN || !/^\d+$/.test(config.WHATSAPP_PHONE_NUMBER_ID)
      || !/^v\d+\.\d+$/.test(config.WHATSAPP_API_VERSION)
      || !/^[a-z0-9_]+$/.test(config.WHATSAPP_BOOKING_TEMPLATE)
      || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(config.WHATSAPP_TEMPLATE_LANGUAGE)) {
    logger.warn(`WhatsApp booking confirmation skipped for booking ${booking.id}: configuration incomplete or invalid`);
    return { status: "skipped", reason: "configuration" };
  }
  const to = normalizeWhatsAppPhone(customer?.phone);
  if (!to) {
    logger.warn(`WhatsApp booking confirmation skipped for booking ${booking.id}: invalid customer phone`);
    return { status: "skipped", reason: "phone" };
  }
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp", recipient_type: "individual", to, type: "template",
        template: {
          name: config.WHATSAPP_BOOKING_TEMPLATE,
          language: { code: config.WHATSAPP_TEMPLATE_LANGUAGE },
          components: [{ type: "body", parameters: bookingTemplateParameters(booking, customer, serviceName) }],
        },
      },
      { headers: { Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}` }, timeout: 5000, maxRedirects: 0 }
    );
    const messageId = response.data?.messages?.[0]?.id;
    if (!messageId) throw new Error("Missing WhatsApp message ID");
    logger.info(`WhatsApp booking confirmation accepted for booking ${booking.id}`);
    return { status: "accepted", messageId };
  } catch (error) {
    // Axios errors contain tokens and customer details: log only numeric provider codes.
    const code = Number(error.response?.data?.error?.code);
    const status = Number(error.response?.status);
    logger.warn(`WhatsApp booking confirmation failed for booking ${booking.id}${Number.isFinite(status) ? ` (HTTP ${status})` : ""}${Number.isFinite(code) ? ` (provider code ${code})` : ""}`);
    return { status: "failed" };
  }
};

module.exports = { normalizeWhatsAppPhone, bookingTemplateParameters, sendBookingWhatsAppConfirmation };
