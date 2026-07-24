import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, BookOpen, Tag } from 'lucide-react';
import Modal from '../components/common/Modal';
import api from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const ADMIN_SKILLS_URL = '/api/v1/admin/skills';

export default function Skills() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState('');
  const [catActive, setCatActive] = useState(true);
  const [catSaving, setCatSaving] = useState(false);

  // Skill modal
  const [skillModal, setSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillParentId, setSkillParentId] = useState(null);
  const [skillName, setSkillName] = useState('');
  const [skillActive, setSkillActive] = useState(true);
  const [skillSaving, setSkillSaving] = useState(false);

  const fetchCategories = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`${ADMIN_SKILLS_URL}/categories`);
      setCategories(res.data?.data || []);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useAutoRefresh(() => fetchCategories(true));

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Category actions
  const openNewCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatOrder('');
    setCatActive(true);
    setCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatOrder(String(cat.sortOrder ?? ''));
    setCatActive(cat.isActive !== false);
    setCatModal(true);
  };

  const saveCat = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const payload = { name: catName.trim(), sortOrder: parseInt(catOrder || '0', 10), isActive: catActive };
      if (editingCat) {
        await api.put(`${ADMIN_SKILLS_URL}/categories/${editingCat.id}`, payload);
      } else {
        await api.post(`${ADMIN_SKILLS_URL}/categories`, payload);
      }
      setCatModal(false);
      fetchCategories();
    } catch { }
    setCatSaving(false);
  };

  const deleteCat = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}" and all its skills?`)) return;
    try {
      await api.delete(`${ADMIN_SKILLS_URL}/categories/${cat.id}`);
      fetchCategories();
    } catch { }
  };

  // Skill actions
  const openNewSkill = (catId) => {
    setEditingSkill(null);
    setSkillParentId(catId);
    setSkillName('');
    setSkillActive(true);
    setSkillModal(true);
  };

  const openEditSkill = (skill, catId) => {
    setEditingSkill(skill);
    setSkillParentId(catId);
    setSkillName(skill.name);
    setSkillActive(skill.isActive !== false);
    setSkillModal(true);
  };

  const saveSkill = async () => {
    if (!skillName.trim()) return;
    setSkillSaving(true);
    try {
      const payload = { name: skillName.trim(), isActive: skillActive };
      if (editingSkill) {
        await api.put(`${ADMIN_SKILLS_URL}/skills/${editingSkill.id}`, payload);
      } else {
        await api.post(`${ADMIN_SKILLS_URL}/categories/${skillParentId}/skills`, payload);
      }
      setSkillModal(false);
      fetchCategories();
    } catch { }
    setSkillSaving(false);
  };

  const deleteSkill = async (skill) => {
    if (!window.confirm(`Delete skill "${skill.name}"?`)) return;
    try {
      await api.delete(`${ADMIN_SKILLS_URL}/skills/${skill.id}`);
      fetchCategories();
    } catch { }
  };

  const totalSkills = categories.reduce((sum, c) => sum + (c.skills?.length || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills Management</h1>
          <p className="page-subtitle">
            {categories.length} categories · {totalSkills} skills — shown during partner registration
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewCat}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--c-text-muted)' }}>Loading…</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No skill categories yet. Add your first one.</p>
          <button className="btn btn-primary" onClick={openNewCat} style={{ marginTop: 12 }}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Category row */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 20px', cursor: 'pointer',
                  borderBottom: expanded[cat.id] ? '1px solid var(--c-border)' : 'none',
                }}
                onClick={() => toggleExpand(cat.id)}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {expanded[cat.id]
                    ? <ChevronDown size={16} style={{ color: 'var(--c-text-muted)' }} />
                    : <ChevronRight size={16} style={{ color: 'var(--c-text-muted)' }} />}
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{cat.name}</span>
                  <span style={{
                    fontSize: 12, padding: '2px 8px', borderRadius: 20,
                    background: cat.isActive ? 'var(--c-success-bg, #d1fae5)' : 'var(--c-border)',
                    color: cat.isActive ? 'var(--c-success, #065f46)' : 'var(--c-text-muted)',
                  }}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                    {cat.skills?.length || 0} skill{(cat.skills?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditCat(cat)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--c-danger)' }} onClick={() => deleteCat(cat)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Skills list */}
              {expanded[cat.id] && (
                <div style={{ padding: '12px 20px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {cat.skills && cat.skills.map(skill => (
                      <div
                        key={skill.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 12px', borderRadius: 20,
                          border: '1px solid var(--c-border)',
                          background: skill.isActive ? 'var(--c-bg-subtle, #f9fafb)' : 'transparent',
                          opacity: skill.isActive ? 1 : 0.5,
                          fontSize: 13,
                        }}>
                        <Tag size={12} style={{ color: 'var(--c-text-muted)' }} />
                        <span>{skill.name}</span>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2, display: 'flex', alignItems: 'center', color: 'var(--c-text-muted)' }}
                          onClick={() => openEditSkill(skill, cat.id)}>
                          <Edit2 size={12} />
                        </button>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--c-danger)' }}
                          onClick={() => deleteSkill(skill)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => openNewSkill(cat.id)}>
                    <Plus size={13} /> Add Skill
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={catModal}
        onClose={() => setCatModal(false)}
        title={editingCat ? 'Edit Category' : 'New Skill Category'}
        size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Hair Basic"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCat()}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sort Order</label>
            <input
              className="form-input"
              type="number"
              placeholder="0"
              value={catOrder}
              onChange={e => setCatOrder(e.target.value)}
            />
            <span className="form-hint">Lower numbers appear first</span>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={catActive} onChange={e => setCatActive(e.target.checked)} />
              <span className="form-label" style={{ margin: 0 }}>Active (visible to partners)</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setCatModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveCat} disabled={catSaving || !catName.trim()}>
              {catSaving ? 'Saving…' : 'Save Category'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Skill Modal */}
      <Modal
        isOpen={skillModal}
        onClose={() => setSkillModal(false)}
        title={editingSkill ? 'Edit Skill' : 'New Skill'}
        size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Skill Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Basic HairCut"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveSkill()}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={skillActive} onChange={e => setSkillActive(e.target.checked)} />
              <span className="form-label" style={{ margin: 0 }}>Active</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setSkillModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveSkill} disabled={skillSaving || !skillName.trim()}>
              {skillSaving ? 'Saving…' : 'Save Skill'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
