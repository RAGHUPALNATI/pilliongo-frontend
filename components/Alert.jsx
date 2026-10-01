'use client';

import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, Lock } from 'lucide-react';

// Alerts/banners — like badges, these stay in the solid/tinted tier on
// purpose. An error or a "you can't do that right now" lock state that's
// half-transparent is a bad idea; this is the one place glass explicitly
// steps aside for clarity (rule: readability before aesthetics).
const VARIANTS = {
  info: { icon: Info, style: 'bg-blue-50 border-blue-200 text-blue-900', iconStyle: 'text-blue-600' },
  success: { icon: CheckCircle2, style: 'bg-emerald-50 border-emerald-200 text-emerald-900', iconStyle: 'text-emerald-600' },
  warning: { icon: AlertTriangle, style: 'bg-amber-50 border-amber-200 text-amber-900', iconStyle: 'text-amber-600' },
  error: { icon: XCircle, style: 'bg-rose-50 border-rose-200 text-rose-900', iconStyle: 'text-rose-600' },
  lock: { icon: Lock, style: 'bg-amber-50 border-amber-200 text-amber-900', iconStyle: 'text-amber-600' },
};

export default function Alert({ variant = 'info', icon, title, children, action, className = '' }) {
  const config = VARIANTS[variant] || VARIANTS.info;
  const IconComponent = icon || config.icon;

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${config.style} ${className}`}>
      <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center shrink-0 ${config.iconStyle}`}>
        <IconComponent className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        {title && <p className="text-xs font-bold">{title}</p>}
        {children && <div className="text-xs leading-relaxed opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
