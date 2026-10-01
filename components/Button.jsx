'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

  // Two real tiers, matching the design system: solid, saturated fills for
  // primary/high-stakes actions (always legible, glow reserved for these
  // only) and a light-glass treatment for secondary/ghost actions that
  // still reads correctly on today's plain white cards *and* on tomorrow's
  // glass surfaces once a page migrates — no variant depends on a dark
  // atmosphere sitting behind it.
  const variants = {
    primary:
      'bg-gradient-to-b from-[#F5720B] to-brand-orange hover:to-brand-orange-hover text-white shadow-glow-brand hover:shadow-[0_0_0_1px_rgba(234,88,12,0.5),0_14px_32px_-6px_rgba(234,88,12,0.55)] focus:ring-brand-orange/40 active:scale-[0.98]',
    secondary:
      'bg-white/70 hover:bg-white/90 backdrop-blur-md border border-black/10 text-ink-900 shadow-glass-sm hover:shadow-glass focus:ring-ink-900/10 active:scale-[0.98]',
    emerald:
      'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:to-emerald-700 text-white shadow-glow-emerald hover:shadow-[0_0_0_1px_rgba(16,185,129,0.4),0_14px_28px_-6px_rgba(16,185,129,0.45)] focus:ring-emerald-500/40 active:scale-[0.98]',
    destructive:
      'bg-gradient-to-b from-rose-500 to-rose-600 hover:to-rose-700 text-white shadow-[0_0_0_1px_rgba(225,29,72,0.3),0_8px_24px_-6px_rgba(225,29,72,0.4)] hover:shadow-[0_0_0_1px_rgba(225,29,72,0.45),0_12px_28px_-6px_rgba(225,29,72,0.5)] focus:ring-rose-500/40 active:scale-[0.98]',
    ghost:
      'bg-transparent text-ink-900/60 hover:bg-ink-900/5 hover:text-ink-900 focus:ring-ink-900/10',
    outlineOrange:
      'bg-transparent border border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange focus:ring-brand-orange/30 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm sm:text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
