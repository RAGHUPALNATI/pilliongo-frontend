import React from 'react';

// PillionGo brand mark: a dotted route curving from a pickup point up to a
// solid destination pin — reads as "pickup → drop-off" at a glance instead
// of a generic compass-arrow icon. Single-color (currentColor) so it drops
// straight into the existing gradient icon boxes used across the Navbar,
// Footer, and the auth pages — pass the same className you'd give a lucide
// icon (e.g. `w-5 h-5 text-white`).
export default function LogoMark({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.8 18.4C7 12.6 10 8.3 13.6 6.8C15.6 5.95 17.6 6.1 19 7.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.1 3.2"
      />
      <circle cx="4.8" cy="18.4" r="2.1" fill="currentColor" fillOpacity="0.45" />
      <circle cx="19.3" cy="7.3" r="3.3" fill="currentColor" />
    </svg>
  );
}
