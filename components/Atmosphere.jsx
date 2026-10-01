'use client';

import React from 'react';

// The atmospheric background layer — deep ink gradient + soft, low-opacity
// blurred glows. Not wired into the root layout yet: doing that today would
// paint every not-yet-migrated page's empty gutters dark before their turn
// in Phase 4, breaking pages this pass explicitly isn't supposed to touch.
// Instead each Phase 4 page that wants the full atmosphere (landing hero,
// login, register, dashboard shells) mounts this itself — pass `fixed`
// (default) for a whole-viewport backdrop, or `fixed={false}` to confine it
// to one `relative overflow-hidden` section.
export default function Atmosphere({ fixed = true, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 -z-10 overflow-hidden bg-ink-950 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-950 to-black" />
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-brand-orange/20 blur-3xl" />
      <div className="absolute bottom-[-160px] left-[-120px] w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-indigo-500/[0.06] blur-3xl" />
    </div>
  );
}
