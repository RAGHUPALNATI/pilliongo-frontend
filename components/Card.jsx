'use client';

import React from 'react';

// Three-tier glass hierarchy:
//   primary   — the main content container on a screen (default)
//   secondary — supporting/nested info inside a primary card
//   solid     — zero transparency, for places that must never blur
// A near-opaque white (`/80`+) glass reads as a clean card on today's flat
// bg-brand-bg pages and gains real depth once a page migrates onto the
// atmospheric background in Phase 4 — same markup, no visual regression
// either way.
const VARIANTS = {
  primary: 'bg-white/80 backdrop-blur-xl border border-white/70 shadow-glass',
  secondary: 'bg-white/55 backdrop-blur-md border border-white/50 shadow-glass-sm',
  solid: 'bg-white border border-gray-100 shadow-subtle',
};

export function Card({ children, className = '', variant = 'primary', hover = false, ...props }) {
  return (
    <div
      className={`${VARIANTS[variant] || VARIANTS.primary} rounded-glass ${
        hover
          ? 'hover:shadow-glass-lg hover:border-white/90 hover:-translate-y-0.5 transition-all duration-200'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 border-b border-black/5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base sm:text-lg font-bold text-brand-navy tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs sm:text-sm text-ink-900/50 mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-4 sm:p-6 bg-black/[0.02] rounded-b-glass border-t border-black/5 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
