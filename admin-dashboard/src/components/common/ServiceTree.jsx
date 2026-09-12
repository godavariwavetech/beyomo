import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatAmount } from '../../utils/format';

const fmt = (n) => formatAmount(n);

// Category accordion + service checkboxes — shared by Combos and Custom Packages
// so an admin can build a cross-category list of eligible/included services.
export default function ServiceTree({ categories, services, selectedIds, onToggle }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (catId) => setExpanded(p => ({ ...p, [catId]: !p[catId] }));

  const byCat = useMemo(() => {
    const map = {};
    for (const svc of services) {
      const cid = svc.categoryId ?? 0;
      if (!map[cid]) map[cid] = [];
      map[cid].push(svc);
    }
    return map;
  }, [services]);

  const usedCatIds = Object.keys(byCat).map(Number);
  const visibleCats = categories.filter(c => usedCatIds.includes(Number(c.id ?? c._id)));

  if (services.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>
        Select at least one location to see available services.
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
      {visibleCats.map((cat, idx) => {
        const catId = cat.id ?? cat._id;
        const catSvcs = byCat[catId] ?? [];
        const checkedCount = catSvcs.filter(s => selectedIds.includes(Number(s.id))).length;
        const isOpen = expanded[catId] ?? false;

        return (
          <div key={catId} style={{ borderBottom: idx < visibleCats.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
            <button
              type="button"
              onClick={() => toggle(catId)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: isOpen ? 'var(--c-border-light)' : '#fff',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              {cat.image && (
                <img src={cat.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
              )}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
              <span style={{ fontSize: 12, color: checkedCount > 0 ? 'var(--c-brand-primary)' : 'var(--c-text-muted)' }}>
                {checkedCount > 0 ? `${checkedCount} selected` : `${catSvcs.length} service${catSvcs.length !== 1 ? 's' : ''}`}
              </span>
            </button>

            {isOpen && (
              <div style={{ background: '#fafafa' }}>
                {catSvcs.map(svc => {
                  const checked = selectedIds.includes(Number(svc.id));
                  return (
                    <label
                      key={svc.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px 8px 38px', cursor: 'pointer',
                        background: checked ? '#f0faf5' : 'transparent',
                        borderTop: '1px solid var(--c-border-light)',
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => onToggle(Number(svc.id))} />
                      {svc.image && (
                        <img src={svc.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1, fontSize: 13 }}>{svc.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>
                        {svc.duration ? `${svc.duration} min · ` : ''}₹{fmt(svc.basePrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {(byCat[0] ?? []).length > 0 && (
        <div style={{ borderTop: '1px solid var(--c-border)' }}>
          <button
            type="button"
            onClick={() => toggle(0)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: expanded[0] ? 'var(--c-border-light)' : '#fff', border: 'none', cursor: 'pointer' }}
          >
            {expanded[0] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Other</span>
          </button>
          {expanded[0] && (byCat[0] ?? []).map(svc => {
            const checked = selectedIds.includes(Number(svc.id));
            return (
              <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 38px', cursor: 'pointer', background: checked ? '#f0faf5' : 'transparent', borderTop: '1px solid var(--c-border-light)' }}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(Number(svc.id))} />
                <span style={{ flex: 1, fontSize: 13 }}>{svc.name}</span>
                <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>₹{fmt(svc.basePrice)}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
