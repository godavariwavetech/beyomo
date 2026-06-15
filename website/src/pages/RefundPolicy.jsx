import React from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const SCENARIOS = [
  { icon: '✅', title: 'Service Not Delivered', eligible: true, desc: 'Full refund if the professional did not show up or the service was not delivered.' },
  { icon: '✅', title: 'Service Quality Issue', eligible: true, desc: 'Full or partial refund if the service quality was significantly below our standards (verified by our team).' },
  { icon: '✅', title: 'Cancelled by Professional', eligible: true, desc: 'Full refund if the professional cancelled the booking for any reason.' },
  { icon: '✅', title: 'Duplicate Booking/Payment', eligible: true, desc: 'Full refund for accidental duplicate bookings or duplicate payment transactions.' },
  { icon: '⚠️', title: 'Early Cancellation (>2 hrs)', eligible: 'partial', desc: 'Full refund when you cancel more than 2 hours before the appointment.' },
  { icon: '⚠️', title: 'Late Cancellation', eligible: 'partial', desc: 'Partial refund based on our cancellation policy (25–50% depending on timing).' },
  { icon: '❌', title: 'No-Show by Customer', eligible: false, desc: 'No refund if you were not available when the professional arrived at the scheduled time.' },
  { icon: '❌', title: 'Completed Services', eligible: false, desc: 'No refund for completed services unless there is a verifiable quality issue reported within 24 hours.' },
];

export default function RefundPolicy() {
  const pageRef = useRevealAll();
  return (
    <div ref={pageRef}>
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Support</span>
          <h1 className="anim-fadeUp d-2">Refund Policy</h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 14 }}>Our commitment to fair and hassle-free refunds when things don't go as planned.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="badge">Refund Eligibility</span>
              <h2 className="section-title" style={{ marginBottom: 14 }}>When Are You Eligible for a Refund?</h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.65 }}>Here's a clear breakdown of when you will and won't receive a refund.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 52 }} className="reveal-stagger refund-grid">
              {SCENARIOS.map(s => (
                <div key={s.title} className="reveal" style={{ border: `1px solid ${s.eligible === true ? '#D1FAE5' : s.eligible === 'partial' ? '#FEF3C7' : '#FEE2E2'}`, borderRadius: 'var(--r-lg)', padding: '24px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.68 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="legal-content reveal">
              <div className="legal-section">
                <h2>How to Request a Refund</h2>
                <ul>
                  <li><strong>Step 1:</strong> Open the Beyomo app and go to <strong>My Bookings</strong></li>
                  <li><strong>Step 2:</strong> Select the relevant booking and tap <strong>Report an Issue</strong></li>
                  <li><strong>Step 3:</strong> Select the issue type and provide a brief description</li>
                  <li><strong>Step 4:</strong> If applicable, attach photos or supporting evidence</li>
                  <li><strong>Step 5:</strong> Our team will review your request and respond within 24 hours</li>
                </ul>
                <p>Alternatively, email us at <strong>refunds@beyomo.com</strong> with your booking ID, the issue description, and any supporting evidence.</p>
              </div>

              <div className="legal-section">
                <h2>Refund Processing Times</h2>
                <ul>
                  <li><strong>UPI / IMPS:</strong> 1–2 business days after approval</li>
                  <li><strong>Credit Card:</strong> 5–7 business days (varies by bank)</li>
                  <li><strong>Debit Card:</strong> 3–5 business days</li>
                  <li><strong>Net Banking:</strong> 3–5 business days</li>
                  <li><strong>Razorpay Wallet:</strong> Instant</li>
                </ul>
                <div className="legal-highlight">Refunds are initiated from our side within 1 business day of approval. The timeline after that depends on your bank or payment provider.</div>
              </div>

              <div className="legal-section">
                <h2>Quality Dispute Process</h2>
                <p>If you are unsatisfied with the quality of a service received:</p>
                <ul>
                  <li>You must report the issue within <strong>24 hours</strong> of service completion</li>
                  <li>Our team will review the report and may request photos, service notes, or a brief call</li>
                  <li>We aim to resolve quality disputes within <strong>3 business days</strong></li>
                  <li>Depending on the severity, we may offer a full refund, partial refund, or complimentary re-service</li>
                </ul>
              </div>

              <div className="legal-section">
                <h2>Failed or Duplicate Payments</h2>
                <p>If your payment was deducted but the booking was not confirmed, or if you were charged twice:</p>
                <ul>
                  <li>Check your booking history in the app first — the booking may appear with a delay</li>
                  <li>If the booking is not confirmed and money was deducted, it will automatically refund within 7 days as per RBI guidelines</li>
                  <li>For faster resolution, contact us at <strong>payments@beyomo.com</strong> with your transaction ID</li>
                </ul>
              </div>

              <div className="legal-section">
                <h2>Escalation</h2>
                <p>If you are not satisfied with our refund decision, you may escalate to our Grievance Officer at <strong>grievance@beyomo.com</strong>. We will re-review your case and respond within 10 business days. You may also approach the appropriate Consumer Forum under the Consumer Protection Act, 2019.</p>
              </div>
            </div>

            <div className="reveal" style={{ background: 'var(--light)', borderRadius: 'var(--r-xl)', padding: '36px', textAlign: 'center', marginTop: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Need Help with a Refund?</h3>
              <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 15 }}>Our refund team typically responds within 4 hours on business days.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-primary btn-sm">Contact Support</Link>
                <Link to="/help" className="btn btn-secondary btn-sm">Help Center</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`@media(max-width:640px){.refund-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
