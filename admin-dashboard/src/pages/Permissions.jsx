import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit2, Trash2, User, CheckCircle, XCircle, Globe } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS, ALL_MODULES } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useZones } from '../hooks/useZones';

const MODULE_LABELS = {
  dashboard:'Dashboard', users:'Users', partners:'Partners', bookings:'Bookings',
  services:'Services', earnings:'Earnings', coupons:'Coupons', reviews:'Reviews',
  notifications:'Notifications', reports:'Reports', settings:'Settings',
  permissions:'Permissions', feedback:'App Feedback', zones:'Zones', cities:'Cities',
};

const MODULE_ICONS = {
  dashboard:'📊', users:'👥', partners:'🤝', bookings:'📅', services:'✨',
  earnings:'💰', coupons:'🏷️', reviews:'⭐', notifications:'🔔', reports:'📈',
  settings:'⚙️', permissions:'🛡️', feedback:'💬', zones:'🗺️', cities:'🏙️',
};

const parseJSON = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : null; } catch { return null; }
};

export default function Permissions() {
  const { user, showToast } = useAuth();
  const { fetchList, create, update, remove } = useAdminUsers();
  const { fetchList: fetchZones } = useZones();
  const [admins, setAdmins]             = useState([]);
  const [zones, setZones]               = useState([]);
  const [addingAdmin, setAddingAdmin]   = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm]       = useState({});
  const [customPerms, setCustomPerms]   = useState(null);
  const [useCustom, setUseCustom]       = useState(false);
  const [allowAllZones, setAllowAllZones]   = useState(true);
  const [selectedZones, setSelectedZones]   = useState([]);

  useEffect(() => {
    fetchList().then(res => { if (res.ok) setAdmins(res.data?.data ?? []); });
    fetchZones().then(res => { if (res.ok) setZones(res.data?.data ?? []); });
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';

  const openAdd = () => {
    setAdminForm({ role: 'support', password: 'beyomo@123' });
    const defaultPerms = ROLE_PERMISSIONS['support'] || [];
    setCustomPerms([...defaultPerms]);
    setUseCustom(false);
    setAllowAllZones(true);
    setSelectedZones([]);
    setAddingAdmin(true);
  };

  const openEdit = (a) => {
    setEditingAdmin(a);
    setAdminForm({ name: a.name, email: a.email, role: a.role });
    const perms = parseJSON(a.customPermissions) || ROLE_PERMISSIONS[a.role] || [];
    setCustomPerms([...perms]);
    setUseCustom(!!parseJSON(a.customPermissions));
    const az = parseJSON(a.allowedZones);
    setAllowAllZones(!az || az.length === 0);
    setSelectedZones(az || []);
  };

  const handleRoleChange = (role) => {
    setAdminForm(f => ({ ...f, role }));
    if (!useCustom) setCustomPerms([...ROLE_PERMISSIONS[role] || []]);
  };

  const togglePerm = (mod) => {
    setCustomPerms(prev =>
      prev.includes(mod) ? prev.filter(p => p !== mod) : [...prev, mod]
    );
  };

  const saveAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.role) {
      showToast('Please fill all required fields.', 'danger'); return;
    }
    const finalPerms = useCustom ? customPerms : undefined;
    const finalZones = allowAllZones ? null : (selectedZones.length ? selectedZones : null);
    if (editingAdmin) {
      const id = editingAdmin._id ?? editingAdmin.id;
      const res = await update(id, {...adminForm, customPermissions: finalPerms, allowedZones: finalZones}, 'put');
      if (res.ok) {
        setAdmins(prev => prev.map(a => (a._id ?? a.id) === id ? {...a, ...adminForm, customPermissions: finalPerms ?? null, allowedZones: finalZones} : a));
        showToast('Admin updated!', 'success');
        setEditingAdmin(null);
      } else {
        showToast(res.error, 'danger');
      }
    } else {
      const res = await create({...adminForm, customPermissions: finalPerms, allowedZones: finalZones});
      if (res.ok) {
        fetchList().then(r => { if (r.ok) setAdmins(r.data?.data ?? []); });
        showToast('Admin account created!', 'success');
        setAddingAdmin(false);
      } else {
        showToast(res.error, 'danger');
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
      showToast(res.error, 'danger');
    }
  };

  const getEffectivePerms = (a) => parseJSON(a.customPermissions) || ROLE_PERMISSIONS[a.role] || [];

  const stats = {
    total: admins.length,
    active: admins.filter(a => a.status === 'active').length,
    custom: admins.filter(a => a.customPermissions).length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Admins',     value: stats.total,   color: '#064081' },
          { label: 'Active',           value: stats.active,  color: '#22C55E' },
          { label: 'Custom Permissions', value: stats.custom, color: '#FF9500' },
          { label: 'Total Modules',    value: ALL_MODULES.length, color: '#02B0E8' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Admin Users Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Admin Users & Access Control</div>
            <div className="card-subtitle">Manage who can access the dashboard and which modules they see</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={14}/> Add New Admin
          </button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Permission Type</th>
                <th>Module Access</th>
                <th>Zone Access</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => {
                const rc = ROLE_COLORS[a.role] || {};
                const perms = getEffectivePerms(a);
                const isCustom = !!(parseJSON(a.customPermissions)?.length);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="table-avatar" style={{ background:'linear-gradient(135deg,var(--c-brand-teal-mid),var(--c-brand-teal-dark))' }}>{a.avatar}</div>
                        <div>
                          <div style={{ fontWeight:600 }}>
                            {a.name}
                            {a.id === user?.id && (
                              <span style={{ fontSize:10, background:'var(--c-warning-bg)', color:'var(--c-warning-text)', padding:'1px 6px', borderRadius:'var(--r-full)', fontWeight:700, marginLeft:6 }}>You</span>
                            )}
                          </div>
                          <div style={{ fontSize:12, color:'var(--c-text-secondary)' }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ background:rc.bg, color:rc.text, padding:'3px 10px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:700 }}>
                        {ROLE_LABELS[a.role]}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: isCustom ? 'var(--c-purple-bg)' : 'var(--c-border-light)',
                        color: isCustom ? 'var(--c-purple-text)' : 'var(--c-text-secondary)',
                        padding:'3px 10px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:600,
                      }}>
                        {isCustom ? '🎛 Custom' : '🔑 Role Default'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4, maxWidth:320 }}>
                        {ALL_MODULES.map(mod => (
                          <span key={mod} style={{
                            fontSize:10, fontWeight:600, padding:'2px 6px',
                            borderRadius:'var(--r-full)',
                            background: perms.includes(mod) ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                            color: perms.includes(mod) ? 'var(--c-success-text)' : 'var(--c-text-muted)',
                            opacity: perms.includes(mod) ? 1 : 0.6,
                          }}>
                            {MODULE_ICONS[mod]} {MODULE_LABELS[mod]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const az = parseJSON(a.allowedZones);
                        return !az?.length ? (
                          <span style={{ fontSize:11, color:'var(--c-text-muted)', fontWeight:500 }}>All Zones</span>
                        ) : (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                            {az.map(zid => {
                              const zone = zones.find(z => z.id === zid);
                              return zone ? (
                                <span key={zid} style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:'var(--r-full)', background:'var(--c-brand-teal-bg,#e0f7f4)', color:'var(--c-primary)', display:'flex', alignItems:'center', gap:3 }}>
                                  <Globe size={9}/> {zone.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td><Badge status={a.status}/></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-ghost btn-icon" title="Edit Permissions" onClick={() => openEdit(a)}><Edit2 size={14}/></button>
                        {a.id !== user?.id && isSuperAdmin && (
                          <button className="btn btn-ghost btn-icon" onClick={() => deleteAdmin(a.id)} style={{ color:'var(--c-danger)' }}><Trash2 size={14}/></button>
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

      {/* Role Permission Matrix reference */}
      <div className="card">
        <div className="card-header"><div className="card-title">Default Role Permission Matrix</div></div>
        <div className="card-body">
          <div className="permission-matrix">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth:140 }}>Module</th>
                  {Object.keys(ROLE_PERMISSIONS).map(role => (
                    <th key={role}>
                      <span style={{ background:ROLE_COLORS[role]?.bg, color:ROLE_COLORS[role]?.text, padding:'3px 8px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700 }}>
                        {ROLE_LABELS[role]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map(mod => (
                  <tr key={mod}>
                    <td style={{ textAlign:'left', fontWeight:600 }}>
                      <span style={{ marginRight:6 }}>{MODULE_ICONS[mod]}</span>{MODULE_LABELS[mod]}
                    </td>
                    {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                      <td key={role}>
                        {perms.includes(mod)
                          ? <CheckCircle size={16} className="check-icon"/>
                          : <XCircle size={16} className="cross-icon"/>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Admin Modal */}
      <Modal
        isOpen={addingAdmin || !!editingAdmin}
        onClose={() => { setAddingAdmin(false); setEditingAdmin(null); }}
        title={editingAdmin ? `Edit Permissions — ${editingAdmin.name}` : 'Add New Admin User'}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setAddingAdmin(false); setEditingAdmin(null); }}>Cancel</button>
            <button className="btn btn-teal" onClick={saveAdmin}>{editingAdmin ? 'Save Changes' : 'Create Admin'}</button>
          </>
        }
      >
        <div className="form-grid">
          {/* Basic info */}
          <div className="form-section-title">Account Details</div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={adminForm.name||''} onChange={e => setAdminForm(f=>({...f,name:e.target.value}))} placeholder="John Smith"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" value={adminForm.email||''} onChange={e => setAdminForm(f=>({...f,email:e.target.value}))} placeholder="admin@beyomo.com"/>
            </div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={adminForm.role||'support'} onChange={e => handleRoleChange(e.target.value)}>
                {Object.entries(ROLE_LABELS).filter(([r]) => r !== 'super_admin').map(([r,l]) => (
                  <option key={r} value={r}>{l}</option>
                ))}
              </select>
            </div>
            {!editingAdmin && (
              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input className="form-input" value={adminForm.password||'beyomo@123'} style={{ fontFamily:'monospace' }} onChange={e => setAdminForm(f=>({...f,password:e.target.value}))}/>
                <span className="form-hint">User should change this after first login.</span>
              </div>
            )}
          </div>

          <div className="divider"/>
          <div className="form-section-title">Module Access</div>

          {/* Custom permissions toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>Custom Module Access</div>
              <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginTop:2 }}>
                {useCustom ? 'Manually select which modules this user can access' : `Using default permissions for ${ROLE_LABELS[adminForm.role||'support']} role`}
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={useCustom} onChange={e => {
                setUseCustom(e.target.checked);
                if (!e.target.checked) setCustomPerms([...ROLE_PERMISSIONS[adminForm.role||'support']||[]]);
              }}/>
              <span className="toggle-slider"/>
            </label>
          </div>

          {/* Module grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {ALL_MODULES.map(mod => {
              const allowed = customPerms?.includes(mod) ?? false;
              const isDefault = (ROLE_PERMISSIONS[adminForm.role||'support']||[]).includes(mod);
              return (
                <div
                  key={mod}
                  onClick={() => useCustom && togglePerm(mod)}
                  style={{
                    border:`1.5px solid ${allowed ? 'var(--c-success)' : 'var(--c-border)'}`,
                    borderRadius:'var(--r-md)', padding:'10px 12px',
                    background: allowed ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                    cursor: useCustom ? 'pointer' : 'default',
                    transition:'var(--t-fast)', opacity: !useCustom && !isDefault ? 0.45 : 1,
                    display:'flex', alignItems:'center', gap:8,
                  }}
                >
                  <span style={{ fontSize:16 }}>{MODULE_ICONS[mod]}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color: allowed ? 'var(--c-success-text)' : 'var(--c-text-secondary)' }}>
                      {MODULE_LABELS[mod]}
                    </div>
                  </div>
                  {allowed
                    ? <CheckCircle size={14} style={{ color:'var(--c-success)', flexShrink:0 }}/>
                    : <XCircle size={14} style={{ color:'var(--c-border)', flexShrink:0 }}/>
                  }
                </div>
              );
            })}
          </div>

          {useCustom && (
            <div style={{ fontSize:12, color:'var(--c-text-secondary)', textAlign:'center', marginTop:4 }}>
              {customPerms?.length || 0} of {ALL_MODULES.length} modules selected
            </div>
          )}

          {/* Zone Access */}
          {zones.length > 0 && (
            <>
              <div className="divider"/>
              <div className="form-section-title" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Globe size={14}/> Zone Access
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>Restrict to Specific Zones</div>
                  <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginTop:2 }}>
                    {allowAllZones ? 'This admin can view data from all zones' : 'Select which zones this admin can access'}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={!allowAllZones} onChange={e => {
                    setAllowAllZones(!e.target.checked);
                    if (!e.target.checked) setSelectedZones([]);
                  }}/>
                  <span className="toggle-slider"/>
                </label>
              </div>

              {!allowAllZones && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {zones.filter(z => z.isActive).map(zone => {
                    const checked = selectedZones.includes(zone.id);
                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZones(prev =>
                          prev.includes(zone.id) ? prev.filter(id => id !== zone.id) : [...prev, zone.id]
                        )}
                        style={{
                          border:`1.5px solid ${checked ? 'var(--c-success)' : 'var(--c-border)'}`,
                          borderRadius:'var(--r-md)', padding:'12px 14px',
                          background: checked ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                          cursor:'pointer', transition:'var(--t-fast)',
                          display:'flex', alignItems:'flex-start', gap:10,
                        }}
                      >
                        <Globe size={16} style={{ color: checked ? 'var(--c-success)' : 'var(--c-text-muted)', flexShrink:0, marginTop:1 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color: checked ? 'var(--c-success-text)' : 'var(--c-text-secondary)' }}>
                            {zone.name}
                          </div>
                          <div style={{ fontSize:11, color:'var(--c-text-muted)', marginTop:2 }}>
                            {(() => { const n = parseJSON(zone.cityIds)?.length ?? 0; return `${n} ${n === 1 ? 'city' : 'cities'}`; })()}
                          </div>
                        </div>
                        {checked
                          ? <CheckCircle size={14} style={{ color:'var(--c-success)', flexShrink:0 }}/>
                          : <XCircle size={14} style={{ color:'var(--c-border)', flexShrink:0 }}/>
                        }
                      </div>
                    );
                  })}
                </div>
              )}
              {!allowAllZones && (
                <div style={{ fontSize:12, color:'var(--c-text-secondary)', textAlign:'center', marginTop:4 }}>
                  {selectedZones.length} of {zones.filter(z => z.isActive).length} zones selected
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
