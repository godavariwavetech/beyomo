import React from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms', content: (
    <>
      <p>By accessing or using the Beyomo platform — including our website (beyomo.com), mobile application, and all associated services — you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our services.</p>
      <p>These Terms constitute a legally binding agreement between you and <strong>Beyomo Technologies Pvt. Ltd.</strong>, incorporated under the Companies Act, 2013, with its registered office in Mumbai, Maharashtra, India.</p>
      <div className="legal-highlight">These Terms were last updated on June 14, 2026. We recommend reviewing them periodically for any changes.</div>
    </>
  )},
  { id: 'accounts', title: '2. User Accounts', content: (
    <>
      <p>To access most features of Beyomo, you must create an account. By creating an account, you agree to:</p>
      <ul>
        <li>Provide accurate, current, and complete information during registration</li>
        <li>Maintain and promptly update your account information</li>
        <li>Keep your login credentials confidential and not share them with any third party</li>
        <li>Be at least 18 years of age to create an account</li>
        <li>Accept responsibility for all activities that occur under your account</li>
        <li>Notify us immediately of any unauthorized use of your account at support@beyomo.com</li>
      </ul>
      <p>We reserve the right to suspend or terminate accounts that violate these Terms or are found to be fraudulent, abusive, or inactive for extended periods.</p>
    </>
  )},
  { id: 'bookings', title: '3. Bookings & Services', content: (
    <>
      <p>When you make a booking through Beyomo:</p>
      <ul>
        <li>You are requesting a service from an independent professional listed on our platform</li>
        <li>Beyomo acts as a marketplace intermediary and is not itself the service provider</li>
        <li>Booking confirmation is subject to professional availability and acceptance</li>
        <li>You must ensure a safe, accessible, and appropriate environment for the professional at your premises</li>
        <li>You are responsible for the accuracy of the address and contact details provided</li>
        <li>Services must be used only for personal, non-commercial purposes unless otherwise agreed</li>
      </ul>
      <p>Beyomo reserves the right to cancel or reschedule bookings due to professional unavailability, safety concerns, or circumstances beyond our control. We will notify you promptly in such cases.</p>
    </>
  )},
  { id: 'payments', title: '4. Payments & Pricing', content: (
    <>
      <p>All prices displayed on Beyomo are in Indian Rupees (INR) and include applicable taxes unless otherwise stated.</p>
      <ul>
        <li><strong>Payment Methods:</strong> We accept UPI, debit/credit cards, net banking, and digital wallets via our payment partner, Razorpay.</li>
        <li><strong>Advance Payment:</strong> Some premium services may require advance payment at the time of booking.</li>
        <li><strong>Post-Service Payment:</strong> Most standard services are pay-after-completion. Payment must be made upon service completion.</li>
        <li><strong>Pricing Changes:</strong> Prices may vary based on service type, professional, city, and promotional offers. Confirmed booking prices will not change.</li>
        <li><strong>Platform Fee:</strong> A small platform convenience fee may apply to bookings and will be clearly displayed before payment.</li>
        <li><strong>Failed Transactions:</strong> If your payment fails after a booking, the booking will be automatically cancelled. Please rebook and complete payment.</li>
      </ul>
    </>
  )},
  { id: 'cancellation', title: '5. Cancellation Policy', content: (
    <>
      <p>Our standard cancellation policy is as follows:</p>
      <ul>
        <li><strong>Free Cancellation:</strong> Cancel more than 2 hours before the scheduled appointment for a full refund</li>
        <li><strong>Late Cancellation (1–2 hours before):</strong> 25% cancellation fee applies</li>
        <li><strong>Very Late Cancellation (within 1 hour):</strong> 50% cancellation fee applies</li>
        <li><strong>No-Show:</strong> Full service amount is charged if you are unavailable at the time of the appointment</li>
      </ul>
      <p>To cancel a booking, use the "My Bookings" section in the app. Refunds (if applicable) are processed within 5–7 business days. See our full <Link to="/cancellation" style={{ color: 'var(--primary)', fontWeight: 600 }}>Cancellation Policy</Link> for details.</p>
    </>
  )},
  { id: 'conduct', title: '6. Acceptable Use & Conduct', content: (
    <>
      <p>You agree not to use the Beyomo platform to:</p>
      <ul>
        <li>Harass, abuse, threaten, or discriminate against any professional or other user</li>
        <li>Request services for illegal activities or purposes</li>
        <li>Provide false information, impersonate others, or engage in fraud</li>
        <li>Attempt to bypass, reverse-engineer, or interfere with our platform</li>
        <li>Scrape, copy, or republish any content from our platform without written permission</li>
        <li>Contact professionals outside the Beyomo platform to avoid fees or for personal solicitation</li>
        <li>Post false, misleading, or defamatory reviews</li>
      </ul>
      <p>Violations may result in immediate account suspension, legal action, or both.</p>
    </>
  )},
  { id: 'liability', title: '7. Limitation of Liability', content: (
    <>
      <p>To the fullest extent permitted by applicable Indian law:</p>
      <ul>
        <li>Beyomo provides the platform "as is" without warranties of any kind, express or implied</li>
        <li>We do not guarantee uninterrupted, error-free, or completely secure access to our services</li>
        <li>Beyomo is not liable for the quality, safety, legality, or fitness of services provided by professionals</li>
        <li>Our total aggregate liability for any claims arising out of these Terms shall not exceed the amount paid by you for the specific booking giving rise to the claim</li>
        <li>We are not liable for indirect, incidental, special, consequential, or punitive damages</li>
      </ul>
      <p>Nothing in these Terms limits our liability for death or personal injury caused by our gross negligence, fraud, or any other liability that cannot be excluded by law.</p>
    </>
  )},
  { id: 'ip', title: '8. Intellectual Property', content: (
    <>
      <p>All content on the Beyomo platform — including but not limited to the logo, app design, website layout, text, graphics, photographs, and software — is the exclusive property of Beyomo Technologies Pvt. Ltd. and is protected by Indian and international intellectual property laws.</p>
      <p>You are granted a limited, non-exclusive, non-transferable licence to use the Beyomo platform for personal, non-commercial purposes. You may not copy, reproduce, modify, distribute, or create derivative works without our prior written consent.</p>
    </>
  )},
  { id: 'governing', title: '9. Governing Law & Disputes', content: (
    <>
      <p>These Terms are governed by the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of courts in <strong>Mumbai, Maharashtra, India</strong>.</p>
      <p>Before initiating any legal proceedings, you agree to first attempt to resolve the dispute informally by contacting us at legal@beyomo.com. We will make good-faith efforts to resolve disputes within 30 days.</p>
      <p>For consumer disputes, you may also approach the appropriate Consumer Forum under the Consumer Protection Act, 2019.</p>
    </>
  )},
  { id: 'contact', title: '10. Contact & Grievances', content: (
    <>
      <p>For any queries, concerns, or grievances regarding these Terms:</p>
      <ul>
        <li><strong>Email:</strong> legal@beyomo.com</li>
        <li><strong>Grievance Officer:</strong> grievance@beyomo.com</li>
        <li><strong>Phone:</strong> +91 1800-XXX-XXXX</li>
        <li><strong>Address:</strong> Beyomo Technologies Pvt. Ltd., 12th Floor, One BKC, Mumbai – 400 051</li>
      </ul>
      <p>Our Grievance Officer will acknowledge your complaint within 48 hours and resolve it within 30 days, as required by the IT Act, 2000 and Consumer Protection (E-Commerce) Rules, 2020.</p>
    </>
  )},
];

export default function Terms() {
  const pageRef = useRevealAll();
  return (
    <div ref={pageRef}>
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Legal</span>
          <h1 className="anim-fadeUp d-2">Terms & Conditions</h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 14 }}>Please read these terms carefully before using the Beyomo platform.</p>
        </div>
      </div>

      <div className="container">
        <div className="legal-layout">
          <aside className="legal-toc">
            <div className="legal-toc-title">Contents</div>
            {SECTIONS.map(s => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          </aside>
          <main className="legal-content reveal">
            <div className="legal-meta">
              <span className="legal-pill">📅 Last updated: June 14, 2026</span>
              <span className="legal-pill">🏢 Beyomo Technologies Pvt. Ltd.</span>
            </div>
            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.82, marginBottom: 32, padding: '20px 24px', background: 'var(--light)', borderRadius: 'var(--r-lg)' }}>
              Welcome to Beyomo. These Terms and Conditions govern your use of our platform and services. By creating an account or making a booking, you confirm that you have read, understood, and agree to be bound by these Terms.
            </p>
            {SECTIONS.map(s => (
              <div key={s.id} id={s.id} className="legal-section">
                <h2>{s.title}</h2>
                {s.content}
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
