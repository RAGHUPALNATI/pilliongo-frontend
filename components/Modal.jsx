'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Shared modal shell — replaces the five hand-rolled `fixed inset-0
// bg-black/50 ...` blocks that were duplicated across the app (forgot
// password, edit profile, post-instant-offer, driver-offer, rider-request).
// Pages adopt this in Phase 4; EditProfileModal is rebuilt on it now since
// it's a shared component, not a page.
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  iconClassName = 'bg-brand-orange/10 text-brand-orange',
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${sizes[size] || sizes.md} max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-2xl border border-white/70 rounded-glass shadow-glass-lg animate-scale-up`}
      >
        {(title || Icon) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-black/5 sticky top-0 bg-white/90 backdrop-blur-2xl rounded-t-glass">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                {title && <h3 className="font-bold text-base text-brand-navy truncate">{title}</h3>}
                {description && <p className="text-xs text-ink-900/50 mt-0.5">{description}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-900/40 hover:text-ink-900 hover:bg-black/5 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-black/[0.02] border-t border-black/5 flex items-center justify-end gap-3 rounded-b-glass sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
