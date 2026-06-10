import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Users, Shield, Bell, CreditCard, Key, Save,
  Plus, Edit2, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useSettings } from '../hooks/useSettings';

const SETTING_SECTIONS = [
  { id:'general',     label:'General',          icon:<SettingsIcon size={16}/> },
  { id:'admins',      label:'Admin Users',       icon:<Users size={16}/> },
  { id:'roles',       label:'Role Permissions',  icon:<Shield size={16}/> },
  { id:'commission',  label:'Commission',        icon:<CreditCard size={16}/> },
  { id:'notifications',label:'Notifications',   icon:<Bell size={16}/> },
  { id:'api',         label:'API & Integrations',icon:<Key size={16}/>, superAdminOnly:true },
];

const ALL_PAGES = ['dashboard','users','partners','bookings','services','earnings','coupons','reviews','notifications','reports','settings'];

export default function Settings() {
  const { user, showToast } = useAuth();
  const { fetchList, create, update, remove } = useAdminUsers();
  const { action: settingsAction } = useSettings();
  const [activeSection, setSection] = useState('general');
  const [admins, setAdmins]         = useState([]);
  const [addingAdmin, setAddingAdmin]= useState(false);
  const [editingAdmin, setEditingAdmin]= useState(null);
  const [adminForm, setAdminForm]   = useState({});

  useEffect(() => {
    fetchList().then(res => { if (res.ok) setAdmins(res.data?.data ?? []); });
  }, []);
  const [commission, setCommission] = useState(20);
  const NOTIF_ITEMS = [
    { label:'Booking Confirmation',  desc:'Notify users when booking is confirmed',             defaultOn:true },
    { label:'Partner Assigned',      desc:'Notify users when a partner is assigned',            defaultOn:true },
    { label:'Job Started',           desc:'Notify users when service begins',                   defaultOn:true },
    { label:'Service Completed',     desc:'Notify users when service is complete',              defaultOn:true },
    { label:'New Job Request',       desc:'Notify partners about new booking requests',         defaultOn:true },
    { label:'Booking Cancelled',     desc:'Notify both parties on cancellation',                defaultOn:true },
    { label:'Review Reminder',       desc:'Remind users to review 2h after service',            defaultOn:true },
    { label:'Promotional Offers',    desc:'Send promotional notifications to users',            defaultOn:false },
    { label:'Low Earnings Alert',    desc:'Alert partners when monthly earnings drop',           defaultOn:false },
  ];
  const [notifToggles, setNotifToggles] = useState(() => Object.fromEntries(NOTIF_ITEMS.map(i => [i.label, i.defaultOn])));
  const [general, setGeneral]       = useState({ appName:'Beyomo', tagline:'Beauty & Wellness at Home', supportEmail:'support@beyomo.com', supportPhone:'+91 1800-XXX-XXXX', privacyUrl:'https://beyomo.com/privacy' });

  const isSuperAdmin = user?.role === 'super_admin';

  const visibleSections = SETTING_SECTIONS.filter(s => !s.superAdminOnly || isSuperAdmin);

  const saveAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.role) { showToast('Fill all required fields.', 'danger'); return; }
    if (editingAdmin) {
      const id = editingAdmin._id ?? editingAdmin.id;
      const res = await update(id, adminForm, 'put');
      if (res.ok) {
        setAdmins(prev => prev.map(a => (a._id ?? a.id) === id ? { ...a, ...adminForm } : a));
        showToast('Admin updated!', 'success');
        setEditingAdmin(null);
      } else {
        showToast(res.error ?? 'Update failed.', 'danger');
      }
    } else {
      const res = await create({ ...adminForm, password: adminForm.password || 'beyomo@123' });
      if (res.ok) {
        fetchList().then(r => { if (r.ok) setAdmins(r.data?.data ?? []); });
        showToast('Admin account created!', 'success');
        setAddingAdmin(false);
      } else {
        showToast(res.error ?? 'Create failed.', 'danger');
      }
    }
  };

  const deleteAdmin = async (id) => {
    if ((user?._id ?? user?.id) === id) { showToast('Cannot delete your own account.', 'danger'); return; }
    const res = await remove(id);
    if (res.ok) {
      setAdmins(prev => prev.filter(a => (a._id ?? a.id) !== id));
      showToast('Admin removed.', 'danger');
    } else {
      showToast(res.error ?? 'Delete failed.', 'danger');
    }
  };

  return (
    <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
      {/* Sidebar */}
      <div className="settings-sidebar">
        <div className="card" style={{ padding:'8px' }}>
          {visibleSections.map(s => (
            <div
              key={s.id}
              className={`settings-sidebar-item ${activeSection===s.id?'active':''}`}
              onClick={() => setSection(s.id)}
            >
              {s.icon}
              <span>{s.label}</span>
              {s.superAdminOnly && <span style={{ fontSize:10, background:'var(--c-warning-bg)', color:'var(--c-warning-text)', padding:'1px 5px', borderRadius:'var(--r-full)', fontWeight:700 }}>SA</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* General */}
        {activeSection === 'general' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">General Settings</div>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">App Name</label>
                    <input className="form-input" value={general.appName} onChange={e => setGeneral(g=>({...g,appName:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tagline</label>
                    <input className="form-input" value={general.tagline} onChange={e => setGeneral(g=>({...g,tagline:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Support Email</label>
                    <input className="form-input" type="email" value={general.supportEmail} onChange={e => setGeneral(g=>({...g,supportEmail:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Support Phone</label>
                    <input className="form-input" value={general.supportPhone} onChange={e => setGeneral(g=>({...g,supportPhone:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Privacy Policy URL</label>
                  <input className="form-input" value={general.privacyUrl} onChange={e => setGeneral(g=>({...g,privacyUrl:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-teal" onClick={async () => {
                await settingsAction('patch', '/api/v1/admin/settings/general', general);
                showToast('Settings saved!', 'success');
              }} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Save size={15}/> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Admin Users */}
        {activeSection === 'admins' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Admin Users</div>
              <button className="btn btn-primary btn-sm" onClick={() => { setAddingAdmin(true); setAdminForm({ role:'support' }); }} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={14}/> Add Admin
              </button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Admin</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {admins.map(a => {
                    const aid = a._id ?? a.id;
                    const uid = user?._id ?? user?.id;
                    const rc = ROLE_COLORS[a.role] || {};
                    return (
                      <tr key={aid}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div className="table-avatar" style={{ background:'linear-gradient(135deg,var(--c-brand-teal-mid),var(--c-brand-secondary))' }}>{a.avatar ?? a.name?.[0]}</div>
                            <div>
                              <div style={{ fontWeight:600 }}>{a.name} {aid===uid && <span style={{ fontSize:11, background:'var(--c-warning-bg)', color:'var(--c-warning-text)', padding:'1px 6px', borderRadius:'var(--r-full)', fontWeight:700 }}>You</span>}</div>
                              <div style={{ fontSize:12, color:'var(--c-text-secondary)' }}>{a.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ background:rc.bg, color:rc.text, padding:'3px 10px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:700 }}>{ROLE_LABELS[a.role]}</span></td>
                        <td style={{ fontSize:13 }}>{a.lastLogin ? new Date(a.lastLogin).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                        <td><Badge status={a.status}/></td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setEditingAdmin(a); setAdminForm({ name:a.name, email:a.email, role:a.role }); }}><Edit2 size={14}/></button>
                            {aid !== uid && isSuperAdmin && (
                              <button className="btn btn-ghost btn-icon" onClick={() => deleteAdmin(aid)} style={{ color:'var(--c-danger)' }}><Trash2 size={14}/></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role Permissions */}
        {activeSection === 'roles' && (
          <div className="card">
            <div className="card-header"><div className="card-title">Role Permission Matrix</div></div>
            <div className="card-body">
              <div className="permission-matrix">
                <table>
                  <thead>
                    <tr>
                      <th style={{ minWidth:140 }}>Page / Feature</th>
                      {Object.keys(ROLE_PERMISSIONS).map(role => (
                        <th key={role}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                            <span>{ROLE_LABELS[role]}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_PAGES.map(page => (
                      <tr key={page}>
                        <td style={{ textAlign:'left', fontWeight:600, textTransform:'capitalize' }}>{page}</td>
                        {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                          <td key={role}>
                            {perms.includes(page)
                              ? <CheckCircle size={18} className="check-icon"/>
                              : <XCircle size={18} className="cross-icon"/>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:16, background:'var(--c-warning-bg)', borderRadius:'var(--r-md)', padding:'12px 16px', fontSize:13, color:'var(--c-warning-text)' }}>
                <strong>Note:</strong> Role permissions are system-defined. Contact Super Admin to request changes.
              </div>
            </div>
          </div>
        )}

        {/* Commission */}
        {activeSection === 'commission' && (
          <div className="card">
            <div className="card-header"><div className="card-title">Commission Settings</div></div>
            <div className="card-body">
              <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:24 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>Platform Commission Rate</div>
                  <div style={{ fontSize:13, color:'var(--c-text-secondary)' }}>Percentage deducted from each booking as platform fee.</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <input
                    type="range" min={5} max={40} value={commission}
                    onChange={e => setCommission(+e.target.value)}
                    style={{ width:160 }}
                  />
                  <div style={{ fontSize:24, fontWeight:800, color:'var(--c-brand-orange)', width:60, textAlign:'center' }}>{commission}%</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>
                {[
                  { label:'Platform Gets', value:`${commission}%`, color:'var(--c-brand-primary)' },
                  { label:'Partner Gets',  value:`${100-commission}%`, color:'var(--c-success)' },
                  { label:'Example (₹1000 booking)', value:`₹${commission*10} / ₹${(100-commission)*10}`, color:'var(--c-brand-orange)' },
                ].map(item => (
                  <div key={item.label} style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16, textAlign:'center' }}>
                    <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginBottom:6 }}>{item.label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-teal" onClick={async () => {
                await settingsAction('patch', '/api/v1/admin/settings/commission', { rate: commission });
                showToast(`Commission set to ${commission}%!`, 'success');
              }} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Save size={15}/> Save Commission Rate
              </button>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeSection === 'notifications' && (
          <div className="card">
            <div className="card-header"><div className="card-title">Notification Settings</div></div>
            <div className="card-body">
              {NOTIF_ITEMS.map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--c-border)' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{item.label}</div>
                    <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginTop:2 }}>{item.desc}</div>
                  </div>
                  <label className="toggle-switch" style={{ flexShrink:0 }}>
                    <input type="checkbox" checked={notifToggles[item.label]} onChange={e => setNotifToggles(prev => ({ ...prev, [item.label]: e.target.checked }))}/>
                    <span className="toggle-slider"/>
                  </label>
                </div>
              ))}
            </div>
            <div className="card-footer">
              <button className="btn btn-teal" onClick={async () => {
                await settingsAction('patch', '/api/v1/admin/settings/notifications', notifToggles);
                showToast('Notification settings saved!', 'success');
              }} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Save size={15}/> Save Settings
              </button>
            </div>
          </div>
        )}

        {/* API Settings — Super Admin Only */}
        {activeSection === 'api' && isSuperAdmin && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">API & Integrations</div>
              <span style={{ background:'var(--c-warning-bg)', color:'var(--c-warning-text)', padding:'3px 10px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:700 }}>Super Admin Only</span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-section-title">Backend API</div>
                <div className="form-group">
                  <label className="form-label">API Base URL</label>
                  <input className="form-input" defaultValue="https://sgcj3mv1-2308.inc1.devtunnels.ms/owner" style={{ fontFamily:'monospace', fontSize:13 }}/>
                </div>
                <div className="divider"/>
                <div className="form-section-title">Firebase</div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Project ID</label>
                    <input className="form-input" defaultValue="beyomo-prod" style={{ fontFamily:'monospace', fontSize:13 }}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">FCM Server Key</label>
                    <input className="form-input" type="password" defaultValue="AAAAxxxxxx" style={{ fontFamily:'monospace', fontSize:13 }}/>
                  </div>
                </div>
                <div className="divider"/>
                <div className="form-section-title">Razorpay</div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Key ID</label>
                    <input className="form-input" type="password" defaultValue="rzp_live_xxxxx" style={{ fontFamily:'monospace', fontSize:13 }}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Key Secret</label>
                    <input className="form-input" type="password" defaultValue="secret_xxxxx" style={{ fontFamily:'monospace', fontSize:13 }}/>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-teal" onClick={async () => {
                await settingsAction('patch', '/api/v1/admin/settings/api', {});
                showToast('API settings saved!', 'success');
              }} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Save size={15}/> Save API Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin User Modal */}
      <Modal
        isOpen={addingAdmin || !!editingAdmin}
        onClose={() => { setAddingAdmin(false); setEditingAdmin(null); }}
        title={editingAdmin ? `Edit Admin — ${editingAdmin.name}` : 'Add New Admin'}
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setAddingAdmin(false); setEditingAdmin(null); }}>Cancel</button>
            <button className="btn btn-teal" onClick={saveAdmin}>{editingAdmin ? 'Save Changes' : 'Create Admin'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={adminForm.name||''} onChange={e => setAdminForm(f=>({...f,name:e.target.value}))} placeholder="John Smith"/>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" value={adminForm.email||''} onChange={e => setAdminForm(f=>({...f,email:e.target.value}))} placeholder="admin@beyomo.com"/>
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select className="form-select" value={adminForm.role||'support'} onChange={e => setAdminForm(f=>({...f,role:e.target.value}))}>
              {Object.entries(ROLE_LABELS).filter(([r]) => isSuperAdmin || r !== 'super_admin').map(([r,l]) => (
                <option key={r} value={r}>{l}</option>
              ))}
            </select>
          </div>
          {!editingAdmin && (
            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input className="form-input" defaultValue="admin123" style={{ fontFamily:'monospace' }}/>
              <span className="form-hint">User should change this after first login.</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
