'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ridesAPI } from '@/lib/api';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Select } from '@/components/Input';
import Alert from '@/components/Alert';
import {
  MapPin,
  Calendar,
  Bike,
  Car,
  ArrowRight,
  History,
  ShieldCheck,
  ExternalLink,
  Clock,
  XCircle,
  Zap,
  CheckCircle2,
  AlertCircle,
  Phone,
  Lock,
} from 'lucide-react';

export default function RiderDashboardPage() {
  return (
    <ProtectedRoute allowedRole="Rider">
      <RiderDashboardContent />
    </ProtectedRoute>
  );
}

function RiderDashboardContent() {
  const { user, showToast } = useAuth();

  const [cancelling, setCancelling] = useState(false);
  const [startingRide, setStartingRide] = useState(false);

  // `activeRide` tracks ONLY the rider's own live INSTANT ride — the one
  // thing that actually blocks new instant requests/bookings on the
  // backend (see ridesAPI.createRide / bookDriverOffer). A PLANNED ride the
  // rider has requested or booked is a separate, non-blocking commitment —
  // tracked independently in `activePlannedRides` — so one never gets
  // treated as if it were the other (mirrors the same INSTANT/PLANNED
  // separation already applied on the driver dashboard).
  const [activeRide, setActiveRide] = useState(null);
  const [activePlannedRides, setActivePlannedRides] = useState([]);
  const [historyRides, setHistoryRides] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  const loadRiderData = async (silent = false) => {
    if (!silent) setLoadingData(true);
    try {
      const history = await ridesAPI.getRideHistory();
      const currentActive = history.find((r) =>
        r.rideType === 'INSTANT' && ['REQUESTED', 'ACCEPTED', 'STARTED'].includes(r.status)
      );

      // Notify if active instant ride expired since last check
      if (activeRide && activeRide.status === 'REQUESTED' && (!currentActive || currentActive.status === 'EXPIRED')) {
        showToast('Your instant ride request has expired. You can post a new request.', 'info');
      }

      setActiveRide(currentActive || null);

      // Planned rides the rider has requested or booked — shown for
      // reference only, never blocks the instant ride form or offers below.
      const currentPlanned = history.filter((r) =>
        r.rideType === 'PLANNED' && ['REQUESTED', 'ACCEPTED', 'STARTED'].includes(r.status)
      );
      setActivePlannedRides(currentPlanned);

      setHistoryRides(history);
    } catch (err) {
      console.error('Error fetching rider data:', err);
    } finally {
      if (!silent) setLoadingData(false);
    }
  };

  useEffect(() => {
    loadRiderData(false);
  }, []);

  // Poll backend every 4 seconds to keep active ride status and the live
  // driver instant-offer feed in sync
  useEffect(() => {
    const interval = setInterval(() => {
      loadRiderData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeRide?.id, activeRide?.status]);

  // 15-Minute Expiry Countdown Timer Effect (Visual Countdown)
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'REQUESTED') {
      setTimeLeft('');
      return;
    }

    const expiryTime = activeRide.expiresAt
      ? new Date(activeRide.expiresAt).getTime()
      : (activeRide.createdAt ? new Date(activeRide.createdAt).getTime() + 15 * 60 * 1000 : null);

    if (!expiryTime) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance <= 0) {
        setTimeLeft('Expired');
        loadRiderData(true); // reload active ride from backend
      } else {
        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [activeRide]);

  const handleCancelActiveRide = async () => {
    if (!activeRide) return;
    if (!window.confirm('Are you sure you want to cancel your current ride request?')) return;
    setCancelling(true);
    try {
      await ridesAPI.cancelRide(activeRide.id);
      showToast('Ride request cancelled. You can now post a new ride request.', 'info');
      setActiveRide(null);
      loadRiderData(false);
    } catch (err) {
      showToast(err.message || 'Failed to cancel ride', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleStartRide = async () => {
    if (!activeRide) return;
    setStartingRide(true);
    try {
      await ridesAPI.startRide(activeRide.id);
      showToast('Ride started! Driver can now complete the trip.', 'success');
      loadRiderData(true);
    } catch (err) {
      showToast(err.message || 'Failed to start ride', 'error');
    } finally {
      setStartingRide(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            PillionGo Instant Commuter Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            {getGreeting()}, <span className="text-brand-orange">{user?.name || 'Commuter'}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-ink-900/50 mt-1">
            Request an instant ride departing immediately (15-min auto-expiry) or plan a future route ride.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/plan-ride">
            <Button variant="primary" size="sm" icon={Calendar}>
              Plan a Ride (Instant or Scheduled)
            </Button>
          </Link>
          <Link href="/login?role=Driver">
            <Button variant="outlineOrange" size="sm">
              Switch to Driver
            </Button>
          </Link>
        </div>
      </Card>

      {/* ACTIVE RIDE PROMINENT TRACKER MODULE (CONSOLIDATED SINGLE SOURCE OF TRUTH) */}
      {activeRide && (
        <Card className="overflow-hidden ring-1 ring-brand-orange/25">
          <CardHeader className="bg-gradient-to-r from-ink-900 to-ink-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-none rounded-t-glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5720B] to-brand-orange flex items-center justify-center font-bold text-white shadow-glow-brand">
                #{activeRide.id}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white">Active Instant Ride Tracker</h3>
                  <StatusBadge status={activeRide.status} size="sm" />
                </div>
                <p className="text-xs text-white/40">Live status synced with the backend</p>
              </div>
            </div>

            {activeRide.status === 'REQUESTED' && timeLeft && (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                <Clock className="w-4 h-4 text-brand-orange" />
                <span>Auto-expiring in {timeLeft}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Route Info */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-3 text-sm font-extrabold text-brand-navy">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs">{activeRide.fromLocation}</span>
                  <ArrowRight className="w-5 h-5 text-brand-orange shrink-0" />
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">{activeRide.toLocation}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-ink-900/50 font-medium">
                  <span>Fare: <strong className="text-brand-orange font-bold text-sm">₹{activeRide.fare}</strong></span>
                  <span>Type: <strong className="uppercase font-bold">{activeRide.rideType}</strong></span>
                  {activeRide.description && <span>Note: {activeRide.description}</span>}
                </div>

                {/* Status Guidance Banner */}
                {activeRide.status === 'REQUESTED' && (
                  <Alert variant="warning" title="Broadcasting to Nearby Drivers">
                    Drivers in your area can view and accept your request. It will auto-expire in 15 minutes if unaccepted.
                  </Alert>
                )}

                {activeRide.driverName && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-emerald-600" /> Driver Assigned: {activeRide.driverName}
                      </p>
                      {activeRide.driverPhone && (
                        <a
                          href={`tel:${activeRide.driverPhone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call {activeRide.driverPhone}</span>
                        </a>
                      )}
                    </div>
                    <p className="text-emerald-700">
                      Vehicle: {activeRide.vehicleType || 'Bike/Car'} • {activeRide.vehicleModel || 'Standard'} ({activeRide.vehicleNumber || activeRide.vehiclePlate || 'N/A'})
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-black/5 pt-4 md:pt-0 md:pl-6">
                {activeRide.status === 'ACCEPTED' && (
                  <Button
                    variant="emerald"
                    size="md"
                    isLoading={startingRide}
                    onClick={handleStartRide}
                    icon={CheckCircle2}
                  >
                    Click to Start Ride
                  </Button>
                )}

                <Link href={`/ride/${activeRide.id}`} className="w-full">
                  <Button variant="primary" size="md" className="w-full" icon={ExternalLink}>
                    Track Live Map / Status
                  </Button>
                </Link>

                {activeRide.status === 'REQUESTED' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    isLoading={cancelling}
                    onClick={handleCancelActiveRide}
                    icon={XCircle}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PLANNED RIDES — tracked independently of the instant ride above.
          Purely informational: booking/requesting a planned ride never
          blocks (and is never blocked by) instant ride activity. */}
      {activePlannedRides.length > 0 && (
        <Card className="overflow-hidden ring-1 ring-blue-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" /> Your Planned Rides
            </CardTitle>
            <CardDescription>
              Upcoming pre-planned trips — these don't block instant requests or offers below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePlannedRides.map((ride) => (
              <div
                key={ride.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/[0.03] p-3.5 rounded-xl border border-black/5"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={ride.status} size="sm" />
                  <div className="text-xs">
                    <p className="font-bold text-brand-navy">{ride.fromLocation} → {ride.toLocation}</p>
                    <p className="text-ink-900/50">
                      {ride.scheduledDate} at {ride.scheduledTime}
                      {ride.driverName ? ` • Driver: ${ride.driverName}` : ' • Waiting for a driver'}
                    </p>
                  </div>
                </div>
                <Link href={`/ride/${ride.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Instant requests, browsing driver offers, and pre-planned routes
          all now live together on the Plan Ride page — this is just a
          pointer over to it, so the dashboard stays focused on tracking a
          ride you already have going. */}
      {!activeRide && (
        <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-1 ring-brand-orange/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5720B] to-brand-orange text-white flex items-center justify-center shrink-0 shadow-glow-brand">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-brand-navy">Need a ride?</p>
              <p className="text-xs text-ink-900/50">
                Request an instant departure, browse drivers already on the road, or book a pre-planned route — all on the Plan Ride page.
              </p>
            </div>
          </div>
          <Link href="/plan-ride">
            <Button variant="primary" size="md" icon={ArrowRight}>
              Go to Plan Ride
            </Button>
          </Link>
        </Card>
      )}

      {/* Ride History lives on its own dedicated page (with Instant/Planned
          filters) — the dashboard doesn't duplicate a mixed table of both
          types here. This is just a pointer over to it. */}
      <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-black/5 text-brand-orange flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-brand-navy">Your Ride History</p>
            <p className="text-xs text-ink-900/50">
              {loadingData
                ? 'Loading your ride record…'
                : `${historyRides.length} total ride${historyRides.length !== 1 ? 's' : ''} — filter by instant or planned on the history page.`}
            </p>
          </div>
        </div>
        <Link href="/rider/history">
          <Button variant="secondary" size="sm" icon={ExternalLink}>
            View Full Ride History
          </Button>
        </Link>
      </Card>
    </div>
  );
}
