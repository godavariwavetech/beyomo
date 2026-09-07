import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * `dismissOnBackdrop` / `dismissOnEscape` default to true so every existing modal keeps
 * behaving as it did. Pass false on forms where an accidental click outside would throw
 * away what the admin has typed, forcing them to close via the header X or a footer button.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = '',
  footer,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!dismissOnEscape) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, dismissOnEscape]);

  // When a backdrop click is blocked, nudge the modal and highlight the ways out,
  // so the click isn't just swallowed with no feedback at all.
  //
  // The class is driven directly rather than through state, for two reasons:
  //   1. A timer that clears the class has to outlast the CSS animation exactly. Get it
  //      wrong and the class disappears mid-animation, cutting the highlight off at its
  //      peak - which reads as a flicker. Letting animationend do it keeps the two in
  //      sync by construction, so tweaking the CSS timing can never desync them again.
  //   2. Toggling a boolean that is already true is a no-op in React, so clicking the
  //      backdrop repeatedly would not replay the animation. Removing the class and
  //      forcing a reflow before re-adding it restarts it every time.
  const modalRef = useRef(null);

  const rejectBackdropClick = () => {
    const el = modalRef.current;
    if (!el) return;
    el.classList.remove('modal-attention');
    void el.offsetWidth; // reflow — without this the browser coalesces the remove+add
    el.classList.add('modal-attention');
  };

  // modal-exit-highlight is the longest of the two animations and runs on the close
  // controls, so it finishing means the whole sequence is done. Named explicitly so the
  // modal's own slideUp entrance animation doesn't clear the class the moment it opens.
  const handleAnimationEnd = (e) => {
    if (e.animationName === 'modal-exit-highlight') {
      modalRef.current?.classList.remove('modal-attention');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // e.target === e.currentTarget keeps clicks that bubble up from inside the
        // modal from counting as backdrop clicks.
        if (e.target !== e.currentTarget) return;
        if (dismissOnBackdrop) onClose();
        else rejectBackdropClick();
      }}
    >
      <div
        ref={modalRef}
        className={`modal ${size ? `modal-${size}` : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
