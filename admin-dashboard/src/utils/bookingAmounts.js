// The saved total is base - coupon discount + tax. Use the same amounts for
// the subtotal display so an older baseAmount cannot survive a pricing update.
export function bookingBaseAmount(booking = {}) {
  const total = Number(booking.totalAmount);
  const tax = Number(booking.taxAmount);
  const discount = Number(booking.couponDiscountAmount ?? 0);
  if (booking.totalAmount != null && booking.taxAmount != null
    && Number.isFinite(total) && Number.isFinite(tax) && Number.isFinite(discount)) {
    return Math.round((total - tax + discount) * 100) / 100;
  }
  return Number(booking.baseAmount ?? booking.amount ?? 0) || 0;
}
