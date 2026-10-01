'use client';

import React, { useState, useEffect } from 'react';
import { ridesAPI } from '@/lib/api';
import { IndianRupee } from 'lucide-react';

// Live fare preview shown the moment both a pickup and drop-off are picked
// — fetched from the backend so it's the exact same number (fixed-fare
// zones + distance formula) the ride would actually get charged, not a
// client-side guess. Used on both rider request forms and the driver
// offer form, since all three price the same way.
export default function FareEstimate({ from, to }) {
  const [estimate, setEstimate] = useState(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!from || !to || from === to) {
      setEstimate(null);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    setFailed(false);
    ridesAPI
      .getFareEstimate(from, to)
      .then((data) => {
        if (!cancelled) setEstimate(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  if (!from || !to || from === to) {
    return (
      <p className="text-xs text-ink-900/50 bg-black/[0.03] rounded-xl px-3 py-2.5">
        Pick a pickup and a different drop-off to see the estimated fare.
      </p>
    );
  }

  if (checking) {
    return (
      <p className="text-xs text-ink-900/50 bg-black/[0.03] rounded-xl px-3 py-2.5">
        Calculating fare for this route…
      </p>
    );
  }

  if (failed || !estimate) {
    return (
      <p className="text-xs text-ink-900/50 bg-black/[0.03] rounded-xl px-3 py-2.5">
        Fare is set automatically based on the route — you'll see the exact price once this is posted.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between bg-brand-orange/10 border border-brand-orange/30 rounded-xl px-3.5 py-2.5">
      <span className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
        <IndianRupee className="w-3.5 h-3.5 text-brand-orange" /> Estimated Fare
      </span>
      <span className="text-sm font-extrabold text-brand-orange">
        ₹{Math.round(estimate.fare)}
        <span className="text-[10px] font-semibold text-ink-900/40 ml-1.5">(~{estimate.distanceKm} km)</span>
      </span>
    </div>
  );
}
