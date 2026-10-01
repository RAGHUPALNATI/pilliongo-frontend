'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Generic floating glass menu (trigger + item list) for non-form use —
// e.g. a future account/kebab menu. Form dropdowns should use the `Select`
// export from `Input.jsx` instead, which keeps native <select> behavior
// (mobile-native picker, full accessibility) with matching glass chrome.
export default function Dropdown({ trigger, items = [], align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {trigger || (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 backdrop-blur-md border border-black/10 text-xs font-semibold text-ink-900 shadow-glass-sm"
          >
            Menu
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {open && (
        <div
          className={`absolute z-30 mt-2 min-w-[190px] ${align === 'right' ? 'right-0' : 'left-0'} bg-white/90 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-glass-lg p-1.5 animate-scale-up`}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="my-1 h-px bg-black/5" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-900 hover:bg-black/5'
                }`}
              >
                {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
