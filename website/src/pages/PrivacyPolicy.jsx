import React from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const SECTIONS = [
  { id: 'information', title: '1. Information We Collect', content: (
    <>
      <p>We collect information to provide better services to all our users. The types of information we collect include:</p>
      <ul>
        <li><strong>Account Information:</strong> When you register, we collect your name, phone number, email address, and city of residence.</li>
        <li><strong>Booking Data:</strong> Details of the services you book, including date, time, location, professional assigned, and transaction amounts.</li>
        <li><strong>Device & Usage Data:</strong> We collect device identifiers, IP address, app version, operating system, and how you interact with our platform.</li>
        <li><strong>Location Data:</strong> With your permission, we collect precise location to match you with nearby professionals and enable real-time tracking.</li>
        <li><strong>Payment Information:</strong> Payment details are processed by our payment partner (Razorpay). We do not store full card numbers or CVVs.</li>
        <li><strong>Communications:</strong> Messages or support tickets you send us, including chat transcripts and email threads.</li>
        <li><strong>Identity Documents (Professionals only):</strong> For partner onboarding, we collect Aadhaar card, selfie, and signed agreement for verification.</li>
      </ul>
    </>
  )},
  { id: 'use', title: '2. How We Use Your Information', content: (
    <>
      <p>We use the information we collect to operate, improve, and protect our platform:</p>
      <ul>
        <li>To create and manage your account and bookings</li>
        <li>To match customers with suitable professionals based on location and service type</li>
        <li>To process payments and send receipts</li>
        <li>To send booking confirmations, reminders, and status updates via SMS, email, or push notification</li>
        <li>To provide customer support and resolve disputes</li>
        <li>To detect and prevent fraud, abuse, and safety violations</li>
        <li>To analyse usage patterns and improve our services and app experience</li>
        <li>To comply with applicable laws and regulations in India</li>
      </ul>
      <div className="legal-highlight">
        We do <strong>not</strong> sell your personal data to third parties for their marketing purposes. Period.
      </div>
    </>
  )},
  { id: 'sharing', title: '3. Information Sharing', content: (
    <>
      <p>We share your information only in the following circumstances:</p>
      <ul>
        <li><strong>With Service Professionals:</strong> When you make a booking, we share your name, address, and service details with the assigned professional.</li>
        <li><strong>Payment Processors:</strong> We share transaction details with Razorpay to facilitate secure payments.</li>
        <li><strong>SMS & Notification Providers:</strong> We use MSG91 to send OTPs and booking alerts. Only your phone number is shared.</li>
        <li><strong>Analytics & Monitoring:</strong> We use anonymised analytics tools to understand usage. No personally identifiable data is shared.</li>
        <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect the rights, property, or safety of Beyomo, our users, or the public.</li>
      </ul>
    </>
  )},
  { id: 'retention', title: '4. Data Retention', content: (
    <>
      <p>We retain your personal data for as long as your account is active or as needed to provide you services. Specifically:</p>
      <ul>
        <li>Account data is retained for the lifetime of your account plus 2 years after deletion</li>
        <li>Transaction records are retained for 7 years as required by Indian financial regulations</li>
        <li>Booking history is retained for 3 years for dispute resolution purposes</li>
        <li>Identity documents submitted by professionals are retained for 5 years after account termination</li>
        <li>Support communications are retained for 2 years</li>
      </ul>
      <p>You can request deletion of your account and data at any time by contacting support@beyomo.com, subject to legal retention obligations above.</p>
    </>
  )},
  { id: 'security', title: '5. Data Security', content: (
    <>
      <p>We implement industry-standard security measures to protect your data:</p>
      <ul>
        <li>All data in transit is encrypted using TLS 1.2+ (HTTPS)</li>
        <li>Sensitive data at rest is encrypted using AES-256</li>
        <li>Payment data is tokenised and handled exclusively by PCI-DSS compliant processors</li>
        <li>Access to user data is restricted to authorised personnel on a need-to-know basis</li>
        <li>We conduct regular security audits and vulnerability assessments</li>
        <li>Our servers are hosted on AWS India with automated backups and monitoring</li>
      </ul>
      <p>While we strive to protect your data, no method of transmission or storage is 100% secure. Please report any suspected security vulnerabilities to security@beyomo.com.</p>
    </>
  )},
  { id: 'rights', title: '6. Your Rights', content: (
    <>
      <p>Under India's DPDP Act 2023, you have the following rights regarding your personal data:</p>
      <ul>
        <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Right to Correction:</strong> Ask us to correct inaccurate or incomplete data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
        <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with our Data Protection Officer</li>
        <li><strong>Right to Nominate:</strong> Nominate someone to exercise your rights in the event of your death or incapacity</li>
      </ul>
      <p>To exercise any of these rights, contact our Data Protection Officer at <strong>dpo@beyomo.com</strong> or write to us at our registered address. We will respond within 30 days.</p>
    </>
  )},
  { id: 'cookies', title: '7. Cookies & Tracking', content: (
    <>
      <p>Our website uses cookies and similar tracking technologies to enhance your experience. We use:</p>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for the website to function (session management, authentication)</li>
        <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website (anonymised)</li>
        <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
      </ul>
      <p>You can manage cookie preferences through your browser settings. Please see our <Link to="/cookies" style={{ color: 'var(--primary)', fontWeight: 600 }}>Cookie Policy</Link> for full details.</p>
    </>
  )},
  { id: 'children', title: '8. Children\'s Privacy', content: (
    <>
      <p>Beyomo is not directed to individuals under the age of 18. We do not knowingly collect personal data from minors. If you are a parent or guardian and believe your child has provided us with personal data, please contact us at support@beyomo.com and we will delete it promptly.</p>
    </>
  )},
  { id: 'changes', title: '9. Changes to This Policy', content: (
    <>
      <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes by:</p>
      <ul>
        <li>Sending an email to the address associated with your account</li>
        <li>Posting a prominent notice on the Beyomo app and website</li>
        <li>Updating the "Last Updated" date at the top of this page</li>
      </ul>
      <p>Continued use of our services after changes become effective constitutes your acceptance of the revised policy.</p>
    </>
  )},
  { id: 'contact', title: '10. Contact Us', content: (
    <>
      <p>If you have any questions, concerns, or requests relating to this Privacy Policy or how we handle your data, please contact us:</p>
      <ul>
        <li><strong>Email:</strong> privacy@beyomo.com</li>
        <li><strong>DPO Email:</strong> dpo@beyomo.com</li>
        <li><strong>Phone:</strong> +91 1800-XXX-XXXX (Mon–Sun, 8 AM–10 PM)</li>
        <li><strong>Address:</strong> Beyomo Technologies Pvt. Ltd., 12th Floor, One BKC, Bandra Kurla Complex, Mumbai – 400 051, Maharashtra, India</li>
      </ul>
    </>
  )},
];

export default function PrivacyPolicy() {
  const pageRef = useRevealAll();
  return (
    <div ref={pageRef}>
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Legal</span>
          <h1 className="anim-fadeUp d-2">Privacy Policy</h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 14 }}>How Beyomo collects, uses, and protects your personal information.</p>
        </div>
      </div>

      <div className="container">
        <div className="legal-layout">
          {/* TOC */}
          <aside className="legal-toc">
            <div className="legal-toc-title">Contents</div>
            {SECTIONS.map(s => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          </aside>

          {/* Content */}
          <main className="legal-content reveal">
            <div className="legal-meta">
              <span className="legal-pill">📅 Last updated: June 14, 2026</span>
              <span className="legal-pill">🏢 Beyomo Technologies Pvt. Ltd.</span>
            </div>
            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.82, marginBottom: 32, padding: '20px 24px', background: 'var(--light)', borderRadius: 'var(--r-lg)' }}>
              This Privacy Policy explains how <strong>Beyomo Technologies Pvt. Ltd.</strong> ("Beyomo", "we", "our", or "us") collects, uses, shares, and protects your personal data when you use our app, website, and services. By using Beyomo, you agree to the practices described in this policy.
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
