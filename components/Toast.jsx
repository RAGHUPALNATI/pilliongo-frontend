'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useAuth();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const accent = isSuccess ? 'border-l-emerald-400' : isError ? 'border-l-rose-400' : 'border-l-brand-orange';
  const iconColor = isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-brand-orange';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short max-w-sm">
      <div
        className={`flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-2xl border-l-4 ${accent} bg-ink-900/85 backdrop-blur-xl border border-white/10 shadow-glass-lg text-sm font-medium text-white`}
      >
        {isSuccess && <CheckCircle2 className={`w-4.5 h-4.5 shrink-0 ${iconColor}`} />}
        {isError && <AlertCircle className={`w-4.5 h-4.5 shrink-0 ${iconColor}`} />}
        {!isSuccess && !isError && <Info className={`w-4.5 h-4.5 shrink-0 ${iconColor}`} />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
