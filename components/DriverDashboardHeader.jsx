'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { Card } from '@/components/Card';
import { Bike, Car, Power, Plus, Zap, Calendar } from 'lucide-react';

// Shared header for both driver dashboard pages: welcome/vehicle info +
// availability toggle + plan-ride button, plus a two-tab switcher that
// links to the actual separate pages (real navigation, not client tabs) —
// /driver/dashboard for Instant, /driver/dashboard/planned for Planned.
export default function DriverDashboardHeader({
  user,
  isAvailable,
  onToggleAvailability,
  active,
  instantCount = 0,
  plannedCount = 0,
}) {
  return (
    <>
      <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">
            {user?.vehicleType === 'Car' ? (
              <Car className="w-4 h-4 text-emerald-500" />
            ) : (
              <Bike className="w-4 h-4 text-brand-orange" />
            )}
            Verified Driver • {user?.vehicleType || 'Bike'} ({user?.vehicleModel || 'Hero Splendor'} - {user?.vehicleNumber || 'PB 09 AB 1234'})
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            Welcome, <span className="text-brand-orange">{user?.name || 'Driver'}</span> 🚗
          </h1>
          <p className="text-xs text-ink-900/50 mt-1">
            Accept instant departures or reserve pre-planned route trips scheduled days in advance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/plan-ride">
            <Button variant="primary" size="sm" icon={Plus}>
              Plan a Ride (Instant or Scheduled)
            </Button>
          </Link>

          <Button
            variant={isAvailable ? 'emerald' : 'secondary'}
            size="sm"
            icon={Power}
            onClick={onToggleAvailability}
          >
            {isAvailable ? 'Status: Available' : 'Status: Unavailable'}
          </Button>
        </div>
      </Card>

      {/* Page switcher — two real routes, not a client tab, so each is its
          own clean page instead of one long scroll. */}
      <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-xl text-xs font-bold w-fit">
        <Link
          href="/driver/dashboard"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            active === 'instant' ? 'bg-brand-orange text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Instant Requests
          {instantCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                active === 'instant' ? 'bg-white/25 text-white' : 'bg-brand-orange text-white'
              }`}
            >
              {instantCount}
            </span>
          )}
        </Link>
        <Link
          href="/driver/dashboard/planned"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            active === 'planned' ? 'bg-blue-600 text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Planned Rides
          {plannedCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                active === 'planned' ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {plannedCount}
            </span>
          )}
        </Link>
      </div>
    </>
  );
}
