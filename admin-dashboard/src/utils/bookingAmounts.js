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

// Removed lines remain in the booking for history, but must not dilute the
// assigned partners' share of the current booking earning.
export function bookingServicePayouts(services, earning) {
  const active = (Array.isArray(services) ? services : []).filter(s => !s.removed);
  const lineAmount = s => (Number(s.price) || 0) * (Number(s.qty) || 1);
  const rawTotal = active.reduce((sum, s) => sum + lineAmount(s), 0);
  const byPartner = {};
  active.forEach(s => {
    if (!s.assignedPartnerId) return;
    const key = String(s.assignedPartnerId);
    if (!byPartner[key]) byPartner[key] = { name: s.assignedPartnerName || 'Partner', amount: 0 };
    byPartner[key].amount += lineAmount(s);
  });
  return Object.values(byPartner).map(p => ({
    ...p,
    amount: rawTotal > 0 ? p.amount * (Number(earning) / rawTotal) : 0,
  }));
}
