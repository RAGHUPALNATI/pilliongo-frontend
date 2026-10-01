'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  Navigation,
  XCircle,
  TimerOff,
  ShieldCheck,
  ShieldAlert,
  Check,
  User,
  Car,
} from 'lucide-react';

// Badges are deliberately the "solid surface" tier of the glass hierarchy —
// status needs to be readable at a glance, not tinted-and-translucent, so
// these stay fully opaque regardless of what glass sits behind them.
export default function StatusBadge({ status, type = 'ride', size = 'md', className = '' }) {
  if (!status) return null;
  const sUpper = String(status).toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 font-bold',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-bold',
    lg: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 font-extrabold',
  };

  const rideConfigs = {
    REQUESTED: {
      label: 'Searching Driver',
      icon: Clock,
      style: 'bg-amber-500 text-white shadow-[0_2px_10px_-2px_rgba(245,158,11,0.5)]',
    },
    ACCEPTED: {
      label: 'Driver Confirmed',
      icon: Check,
      style: 'bg-blue-600 text-white shadow-[0_2px_10px_-2px_rgba(37,99,235,0.5)]',
    },
    STARTED: {
      label: 'Trip In Progress',
      icon: Navigation,
      style: 'bg-purple-600 text-white shadow-[0_2px_10px_-2px_rgba(147,51,234,0.5)]',
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCircle2,
      style: 'bg-emerald-600 text-white shadow-[0_2px_10px_-2px_rgba(5,150,105,0.5)]',
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: XCircle,
      style: 'bg-rose-600 text-white shadow-[0_2px_10px_-2px_rgba(225,29,72,0.5)]',
    },
    EXPIRED: {
      label: 'Request Expired',
      icon: TimerOff,
      style: 'bg-gray-500 text-white',
    },
  };

  const roleConfigs = {
    RIDER: {
      label: 'Commuter Rider',
      icon: User,
      style: 'bg-emerald-600 text-white shadow-[0_2px_10px_-2px_rgba(5,150,105,0.5)]',
    },
    DRIVER: {
      label: 'Verified Driver',
      icon: Car,
      style: 'bg-brand-orange text-white shadow-[0_2px_10px_-2px_rgba(234,88,12,0.5)]',
    },
    ADMIN: {
      label: 'System Admin',
      icon: ShieldAlert,
      style: 'bg-purple-600 text-white shadow-[0_2px_10px_-2px_rgba(147,51,234,0.5)]',
    },
  };

  const config =
    type === 'role'
      ? roleConfigs[sUpper] || { label: status, icon: ShieldCheck, style: 'bg-gray-500 text-white' }
      : rideConfigs[sUpper] || { label: status, icon: Clock, style: 'bg-gray-500 text-white' };

  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center rounded-full ${config.style} ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
