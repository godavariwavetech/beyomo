import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBookingById } from '../../api/bookings';

const PAYMENT_LABEL = {
  paid: { text: '✅ Payment Successful', color: '#065F46', bg: '#D1FAE5' },
  pending: { text: '⏳ Payment Pending', color: '#92400E', bg: '#FEF3C7' },
  cod: { text: '💵 Cash on Delivery', color: '#1E3A8A', bg: '#DBEAFE' },
};

export default function BookingConfirmed() {
  const { bookingId } = useParams();
  const { token } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBookingById(bookingId, token)
      .then((res) => setBooking(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  const paymentInfo = booking?.paymentMode === 'cod'
    ? PAYMENT_LABEL.cod
    : PAYMENT_LABEL[booking?.paymentStatus] || null;

  return (
    <div className="section" style={{ paddingTop: 130, minHeight: '70vh' }}>
      <div className="container" style={{ maxWidth: 560 }}>
        {loading && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading your booking…</p>}
        {error && <p style={{ textAlign: 'center', color: '#EF4444' }}>{error}</p>}

        {booking && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Booking Confirmed!</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
              Booking ID: <strong>{booking.bookingCode || booking.id}</strong>
            </p>

            {paymentInfo && (
              <div style={{ display: 'inline-block', background: paymentInfo.bg, color: paymentInfo.color, fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 'var(--r-full)', marginBottom: 24 }}>
                {paymentInfo.text}
              </div>
            )}

            <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              {booking.scheduledAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10 }}>
                  <span style={{ color: 'var(--muted)' }}>Scheduled</span>
                  <span style={{ fontWeight: 600 }}>{new Date(booking.scheduledAt).toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.addressLine1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10 }}>
                  <span style={{ color: 'var(--muted)' }}>Address</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: 280 }}>{booking.addressLine1}, {booking.addressCity}</span>
                </div>
              )}
              {Array.isArray(booking.services) && (
                <div style={{ marginTop: 10 }}>
                  {booking.services.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                      <span>{s.name} × {s.qty}</span>
                      <span>₹{s.price * s.qty}</span>
                    </div>
                  ))}
                </div>
              )}
              {booking.totalAmount != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <span>Total</span><span>₹{booking.totalAmount}</span>
                </div>
              )}
            </div>

            <Link to="/" className="btn btn-primary" style={{ marginTop: 28, justifyContent: 'center' }}>Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
