import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, BarChart2, Bell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_USERS, ROLE_LABELS } from '../data/mockData';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass]  = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  const fillCred = (u) => { setEmail(u.email); setPassword(u.password); setError(''); };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div style={{ width: 64, height: 64, background: 'rgba(253,215,122,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid rgba(253,215,122,0.4)' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#FDD77A' }}>B</span>
          </div>
          <h2>Beyomo Admin Console</h2>
          <p>A unified platform to manage customers, partners, bookings, and grow the beauty & wellness business.</p>

          <div className="login-features">
            {[
              { icon: <Users size={20} />, title: 'User & Partner Management', desc: 'Manage customers, onboard and verify service providers' },
              { icon: <BarChart2 size={20} />, title: 'Real-Time Analytics', desc: 'Revenue, bookings, and growth metrics at a glance' },
              { icon: <Shield size={20} />, title: 'Role-Based Access Control', desc: '5 access levels from Support to Super Admin' },
              { icon: <Bell size={20} />, title: 'Push Notification Engine', desc: 'Target users, partners, or segments with messages' },
            ].map(f => (
              <div className="login-feature" key={f.title}>
                <div className="login-feature-icon">{f.icon}</div>
                <div className="login-feature-text">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-brand">
          <div className="login-brand-icon">B</div>
          <h1>Beyomo Admin</h1>
          <p>Sign in to your admin account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group mb-16">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group mb-16">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)' }}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--c-danger-bg)', color: 'var(--c-danger-text)', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-teal btn-lg w-full"
            disabled={loading}
            style={{ justifyContent: 'center', marginBottom: 8 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-creds">
          <h4>Demo Credentials (click to fill)</h4>
          {ADMIN_USERS.map(u => (
            <div key={u.id} className="login-cred-item" onClick={() => fillCred(u)}>
              <span className="cred-role">{ROLE_LABELS[u.role]}</span>
              <span className="cred-email">{u.email}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8 }}>Password: <strong>Admin@123</strong></div>
        </div>
      </div>
    </div>
  );
}
