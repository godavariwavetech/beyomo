import React from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const TIERS = [
  { time: 'More than 2 hours before', fee: '0%', feeLabel: 'Free Cancellation', desc: 'Cancel any time more than 2 hours before your appointment and receive a full refund — no questions asked.', color: '#D1FAE5', textColor: '#065F46', icon: '✅' },
  { time: '1 – 2 hours before', fee: '25%', feeLabel: '25% Cancellation Fee', desc: 'A 25% fee on the service amount applies. The remaining 75% is refunded within 5–7 business days.', color: '#FEF3C7', textColor: '#92400E', icon: '⚠️' },
  { time: 'Within 1 hour', fee: '50%', feeLabel: '50% Cancellation Fee', desc: 'Cancelling within 1 hour of your appointment incurs a 50% fee. Remaining 50% is refunded.', color: '#FEE2E2', textColor: '#991B1B', icon: '⏰' },
  { time: 'No-Show', fee: '100%', feeLabel: 'Full Amount Charged', desc: 'If you are not available when the professional arrives, the full service amount will be charged.', color: '#F3F4F6', textColor: '#1F2937', icon: '❌' },
];

export default function CancellationPolicy() {
  const pageRef = useRevealAll();
  return (
    <div ref={pageRef}>
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Support</span>
          <h1 className="anim-fadeUp d-2">Cancellation Policy</h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 14 }}>We understand plans change. Here's how cancellations work on Beyomo.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="badge">Cancellation Tiers</span>
              <h2 className="section-title" style={{ marginBottom: 14 }}>Our Cancellation Fee Structure</h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.65 }}>The fee depends on how much notice you give us before your scheduled appointment.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 56 }} className="reveal-stagger canc-grid">
              {TIERS.map(t => (
                <div key={t.time} className="reveal" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '32px 28px', background: 'white', transition: 'var(--transition)' }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{t.icon}</div>
                  <div style={{ background: t.color, color: t.textColor, display: 'inline-block', padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t.feeLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{t.time}</div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{t.desc}</p>
                </div>
              ))}
            </div>

            <div className="legal-content reveal">
              <div className="legal-section">
                <h2>How to Cancel a Booking</h2>
                <ul>
                  <li>Open the Beyomo app and go to <strong>My Bookings</strong></li>
                  <li>Select the booking you wish to cancel</li>
                  <li>Tap <strong>Cancel Booking</strong> and select a reason</li>
                  <li>Confirm the cancellation — you'll receive an immediate confirmation via SMS and email</li>
                </ul>
                <p>You can also cancel by calling our support line at <strong>+91 1800-XXX-XXXX</strong> (Mon–Sun, 8 AM–10 PM) or emailing <strong>support@beyomo.com</strong>.</p>
              </div>

              <div className="legal-section">
                <h2>Refund Timeline</h2>
                <ul>
                  <li><strong>UPI Payments:</strong> Refunded within 1–2 business days</li>
                  <li><strong>Credit/Debit Cards:</strong> Refunded within 5–7 business days (depends on your bank)</li>
                  <li><strong>Net Banking:</strong> Refunded within 3–5 business days</li>
                  <li><strong>Wallet (Razorpay):</strong> Refunded instantly to your Razorpay wallet</li>
                </ul>
                <p>Refunds are initiated from our end immediately upon cancellation. Bank processing times are outside our control. For full details, see our <Link to="/refund" style={{ color: 'var(--primary)', fontWeight: 600 }}>Refund Policy</Link>.</p>
              </div>

              <div className="legal-section">
                <h2>Cancellations by Professionals</h2>
                <p>In rare cases, a professional may need to cancel due to illness, emergency, or other unforeseen circumstances. In such cases:</p>
                <ul>
                  <li>You will receive an immediate notification</li>
                  <li>You will be offered a rebooking with another available professional</li>
                  <li>If you prefer a refund, 100% of the amount will be returned regardless of timing</li>
                  <li>We will offer you a 10% discount on your next booking as an apology</li>
                </ul>
              </div>

              <div className="legal-section">
                <h2>Rescheduling</h2>
                <p>We encourage rescheduling over cancellation when possible. Rescheduling is free if done more than 2 hours before the appointment. Rescheduling within 2 hours is treated as a cancellation and the applicable fee applies.</p>
                <p>To reschedule, go to <strong>My Bookings → Reschedule</strong> in the app, or contact our support team.</p>
              </div>

              <div className="legal-section">
                <h2>Special Circumstances</h2>
                <p>We waive cancellation fees for cancellations due to:</p>
                <ul>
                  <li>Medical emergencies (with documentation)</li>
                  <li>Natural disasters or government-declared emergencies</li>
                  <li>Technical issues on our platform that prevented timely cancellation</li>
                </ul>
                <p>For special circumstances, please contact us at <strong>support@beyomo.com</strong> with relevant details and documentation.</p>
              </div>
            </div>

            <div className="reveal" style={{ background: 'linear-gradient(135deg,var(--dark),var(--teal))', borderRadius: 'var(--r-xl)', padding: '36px', textAlign: 'center', marginTop: 8 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>Still Have Questions?</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24, fontSize: 15 }}>Our support team is available 7 days a week to help with cancellation and refund queries.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-accent btn-sm">Contact Support</Link>
                <Link to="/help" className="btn btn-outline-white btn-sm">Help Center</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`@media(max-width:640px){.canc-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
