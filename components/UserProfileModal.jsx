'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import {
  User,
  Mail,
  Phone,
  Calendar,
  BadgeCheck,
  ShieldOff,
  Bike,
  Car,
  IndianRupee,
  Route,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MessageSquare,
  MapPin,
  Loader2,
} from 'lucide-react';

// Read-only "check this account out" panel for the admin — pulls the full
// profile (contact info, every vehicle on file, ride stats, recent
// activity, support/route-request usage) from GET /admin/users/{id} so an
// admin can actually tell a real, active user apart from a throwaway one
// without leaving the Users table.
export default function UserProfileModal({ isOpen, onClose, userId, adminAPI }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !userId) return;
    setDetail(null);
    setError('');
    setLoading(true);
    adminAPI
      .getUserById(userId)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Failed to load this user\'s profile'))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  const isDriver = (detail?.role || '').toUpperCase() === 'DRIVER';

  const formatDate = (value) => {
    if (!value) return 'Unknown';
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(value);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detail ? detail.fullName : 'User Profile'}
      description={detail ? detail.email : 'Loading account details…'}
      icon={User}
      size="xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-900/50">
          <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
          <p className="text-xs font-semibold">Loading profile…</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-rose-600 font-semibold">{error}</div>
      ) : !detail ? null : (
        <div className="space-y-6">
          {/* Identity header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-navy text-white flex items-center justify-center font-extrabold text-xl shrink-0">
                {(detail.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-brand-navy text-lg">{detail.fullName}</h3>
                  <StatusBadge status={detail.role} type="role" size="sm" />
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-ink-900/55 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {detail.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {detail.phone || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(detail.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                  detail.emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" /> {detail.emailVerified ? 'Email Verified' : 'Email Unverified'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                  detail.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {detail.active ? <BadgeCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                {detail.active ? 'Active' : 'Suspended'}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Total Rides" value={detail.totalRides ?? 0} icon={Route} />
            <StatTile label="Completed" value={detail.completedRides ?? 0} icon={CheckCircle2} accent="text-emerald-600" />
            <StatTile label="Cancelled" value={detail.cancelledRides ?? 0} icon={XCircle} accent="text-rose-600" />
            <StatTile label="Distance" value={`${detail.distanceTraveled ?? 0} km`} icon={MapPin} />
          </div>

          {isDriver && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Earnings"
                value={`₹${detail.totalEarnings ?? 0}`}
                icon={IndianRupee}
                accent="text-brand-orange"
              />
              <StatTile
                label="Availability"
                value={detail.available ? 'Available' : 'Offline'}
                icon={detail.available ? CheckCircle2 : XCircle}
                accent={detail.available ? 'text-emerald-600' : 'text-ink-900/40'}
              />
              <StatTile label="Support Msgs" value={detail.supportMessageCount ?? 0} icon={MessageSquare} />
              <StatTile label="Route Requests" value={detail.locationRequestCount ?? 0} icon={MapPin} />
            </div>
          )}

          {!isDriver && (
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Support Msgs" value={detail.supportMessageCount ?? 0} icon={MessageSquare} />
              <StatTile label="Route Requests" value={detail.locationRequestCount ?? 0} icon={MapPin} />
            </div>
          )}

          {/* Vehicles on file (drivers only) */}
          {isDriver && (
            <div>
              <h4 className="text-xs font-bold uppercase text-ink-900/50 tracking-wider mb-2">
                Vehicles On File
              </h4>
              {detail.vehicles && detail.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {detail.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2.5 bg-black/[0.03] border border-black/5 rounded-xl px-3.5 py-2.5"
                    >
                      {v.vehicleType === 'Car' ? (
                        <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Bike className="w-4 h-4 text-brand-orange shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-brand-navy truncate">
                          {v.vehicleModel} ({v.vehiclePlate})
                        </p>
                        <p className="text-[10px] text-ink-900/45">{v.vehicleType}</p>
                      </div>
                      {v.primaryVehicle && (
                        <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-brand-navy text-white text-[9px] font-extrabold uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-900/40">No vehicles on file.</p>
              )}
            </div>
          )}

          {/* Recent activity */}
          <div>
            <h4 className="text-xs font-bold uppercase text-ink-900/50 tracking-wider mb-2">
              Recent Activity
            </h4>
            {detail.recentRides && detail.recentRides.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {detail.recentRides.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 bg-black/[0.03] border border-black/5 rounded-xl px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-brand-navy">
                        <span className="truncate">{r.pickupLocation}</span>
                        <ArrowRight className="w-3 h-3 text-brand-orange shrink-0" />
                        <span className="truncate">{r.destination}</span>
                      </div>
                      <p className="text-[10px] text-ink-900/45 mt-0.5">
                        As {r.asRole === 'DRIVER' ? 'Driver' : 'Rider'} • {r.rideType === 'PLANNED' ? 'Pre-Planned' : 'Instant'} • {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={r.status} size="sm" />
                      {r.fare != null && (
                        <p className="text-[10px] font-bold text-brand-orange mt-1">₹{r.fare}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-900/40">No rides yet — this account hasn't ridden or driven.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function StatTile({ label, value, icon: Icon, accent = 'text-brand-navy' }) {
  return (
    <div className="bg-black/[0.03] border border-black/5 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-ink-900/45">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <p className={`text-lg font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}
