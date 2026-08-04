const Payment = require("../../models/payment.model");
const Booking = require("../../../bookings/models/booking.model");
const Notification = require("../../../notifications/models/notification.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const { createOrder, verifySignature } = require("../../../../utils/paymentUtils");

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

  const payment = await Payment.findOne({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) return; // order not created by us, or not found — nothing to reconcile

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

module.exports = { createPaymentOrder, verifyPayment, handleWebhookEvent, getPaymentHistory };
