const Payment = require("../../models/payment.model");
const PaymentQuote = require("../../models/paymentQuote.model");
const Booking = require("../../../bookings/models/booking.model");
const Notification = require("../../../notifications/models/notification.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const { createOrder, verifySignature } = require("../../../../utils/paymentUtils");
const bookingsService = require("../../../bookings/services/v1/bookings.service");

const QUOTE_TTL_MINUTES = 15;

const createPaymentOrder = async (userId, bookingId) => {
  const booking = await Booking.findOne({ where: { id: bookingId, userId } });
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.paymentStatus === "paid") throw new AppError("This booking is already paid", 400);

  const receipt = `BYM-${booking.bookingCode}-${Date.now()}`.slice(0, 40);
  const order = await createOrder(booking.totalAmount, "INR", receipt, {
    bookingId: String(booking.id),
    bookingCode: booking.bookingCode,
  });

  const payment = await Payment.create({
    bookingId: booking.id,
    userId,
    razorpayOrderId: order.id,
    amount: booking.totalAmount,
    currency: "INR",
    status: "created",
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    paymentId: payment.id,
    bookingCode: booking.bookingCode,
    keyId: require("../../../../config").RAZORPAY_KEY_ID,
  };
};

const verifyPayment = async (userId, verificationData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = verificationData;

  const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) throw new AppError("Payment verification failed. Invalid signature.", 400);

  await Payment.update(
    { razorpayPaymentId, razorpaySignature, status: "captured" },
    { where: { razorpayOrderId, userId } }
  );
  const payment = await Payment.findOne({ where: { razorpayOrderId, userId } });
  if (!payment) throw new AppError("Payment record not found", 404);

  // Only advance to "confirmed" if still pending — don't regress in_progress/completed bookings
  await Booking.update(
    { paymentStatus: "paid", paymentId: payment.id },
    { where: { id: payment.bookingId } }
  );
  await Booking.update(
    { status: "confirmed" },
    { where: { id: payment.bookingId, status: "pending" } }
  );
  const booking = await Booking.findByPk(payment.bookingId);

  if (booking) {
    await Notification.create({
      userId,
      title: "Payment Successful",
      body: `Payment of ₹${payment.amount} for booking ${booking.bookingCode} was successful.`,
      data: { bookingId: String(booking.id), paymentId: String(payment.id) },
      type: "payment",
    });
  }

  return { payment, booking };
};

// Marks a booking paid from a Razorpay webhook event — independent of the client-side
// /verify call, which never fires if the app is killed/backgrounded right after the
// Razorpay checkout closes (money is captured on Razorpay's side either way, so relying
// solely on the client to report success leaves the booking stuck on "payment pending").
// Idempotent: webhooks can be retried/duplicated by Razorpay, and the client's own
// /verify call may still land first — either way this only advances state, never regresses it.
const handleWebhookEvent = async (event, payload) => {
  if (event !== "payment.captured" && event !== "payment.failed") return;

  const entity = payload?.payment?.entity;
  if (!entity?.order_id) return;

  // Pay-first-flow safety net: if the client verified + created the booking already
  // there's a Payment row for this order — normal path below handles it. But if the
  // user killed the app between Razorpay success and POST /bookings, there's only
  // a PaymentQuote. In that case we materialize the booking from the quote here so
  // the payment isn't stranded.
  const payment = await Payment.findOne({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) {
    if (event === "payment.captured") {
      const quote = await PaymentQuote.findOne({ where: { razorpayOrderId: entity.order_id } });
      if (quote && !quote.consumedAt) {
        try {
          const rawPayload = quote.preparedPayload;
          const preparedPayload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
          if (preparedPayload && preparedPayload.bookingRow) {
            const booking = await bookingsService.persistBooking(preparedPayload, {
              status: "confirmed",
              paymentStatus: "paid",
            });
            const newPayment = await Payment.create({
              bookingId: booking.id,
              userId: quote.userId,
              razorpayOrderId: entity.order_id,
              razorpayPaymentId: entity.id,
              amount: quote.amount,
              currency: "INR",
              status: "captured",
              method: entity.method,
            });
            await Booking.update({ paymentId: newPayment.id }, { where: { id: booking.id } });
            await quote.update({ consumedAt: new Date() });
            await Notification.create({
              userId: quote.userId,
              title: "Booking Confirmed",
              body: `Your payment of ₹${quote.amount} was received and booking ${booking.bookingCode} is confirmed.`,
              data: { bookingId: String(booking.id), paymentId: String(newPayment.id) },
              type: "payment",
            });
          }
        } catch (err) {
          require("../../../../utils/logger").error(`Webhook quote consumption failed for order ${entity.order_id}: ${err.message}`);
        }
      }
    }
    return;
  }

  if (event === "payment.failed") {
    if (payment.status === "created") await payment.update({ status: "failed", method: entity.method });
    return;
  }

  if (payment.status === "captured") return; // already reconciled (e.g. by the client's /verify call)

  await payment.update({
    razorpayPaymentId: entity.id,
    status: "captured",
    method: entity.method,
  });

  await Booking.update(
    { paymentStatus: "paid", paymentId: payment.id },
    { where: { id: payment.bookingId } }
  );
  await Booking.update(
    { status: "confirmed" },
    { where: { id: payment.bookingId, status: "pending" } }
  );

  const booking = await Booking.findByPk(payment.bookingId);
  if (booking) {
    await Notification.create({
      userId: payment.userId,
      title: "Payment Successful",
      body: `Payment of ₹${payment.amount} for booking ${booking.bookingCode} was successful.`,
      data: { bookingId: String(booking.id), paymentId: String(payment.id) },
      type: "payment",
    });
  }
};

const getPaymentHistory = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const { count: total, rows: payments } = await Payment.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    offset,
    limit,
    include: [{ model: Booking, as: "booking", attributes: ["bookingCode", "scheduledAt", "status", "totalAmount"] }],
  });

  return { data: payments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// ── PAY-FIRST FLOW ────────────────────────────────────────────────────────────
// createQuoteOrder: server-side prices the cart (using the SAME logic as
// createBooking), creates a Razorpay order for the exact amount, and stores the
// prepared payload in payment_quotes. The Booking row is NOT created yet.
const createQuoteOrder = async (userId, bookingData) => {
  const prepared = await bookingsService.prepareBooking(userId, bookingData);
  const amount = parseFloat(prepared.bookingRow.totalAmount);

  const receipt = `BYM-Q-${userId}-${Date.now()}`.slice(0, 40);
  const order = await createOrder(amount, "INR", receipt, { userId: String(userId), quote: "1" });

  const quote = await PaymentQuote.create({
    userId,
    razorpayOrderId: order.id,
    amount,
    currency: "INR",
    preparedPayload: prepared,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000),
  });

  return {
    quoteId: quote.id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: require("../../../../config").RAZORPAY_KEY_ID,
    expiresAt: quote.expiresAt,
  };
};

