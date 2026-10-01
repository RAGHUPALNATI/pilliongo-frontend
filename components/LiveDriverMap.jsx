'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// A live GPS dot on a free OpenStreetMap base (no API key, no paid tile
// service). Deliberately does NOT try to pin the pickup/destination —
// those are free-text place names now, so there's no reliable coordinate
// for them without a paid geocoding call. This shows exactly what we
// actually know for certain: where that person's device says it is right
// now. Used for BOTH directions — a driver's position shown to the rider
// (orange dot), and a rider's position shown to the driver (blue dot) —
// picked via the `role` prop so the two are visually distinct.
const driverIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 9999px;
    background: #EA580C; border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(234,88,12,0.25), 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const riderIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 9999px;
    background: #2563EB; border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.25), 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function LiveDriverMap({ lat, lng, updatedAt, driverName, vehicleLabel, role = 'driver' }) {
  const label = role === 'rider' ? 'rider' : 'driver';
  const icon = role === 'rider' ? riderIcon : driverIcon;

  if (lat == null || lng == null) {
    return (
      <div className="h-56 rounded-xl border border-black/10 bg-black/[0.03] flex flex-col items-center justify-center gap-1.5 text-center px-4">
        <p className="text-xs font-bold text-ink-900/50">Waiting for {label === 'rider' ? "rider's" : "driver's"} live location…</p>
        <p className="text-[10px] text-ink-900/35">
          This appears automatically once {driverName || `the ${label}`} starts sharing location on this ride.
        </p>
      </div>
    );
  }

  const secondsAgo = updatedAt ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000) : null;
  const isStale = secondsAgo != null && secondsAgo > 90;

  return (
    <div className="space-y-1.5">
      <div className="h-56 rounded-xl overflow-hidden border border-black/10 relative z-0">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={icon}>
            <Popup>
              {driverName || (label === 'rider' ? 'Rider' : 'Driver')}
              {vehicleLabel ? ` — ${vehicleLabel}` : ''}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <p className={`text-[10px] font-semibold ${isStale ? 'text-amber-600' : 'text-emerald-600'}`}>
        {isStale
          ? `Last updated ${secondsAgo}s ago — connection may have dropped.`
          : 'Live — updating automatically'}
      </p>
    </div>
  );
}
