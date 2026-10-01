'use client';

import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`py-12 px-6 text-center space-y-3 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-black/[0.04] border border-black/5 flex items-center justify-center mx-auto text-ink-900/30">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <div className="space-y-1">
        {title && <p className="font-bold text-sm text-brand-navy">{title}</p>}
        {description && <p className="text-xs text-ink-900/40 max-w-xs mx-auto leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
