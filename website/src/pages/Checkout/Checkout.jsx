import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../context/CityContext';
import OtpLoginModal from '../../components/OtpLoginModal';
import AddressMapPicker from '../../components/AddressMapPicker';
import SlotPicker, { validateSlot } from '../../components/SlotPicker';
import CouponInput from '../../components/CouponInput';
import { createBooking } from '../../api/bookings';
import { createPaymentOrder, verifyPayment } from '../../api/payments';
import { loadRazorpayScript } from '../../utils/razorpay';

const PLATFORM_FEE = 30;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { token, user, isAuthenticated } = useAuth();
  const { city } = useCity();
  const navigate = useNavigate();

  const [loginOpen, setLoginOpen] = useState(!isAuthenticated);
  const [address, setAddress] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [slotError, setSlotError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMode, setPaymentMode] = useState('online');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (items.length === 0) navigate('/services');
  }, [items, navigate]);

  useEffect(() => {
    setLoginOpen(!isAuthenticated);
  }, [isAuthenticated]);

  if (items.length === 0) return null;

  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(subtotal - discount, 0) + PLATFORM_FEE;

  const handleSubmit = async () => {
    const err = validateSlot(scheduledAt);
    setSlotError(err);
    if (err) return;
    if (!address) {
      setSubmitError('Please select a service address on the map.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        services: items.map((i) => ({ id: i.id, qty: i.qty })),
        address: {
          label: address.label,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          lat: address.lat,
          lng: address.lng,
        },
        scheduledAt: new Date(scheduledAt).toISOString(),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        paymentMode,
      };

      const bookingRes = await createBooking(payload, token);
      const booking = bookingRes.data;
      clearCart();

      if (paymentMode === 'cod') {
        navigate(`/booking-confirmed/${booking.id}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setSubmitError('Could not load the payment gateway. Please try again, or choose Cash on Delivery.');
        setSubmitting(false);
        return;
      }

      const orderRes = await createPaymentOrder(booking.id, token);
      const order = orderRes.data;

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Beyomo',
        description: order.bookingCode || booking.bookingCode,
        prefill: { contact: user?.phone, name: user?.name, email: user?.email },
        theme: { color: '#105641' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: booking.id,
            }, token);
          } finally {
            navigate(`/booking-confirmed/${booking.id}`);
          }
        },
        modal: {
          ondismiss: () => navigate(`/booking-confirmed/${booking.id}`),
        },
      });
      rzp.open();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <OtpLoginModal open={loginOpen} onClose={() => navigate('/services')} onSuccess={() => setLoginOpen(false)} />

      <div className="page-hero page-hero-compact">
        <div className="container page-hero-inner">
          <span className="badge">Checkout</span>
          <h1>Confirm Your Booking</h1>
        </div>
      </div>

      {!loginOpen && (
        <div className="section" style={{ paddingTop: 40 }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Service Address</h3>
              <AddressMapPicker city={city} onConfirm={setAddress} />
              {address && (
                <div style={{ marginTop: 12, padding: 14, background: '#D1FAE5', borderRadius: 'var(--r-md)', fontSize: 13, color: '#065F46' }}>
                  ✓ Address selected: {address.line1}, {address.city}
                </div>
              )}

              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '32px 0 16px' }}>Schedule</h3>
              <SlotPicker value={scheduledAt} onChange={setScheduledAt} error={slotError} />

              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '32px 0 16px' }}>Coupon</h3>
              <CouponInput
                orderAmount={subtotal}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
                onRemove={() => setAppliedCoupon(null)}
              />

              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '32px 0 16px' }}>Payment Mode</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                {[['online', '💳 Pay Online'], ['cod', '💵 Cash on Delivery']].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 700,
                      border: `2px solid ${paymentMode === mode ? 'var(--primary)' : 'var(--border)'}`,
                      background: paymentMode === mode ? 'var(--light)' : 'white', color: 'var(--text)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Order Summary</h3>
              {items.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10 }}>
                  <span>{i.name} × {i.qty}</span>
                  <span>₹{i.price * i.qty}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span>Subtotal</span><span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: '#16A34A' }}>
                    <span>Coupon Discount</span><span>−₹{discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span>Platform Fee</span><span>₹{PLATFORM_FEE}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span>Total</span><span>₹{total}</span>
                </div>
              </div>

              {submitError && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 14 }}>{submitError}</p>}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20, opacity: submitting ? 0.6 : 1 }}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Placing Order…' : `Place Order · ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
