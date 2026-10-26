import { formatRupee } from './format.js';

export const whatsAppPhone = value => {
  const input = String(value ?? '').trim();
  if (!/^\+?[\d ()-]+$/.test(input)) return null;
  const international = input.startsWith('+') || input.startsWith('00');
  let digits = input.replace(/\D/g, '');
  if (input.startsWith('00')) digits = digits.slice(2);
  if (!international) {
    if (/^0[6-9]\d{9}$/.test(digits)) digits = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(digits)) digits = `91${digits}`;
    else if (!/^91[6-9]\d{9}$/.test(digits)) return null;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
};

export const bookingWhatsAppMessage = (booking, customer) => {
  const lines = [
    `Hi ${customer?.name || 'there'},`,
    `Your Beyomo booking ${booking.bookingCode || booking.id} ${booking.status === 'confirmed' ? 'is confirmed' : 'has been created'}.`,
  ];
  let services = booking.services;
  if (typeof services === 'string') {
    try { services = JSON.parse(services); } catch { services = []; }
  }
  if (Array.isArray(services)) {
    const names = services.filter(s => !s.removed && s.name).map(s => `${s.name}${Number(s.qty) > 1 ? ` × ${s.qty}` : ''}`);
    if (names.length) lines.push(`Services: ${names.join(', ')}`);
  }
  const scheduled = new Date(booking.scheduledAt);
  if (Number.isFinite(scheduled.getTime())) lines.push(`Scheduled: ${scheduled.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  })} IST`);
  if (booking.totalAmount != null && Number.isFinite(Number(booking.totalAmount))) lines.push(`Total: ${formatRupee(booking.totalAmount)}`);
  const address = [booking.addressLine1, booking.addressLine2, booking.addressCity, booking.addressState, booking.addressPincode].filter(Boolean).join(', ');
  if (address) lines.push(`Address: ${address}`);
  if (/^\d{4}$/.test(String(booking.serviceOtp ?? '')) && !booking.otpVerifiedAt) {
    lines.push(`Service OTP: ${booking.serviceOtp}`, 'Share this OTP with your partner only when they arrive at your location.');
  }
  lines.push('Thank you for choosing Beyomo!');
  return lines.join('\n');
};

export const bookingWhatsAppLink = (booking, customer) => {
  const phone = whatsAppPhone(customer?.phone);
  if (!phone || !booking || !(booking.bookingCode || booking.id)) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(bookingWhatsAppMessage(booking, customer))}`;
};