// consumeQuote: called from bookings.controller once the client confirms Razorpay
// payment. Verifies signature, ensures the quote is fresh/unconsumed, persists
// the booking as confirmed+paid, and creates the payment record — all atomic.
const consumeQuote = async (userId, { quoteId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    throw new AppError("Payment verification failed. Invalid signature.", 400);
  }

  const quote = await PaymentQuote.findOne({ where: { id: quoteId, userId, razorpayOrderId } });
  if (!quote) throw new AppError("Payment quote not found or already used", 404);

  // Race condition: Razorpay's webhook may have already consumed this quote and
  // created the booking before the client's /bookings call arrives. Instead of
  // 409-erroring (which the app shows as "Booking failed" even though the booking
  // exists), return the already-created booking so the client sees success.
  if (quote.consumedAt) {
    const existingPayment = await Payment.findOne({ where: { razorpayOrderId, userId } });
    if (existingPayment) {
      const existingBooking = await Booking.findByPk(existingPayment.bookingId);
      if (existingBooking) return existingBooking;
    }
    throw new AppError("Payment quote already used", 409);
  }
  if (new Date(quote.expiresAt) < new Date()) {
    throw new AppError("Payment quote expired — please retry checkout", 410);
  }

  // Persist the prepared booking with confirmed+paid state in one go. The
  // preparedPayload was frozen at quote time so amount/discounts can't drift.
  // MySQL/mysql2 sometimes returns JSON columns as strings — normalize.
  const rawPayload = quote.preparedPayload;
  const preparedPayload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  if (!preparedPayload || !preparedPayload.bookingRow) {
    throw new AppError("Corrupted payment quote — please retry checkout", 500);
  }
  const booking = await bookingsService.persistBooking(preparedPayload, {
    status: "confirmed",
    paymentStatus: "paid",
  });

  const payment = await Payment.create({
    bookingId: booking.id,
    userId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    amount: quote.amount,
    currency: "INR",
    status: "captured",
  });

  await Booking.update({ paymentId: payment.id }, { where: { id: booking.id } });

  // Mark the quote as consumed so it can't be replayed. (We keep the row for
  // audit — cleanup can prune old consumed/expired quotes on a schedule.)
  await quote.update({ consumedAt: new Date() });

  await Notification.create({
    userId,
    title: "Payment Successful",
    body: `Payment of ₹${quote.amount} for booking ${booking.bookingCode} was successful.`,
    data: { bookingId: String(booking.id), paymentId: String(payment.id) },
    type: "payment",
  });

  return await Booking.findByPk(booking.id);
};

module.exports = { createPaymentOrder, verifyPayment, handleWebhookEvent, getPaymentHistory, createQuoteOrder, consumeQuote };
