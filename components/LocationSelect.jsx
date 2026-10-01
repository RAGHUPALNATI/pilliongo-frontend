'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const fieldBase =
  'w-full py-2.5 rounded-xl bg-white/70 backdrop-blur-md text-sm text-ink-900 placeholder:text-ink-900/30 shadow-glass-sm focus:outline-none focus:ring-2 focus:bg-white/90 transition-all';

// A searchable dropdown for picking a location — same props shape as the
// plain <Select> (label/icon/options/value/onChange), so it's a drop-in
// swap wherever a from/to picker used to be a scrolling native <select>.
// Typing filters the list; clicking (or Enter on the highlighted row)
// selects it and fires onChange with the same {target:{value}} shape a
// native select event gives, so every existing handler keeps working
// unchanged.
export default function LocationSelect({
  label,
  icon: Icon,
  error,
  helperText,
  required,
  options = [],
  value,
  onChange,
  placeholder = 'Search locations…',
  wrapperClassName = '',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || value || '';

  // When not actively editing, the box shows the selected value. While
  // open and being typed into, it shows whatever's been typed so far.
  const displayValue = open ? query : selectedLabel;

  const filtered = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (opt) => {
    onChange({ target: { value: opt.value } });
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) selectOption(filtered[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="block text-[11px] font-bold text-ink-900/70 uppercase tracking-wide">
          {label} {required && <span className="text-brand-orange">*</span>}
        </label>
      )}
      <div className="relative" ref={wrapperRef}>
        {Icon && (
          <Icon className="w-4 h-4 text-ink-900/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery('');
            setHighlight(Math.max(options.findIndex((opt) => opt.value === value), 0));
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`${fieldBase} ${Icon ? 'pl-10' : 'pl-4'} pr-9 border font-medium ${
            error
              ? 'border-rose-400 focus:ring-rose-400/30'
              : 'border-black/10 focus:border-brand-orange/50 focus:ring-brand-orange/40'
          } ${className}`}
        />
        <ChevronDown className="w-4 h-4 text-ink-900/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        {open && (
          <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl bg-white shadow-glass border border-black/10 py-1">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-ink-900/40 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> No matching locations
              </div>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep focus, avoid a blur before the click registers
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                    i === highlight ? 'bg-brand-orange/10 text-brand-navy font-semibold' : 'text-ink-900/80'
                  } ${opt.value === value ? 'font-bold text-brand-orange' : ''}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-[11px] font-semibold text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-ink-900/40">{helperText}</p>
      ) : null}
    </div>
  );
}
