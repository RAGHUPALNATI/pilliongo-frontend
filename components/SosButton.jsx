'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sosAPI } from '@/lib/api';
import { ShieldAlert, Loader2 } from 'lucide-react';

// One-tap emergency alert — confirms first (so it can't fire from an
// accidental tap), grabs best-effort device location, and notifies every
// admin immediately. Writes exactly one row per press, so it's essentially
// free storage-wise even though it's high-urgency.
export default function SosButton({ rideId, className = '' }) {
  const { showToast } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePress = () => {
    if (sending || sent) return;
    if (
      !window.confirm(
        'Send an SOS alert? This immediately notifies the PillionGo admin with your location so they can step in right away.'
      )
    ) {
      return;
    }

    setSending(true);

    const send = (lat, lng) => {
      sosAPI
        .trigger({ rideId, lat, lng })
        .then(() => {
          setSent(true);
          showToast('SOS alert sent — the admin has been notified.', 'success');
        })
        .catch((err) => {
          showToast(err.message || 'Failed to send SOS alert', 'error');
        })
        .finally(() => setSending(false));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => send(pos.coords.latitude, pos.coords.longitude),
        () => send(null, null), // permission denied / unavailable — still send the alert
        { timeout: 5000 }
      );
    } else {
      send(null, null);
    }
  };

  return (
    <button
      onClick={handlePress}
      disabled={sending || sent}
      title="Emergency — alerts the admin immediately"
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all ${
        sent
          ? 'bg-emerald-100 text-emerald-700 cursor-default'
          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_2px_10px_-2px_rgba(225,29,72,0.5)]'
      } ${className}`}
    >
      {sending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5" />
      )}
      {sent ? 'SOS Sent — Admin Notified' : sending ? 'Sending SOS…' : 'SOS Emergency'}
    </button>
  );
}
