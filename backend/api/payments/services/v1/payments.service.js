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

module.exports = { createPaymentOrder, verifyPayment, getPaymentHistory };
