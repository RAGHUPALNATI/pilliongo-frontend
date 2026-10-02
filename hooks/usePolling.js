'use client';

import { useEffect, useRef } from 'react';

// How often each kind of screen re-asks the server for fresh data.
// Kept between 10 and 15 seconds: fast enough to feel live, slow enough
// that 100+ people using the app don't flood the database with reads.
export const POLL_MS = {
  liveRide: 10000, // the ride status page, while a ride is under way
  dashboard: 12000, // rider/driver dashboards and the instant-ride board
  notifications: 15000, // the unread-count badge on the bell
};

// Calls `callback` every `intervalMs`, but ONLY while this browser tab is
// actually visible. A tab left open in the background sends nothing, and
// the moment the person comes back it refreshes straight away instead of
// showing stale data until the next tick.
//
// The latest `callback` is always the one that runs, so it can safely read
// current state without being listed in `deps`.
export function usePolling(callback, intervalMs, { enabled = true, deps = [] } = {}) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const run = () => {
      if (document.visibilityState === 'visible') latest.current();
    };

    const interval = setInterval(run, intervalMs);
    document.addEventListener('visibilitychange', run);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
}
