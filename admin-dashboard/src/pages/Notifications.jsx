import React, { useState, useEffect } from 'react';
import { Send, Bell, Users, UserCog, Globe, Clock, CheckCircle2, Eye, Zap, ChevronDown, ChevronUp, ShieldCheck, BellOff, BellRing, RefreshCw } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotificationsAdmin } from '../hooks/useNotificationsAdmin';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { messaging, getToken, VAPID_KEY } from '../firebase';

const TEST_TARGETS = [
  { value: 'users',    label: 'Users',    icon: <Users size={15} />,      color: '#2563eb' },
  { value: 'partners', label: 'Partners', icon: <UserCog size={15} />,    color: '#7c3aed' },
  { value: 'admins',   label: 'Admins',   icon: <ShieldCheck size={15} />, color: '#059669' },
  { value: 'all',      label: 'All',      icon: <Globe size={15} />,      color: '#d97706' },
];

function TestPushPanel({ action, showToast }) {
  const [open, setOpen]         = useState(true);
  const [testTarget, setTarget] = useState('all');
  const [testTitle, setTTitle]  = useState('Test Notification 🔔');
  const [testBody, setTBody]    = useState('Push notifications are working correctly!');
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState(null);

  // Browser notification permission state
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [enabling, setEnabling]     = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  const enableBrowserNotifications = async () => {
    if (!supported) return;
    setEnabling(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        showToast('Notification permission denied. Allow it in your browser settings.', 'danger');
        setEnabling(false);
        return;
      }
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
      if (!token) throw new Error('No FCM token returned');
      const res = await action('patch', '/api/v1/admin/me/device-token', { fcmToken: token });
      if (res.ok) {
        setTokenSaved(true);
        showToast('Browser notifications enabled! This admin will now receive push notifications.', 'success');
      } else {
        throw new Error(res.error ?? 'Failed to save token');
      }
    } catch (err) {
      console.error('Enable notifications error:', err);
      showToast(`Failed: ${err.message}`, 'danger');
    }
    setEnabling(false);
  };

  const handleTest = async () => {
    setSending(true);
    setResult(null);
    const res = await action('post', '/api/v1/admin/test/push-notification', {
      target: testTarget, title: testTitle, body: testBody,
    });
    setSending(false);
    if (!res.ok) { showToast(res.error ?? 'Test failed', 'danger'); return; }
    setResult(res.data?.results ?? {});
    showToast('Test notification dispatched!', 'success');
  };

  const permBadge = {
    granted:     { bg: '#d1fae5', color: '#065f46', icon: <BellRing size={13} />, label: 'Allowed'   },
    denied:      { bg: '#fee2e2', color: '#991b1b', icon: <BellOff  size={13} />, label: 'Blocked — allow in browser settings' },
    default:     { bg: '#fef3c7', color: '#92400e', icon: <Bell     size={13} />, label: 'Not yet enabled' },
    unsupported: { bg: '#f3f4f6', color: '#6b7280', icon: <BellOff  size={13} />, label: 'Not supported in this browser' },
  }[permission] ?? {};

  return (
    <div className="card mb-24">
      <div
        className="card-header"
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="var(--c-brand-accent)" />
          <span className="card-title">Test Push Notification</span>
          <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', background: 'var(--c-border-light)', borderRadius: 4, padding: '2px 7px', marginLeft: 4 }}>
            Dev Tool
          </span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {open && (
        <div className="card-body">

          {/* ── Browser notification status bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 20,
            background: permBadge.bg, border: `1px solid ${permBadge.color}30`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: permBadge.color, fontWeight: 600, fontSize: 13 }}>
              {permBadge.icon}
              <span>This browser: <strong>{permBadge.label}</strong></span>
              {tokenSaved && <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 400 }}>— token saved ✓</span>}
            </div>
            {(permission === 'default' || (permission === 'granted' && !tokenSaved)) && (
              <button
                className="btn btn-teal"
                onClick={enableBrowserNotifications}
                disabled={enabling}
                style={{ padding: '6px 14px', fontSize: 12, gap: 6 }}
              >
                {enabling ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <BellRing size={13} />}
                {enabling ? 'Enabling…' : permission === 'granted' ? 'Re-register Token' : 'Enable Browser Notifications'}
              </button>
            )}
          </div>

          {/* ── Target ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Send To</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEST_TARGETS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTarget(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 'var(--r-full)',
                    border: `2px solid ${testTarget === t.value ? t.color : 'var(--c-border)'}`,
                    background: testTarget === t.value ? t.color + '15' : 'white',
                    color: testTarget === t.value ? t.color : 'var(--c-text-secondary)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'var(--t-fast)',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Title + Body ── */}
          <div className="form-grid form-grid-2" style={{ gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={testTitle} onChange={e => setTTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div className="form-group">
              <label className="form-label">Body</label>
              <input className="form-input" value={testBody} onChange={e => setTBody(e.target.value)} placeholder="Notification body" />
            </div>
          </div>

          <button
            className="btn btn-teal"
            onClick={handleTest}
            disabled={sending || !testTitle || !testBody}
            style={{ gap: 8 }}
          >
            <Zap size={15} />
            {sending ? 'Sending…' : 'Send Test Notification'}
          </button>

          {/* ── Results ── */}
          {result && (
            <div style={{ marginTop: 16, padding: 14, background: 'var(--c-border-light)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Results</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(result).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize', minWidth: 70 }}>{key}</span>
                    {val.skipped ? (
                      <span style={{ color: 'var(--c-text-secondary)' }}>
                        — no registered tokens
                        {key === 'admins' && permission !== 'granted' && (
                          <span style={{ color: '#d97706', marginLeft: 6 }}>↑ enable browser notifications above</span>
                        )}
                      </span>
                    ) : val.success ? (
                      <span style={{ color: '#059669' }}>
                        ✓ {val.successCount ?? 0} delivered
                        {val.failureCount > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>✗ {val.failureCount} failed</span>}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>✗ {val.error ?? val.reason ?? 'Failed'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

const TEMPLATES = [
  { id:1, name:'Weekend Offer',    title:'Weekend Special Offer! 🎉', body:'Get {{discount}}% off on all beauty services this weekend. Book now!' },
  { id:2, name:'New Job Alert',    title:'New Job Requests Available', body:'There are new job requests near you. Go online to accept!' },
  { id:3, name:'Profile Complete', title:'Complete Your Profile',      body:'Add your profile photo and complete your details to get more bookings.' },
  { id:4, name:'Rate Experience',  title:'Rate Your Experience ⭐',    body:'How was your recent session? Please take a moment to leave a review.' },
  { id:5, name:'App Update',       title:'App Update Available',       body:'Update Beyomo to get the latest features and improved performance.' },
];

export default function Notifications() {
  const { showToast } = useAuth();
  const { fetchList, action } = useNotificationsAdmin();
  const { selectedCities } = useCityFilter();
  const [history, setHistory] = useState([]);
  const [target, setTarget]   = useState('all_users');

  const loadHistory = () => {
    fetchList().then(res => {
      if (res.ok) setHistory((res.data?.data ?? []).map(n => ({
        ...n,
        id: n._id ?? n.id ?? String(Date.now()),
        delivered: n.delivered ?? 0,
        opened: n.opened ?? 0,
        status: n.status ?? 'sent',
        target: n.target ?? '',
      })));
    });
  };

  useEffect(() => { loadHistory(); }, []);
  useAutoRefresh(loadHistory);
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [scheduleDate, setSDate] = useState('');
  const [sending, setSending]  = useState(false);
  const [preview, setPreview]  = useState(null);

  // These values ARE the API's `segment` - the broadcast endpoint accepts exactly
  // all_users | all_partners | all, and broadcastNotification branches on nothing else.
  // 'Online Partners Only' used to sit here as a fourth option, but no online segment
  // exists server-side, so choosing it always failed validation. It is not mapped onto
  // all_partners instead: that would quietly notify every partner when the admin asked
  // for only the online ones.
  const targetOptions = [
    { value:'all_users',    label:'All Users',              icon:<Users size={18}/>,     desc:'2,847 recipients' },
    { value:'all_partners', label:'All Partners',           icon:<UserCog size={18}/>,   desc:'186 recipients' },
    { value:'all',          label:'Everyone',               icon:<Globe size={18}/>,     desc:'3,033 recipients' },
  ];

  const handleSend = async () => {
    if (!title || !body) { showToast('Please fill in title and body.', 'danger'); return; }
    setSending(true);
    const cityIds = selectedCities.map(c => c.id);
    const res = await action('post', '/api/v1/admin/notifications/broadcast', {title, body, segment: target, data: {}, cityIds});
    if (!res.ok) {
      showToast(res.error ?? 'Failed to send notification.', 'danger');
      setSending(false);
      return;
    }
    const newNotif = {
      id: res.data?.data?.id ?? Date.now().toString(),
      title, body, target,
      sentAt: res.data?.data?.sentAt ?? new Date().toISOString(),
      delivered: res.data?.data?.delivered ?? 0,
      opened: 0,
      status: 'sent',
    };
    setHistory(prev => [newNotif, ...prev]);
    setSending(false);
    showToast(scheduleDate ? 'Notification scheduled!' : 'Notification sent!', 'success');
    setTitle(''); setBody(''); setSDate('');
  };

  const useTemplate = (t) => { setTitle(t.title); setBody(t.body); };

  const getDeliveryRate = (n) => n.delivered > 0 ? Math.round(n.opened/n.delivered*100) : 0;

  return (
    <div>
      {/* <TestPushPanel action={action} showToast={showToast} /> */}
      <div className="form-grid form-grid-2" style={{ gap:24 }}>
        {/* Compose */}
        <div>
          <div className="card mb-24">
            <div className="card-header">
              <div className="card-title">Compose Notification</div>
            </div>
            <div className="card-body">
              {/* Target audience */}
              <div style={{ marginBottom:16 }}>
                <div className="form-label" style={{ marginBottom:8 }}>Target Audience</div>
                <div className="form-grid form-grid-2" style={{ gap:8 }}>
                  {targetOptions.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setTarget(opt.value)}
                      style={{
                        border:`2px solid ${target===opt.value?'var(--c-brand-primary)':'var(--c-border)'}`,
                        borderRadius:'var(--r-md)', padding:'10px 12px', cursor:'pointer',
                        background: target===opt.value ? 'var(--c-info-bg)' : 'white',
                        transition:'var(--t-fast)',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ color:target===opt.value?'var(--c-brand-primary)':'var(--c-text-muted)' }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color:target===opt.value?'var(--c-brand-primary)':'var(--c-text-primary)' }}>{opt.label}</div>
                          <div style={{ fontSize:11, color:'var(--c-text-secondary)' }}>{opt.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="form-hint" style={{ marginTop:8 }}>
                  {selectedCities.length === 0
                    ? `Targeting: All Cities (use the city selector in the header to scope this to specific cities)`
                    : `Targeting: ${selectedCities.map(c => c.name).join(', ')}`}
                </div>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Notification Title *</label>
                <input className="form-input" placeholder="e.g. Weekend Special Offer! 🎉" value={title} onChange={e => setTitle(e.target.value)} maxLength={60}/>
                <span className="form-hint">{title.length}/60 characters</span>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Message Body *</label>
                <textarea className="form-textarea" placeholder="Enter your notification message…" value={body} onChange={e => setBody(e.target.value)} maxLength={200} rows={4}/>
                <span className="form-hint">{body.length}/200 characters</span>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Schedule (optional)</label>
                <input className="form-input" type="datetime-local" value={scheduleDate} onChange={e => setSDate(e.target.value)}/>
                <span className="form-hint">Leave blank to send immediately.</span>
              </div>

              {/* Preview */}
              {(title || body) && (
                <div style={{ background:'var(--c-brand-teal-dark)', borderRadius:'var(--r-lg)', padding:16, marginBottom:16, color:'white' }}>
                  <div style={{ fontSize:11, opacity:0.6, fontWeight:600, textTransform:'uppercase', marginBottom:8 }}>Preview</div>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:36, height:36, background:'var(--c-brand-accent)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontWeight:800, color:'var(--c-brand-teal-dark)', fontSize:14 }}>B</span>
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{title || 'Notification Title'}</div>
                      <div style={{ fontSize:12, opacity:0.8 }}>{body || 'Your message body will appear here…'}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-teal btn-lg w-full"
                onClick={handleSend}
                disabled={sending || !title || !body}
                style={{ justifyContent:'center', gap:8 }}
              >
                {sending ? 'Sending…' : (
                  <><Send size={16}/> {scheduleDate ? 'Schedule Notification' : 'Send Now'}</>
                )}
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick Templates</div>
            </div>
            <div style={{ padding:'0 8px 8px' }}>
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  onClick={() => useTemplate(t)}
                  style={{ padding:'12px 12px', borderRadius:'var(--r-md)', cursor:'pointer', transition:'var(--t-fast)' }}
                  onMouseOver={e => e.currentTarget.style.background='var(--c-border-light)'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'var(--c-text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="card" style={{ alignSelf:'flex-start' }}>
          <div className="card-header">
            <div className="card-title">Notification History</div>
          </div>
          <div>
            {history.map(n => (
              <div key={n.id} style={{ padding:'16px 20px', borderBottom:'1px solid var(--c-border-light)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:0, paddingRight:12 }}>
                    <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:12, color:'var(--c-text-secondary)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{n.body}</div>
                  </div>
                  <Badge status={n.status}/>
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--c-text-secondary)', marginTop:8 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Bell size={12}/> {n.delivered.toLocaleString()} delivered
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Eye size={12}/> {n.opened.toLocaleString()} opened ({getDeliveryRate(n)}%)
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={12}/> {new Date(n.sentAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
                {n.delivered > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ background:'var(--c-border)', borderRadius:'var(--r-full)', height:4 }}>
                      <div style={{ height:'100%', borderRadius:'var(--r-full)', background:'var(--c-brand-secondary)', width:`${getDeliveryRate(n)}%` }}/>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
