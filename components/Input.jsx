'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

function FieldWrapper({ label, error, helperText, required, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold text-ink-900/70 uppercase tracking-wide">
          {label} {required && <span className="text-brand-orange">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-semibold text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-ink-900/40">{helperText}</p>
      ) : null}
    </div>
  );
}

const fieldBase =
  'w-full py-2.5 rounded-xl bg-white/70 backdrop-blur-md text-sm text-ink-900 placeholder:text-ink-900/30 shadow-glass-sm focus:outline-none focus:ring-2 focus:bg-white/90 transition-all';

export function Input({
  label,
  icon: Icon,
  error,
  helperText,
  required,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  return (
    <FieldWrapper label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-ink-900/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          className={`${fieldBase} ${Icon ? 'pl-10' : 'pl-4'} pr-4 border ${
            error
              ? 'border-rose-400 focus:ring-rose-400/30'
              : 'border-black/10 focus:border-brand-orange/50 focus:ring-brand-orange/40'
          } ${className}`}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
}

export function Select({
  label,
  icon: Icon,
  error,
  helperText,
  required,
  options = [],
  className = '',
  wrapperClassName = '',
  children,
  ...props
}) {
  return (
    <FieldWrapper label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-ink-900/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        )}
        <select
          className={`${fieldBase} ${Icon ? 'pl-10' : 'pl-4'} pr-9 border font-medium appearance-none ${
            error
              ? 'border-rose-400 focus:ring-rose-400/30'
              : 'border-black/10 focus:border-brand-orange/50 focus:ring-brand-orange/40'
          } ${className}`}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-ink-900/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </FieldWrapper>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  required,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  return (
    <FieldWrapper label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
      <textarea
        className={`${fieldBase} px-4 border resize-none ${
          error
            ? 'border-rose-400 focus:ring-rose-400/30'
            : 'border-black/10 focus:border-brand-orange/50 focus:ring-brand-orange/40'
        } ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}
