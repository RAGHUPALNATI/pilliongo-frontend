'use client';

import React from 'react';
import Button from '@/components/Button';
import { MapPin, ArrowRight, Clock, Check, X } from 'lucide-react';

// Single pending-request card — shared by both the Instant and Planned
// driver dashboard pages so the tile markup only exists in one place.
export default function DriverRequestTile({ req, actionLoadingId, onAccept, onDecline }) {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-xl p-5 border border-black/10 shadow-glass-sm hover:shadow-glass hover:border-brand-orange/40 transition-all space-y-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm">
            {req.riderName ? req.riderName.charAt(0) : 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-brand-navy">{req.riderName || 'Commuter'}</h4>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                req.rideType === 'PLANNED'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {req.rideType === 'PLANNED' ? '📅 PRE-PLANNED' : '⚡ 15-MIN INSTANT'}
              </span>
            </div>
            <p className="text-[11px] text-ink-900/45">PillionGo Rider</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-base font-extrabold text-brand-orange">₹{req.fare || 45}</span>
        </div>
      </div>

      <div className="bg-black/[0.03] p-3.5 rounded-lg border border-black/5 space-y-2 text-xs">
        <div className="flex items-center justify-between font-semibold text-brand-navy">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {req.fromLocation}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {req.toLocation}
          </span>
        </div>

        <div className="text-[11px] text-ink-900/55 flex items-center justify-between border-t border-black/5 pt-1.5">
          <span className="flex items-center gap-1 font-semibold text-brand-navy">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            {req.rideType === 'INSTANT' ? '⚡ Departing NOW (15m timer)' : `${req.scheduledDate || ''} ${req.scheduledTime || ''}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="emerald"
          size="sm"
          className="flex-1"
          isLoading={actionLoadingId === req.id}
          onClick={() => onAccept(req.id)}
          icon={Check}
        >
          Accept Ride
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onDecline(req.id)}
          icon={X}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
