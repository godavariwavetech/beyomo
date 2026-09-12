import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, X } from 'lucide-react';
import { formatAmount } from '../../utils/format';

const fmt = (n) => formatAmount(n);

// Shows the currently-selected services in display order and lets the admin
// drag to reorder or remove one — used by Packages.jsx and Combos.jsx so the
// order services are picked in isn't left to catalog order by accident.
export default function ReorderableServiceList({ services, onReorder, onRemove }) {
  if (services.length === 0) return null;

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(services);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered.map(s => Number(s.id)));
  };

  return (
    <div>
      <label className="form-label" style={{ marginBottom: 6 }}>
        Service Order <span style={{ fontWeight: 400, color: 'var(--c-text-muted)' }}>(drag to set the order shown to customers)</span>
      </label>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="selected-services-order">
          {(dropProvided) => (
            <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} style={{ border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              {services.map((svc, index) => (
                <Draggable key={svc.id} draggableId={String(svc.id)} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        borderBottom: index < services.length - 1 ? '1px solid var(--c-border-light)' : 'none',
                        background: dragSnapshot.isDragging ? 'var(--c-border-light)' : '#fff',
                        ...dragProvided.draggableProps.style,
                      }}
                    >
                      <span {...dragProvided.dragHandleProps} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--c-text-muted)', display: 'flex', flexShrink: 0 }}>
                        <GripVertical size={15} />
                      </span>
                      <span style={{ flex: 1, fontSize: 13 }}>{index + 1}. {svc.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>₹{fmt(svc.basePrice)}</span>
                      <button
                        type="button"
                        onClick={() => onRemove(Number(svc.id))}
                        title="Remove"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', display: 'flex', flexShrink: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
