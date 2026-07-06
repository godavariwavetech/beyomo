import React, { useEffect, useRef, useState } from 'react';
import { sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

export default function OtpLoginModal({ open, onClose, onSuccess }) {
  const { setAuth } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setPhone('');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError(null);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (!open) return null;

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  const handleSendOtp = async () => {
    if (!phoneValid) return;
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setStep('otp');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtp(phone, code);
      setAuth({ token: res.data.token, user: res.data.user });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 380, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, color: 'var(--muted)', lineHeight: 1 }}>×</button>

        {step === 'phone' && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Login to Continue</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Enter your phone number to receive an OTP.</p>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 14 }}>
              <span style={{ padding: '14px 14px', background: 'var(--light)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 12px', fontSize: 15 }}
                autoFocus
              />
            </div>
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: phoneValid && !loading ? 1 : 0.5 }} disabled={!phoneValid || loading} onClick={handleSendOtp}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Verify OTP</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Enter the {OTP_LENGTH}-digit code sent to +91 {phone}</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: 48, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
                    border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', outline: 'none',
                  }}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: otp.join('').length === OTP_LENGTH && !loading ? 1 : 0.5 }} disabled={otp.join('').length !== OTP_LENGTH || loading} onClick={handleVerify}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {resendIn > 0 ? (
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Resend OTP in {resendIn}s</span>
              ) : (
                <button onClick={handleSendOtp} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>Resend OTP</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
