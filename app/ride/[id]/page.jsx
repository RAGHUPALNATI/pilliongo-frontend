'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusProgress from '@/components/StatusProgress';
import { useAuth } from '@/context/AuthContext';
import { ridesAPI, driverAPI } from '@/lib/api';
import { usePolling, POLL_MS } from '@/hooks/usePolling';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card } from '@/components/Card';
import Alert from '@/components/Alert';
import SosButton from '@/components/SosButton';
import {
  Bike,
  Car,
  MapPin,
  Clock,
  XCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Phone,
  PhoneCall,
  User,
  IndianRupee,
  Navigation,
} from 'lucide-react';

// Leaflet touches window/document at import time — load it client-only, no
// server-rendered placeholder needed since the map is always inside a
// status branch that only renders once ride data is loaded anyway.
const LiveDriverMap = dynamic(() => import('@/components/LiveDriverMap'), { ssr: false });

export default function RideStatusPage() {
  return (
    <ProtectedRoute>
      <RideStatusContent />
    </ProtectedRoute>
  );
}

function RideStatusContent() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { user, showToast } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isDriverUser = (user?.role || '').toUpperCase() === 'DRIVER';

  const fetchRide = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ridesAPI.getRideById(id);
      setRide(data);
    } catch (err) {
      console.error('Error fetching ride details:', err);
      if (!silent) showToast('Could not load ride details', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRide(false);
    }
  }, [id]);

  // Refresh the ride every 10 seconds for live tracking, until it's over.
  // Pauses while the tab is in the background.
  const rideIsLive = !!id && !!ride && !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(ride.status);
  usePolling(() => fetchRide(true), POLL_MS.liveRide, { enabled: rideIsLive });

  // Live location broadcast — whichever side is viewing this page (rider
  // or driver) shares their own position while the ride is actually
  // underway, so the OTHER side can see it on the map below. This used to
  // only happen from the driver's dashboard, which meant sharing silently
  // stopped the moment a driver navigated to this very page — now it
  // works from wherever the active ride is actually being watched, and
  // works for riders too (previously driver-only). Overwrites the same
  // position every ping, so this never grows storage no matter how long
  // the ride runs.
  useEffect(() => {
    if (!id || !ride) return;
    const isTrackable = ['ACCEPTED', 'STARTED'].includes(ride.status);
    if (!isTrackable || !navigator.geolocation) return;

    const pingLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isDriverUser) {
            driverAPI.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
          } else {
            ridesAPI.updateRiderLocation(id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
          }
        },
        () => {}, // permission denied — silently skip, nothing else to do
        { timeout: 8000, maximumAge: 5000 }
      );
    };

    pingLocation();
    const interval = setInterval(pingLocation, 12000);
    return () => clearInterval(interval);
  }, [id, ride?.status, isDriverUser]);

  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride request?')) return;
    setActionLoading(true);
    try {
      await ridesAPI.cancelRide(id);
      showToast('Ride request cancelled successfully', 'info');
      fetchRide(false);
    } catch (err) {
      showToast(err.message || 'Failed to cancel ride', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRide = async () => {
    setActionLoading(true);
    try {
      await ridesAPI.startRide(id);
      showToast('Ride started successfully!', 'success');
      fetchRide(true);
    } catch (err) {
      showToast(err.message || 'Failed to start ride', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    setActionLoading(true);
    try {
      await ridesAPI.completeRide(id);
      showToast('Ride marked as COMPLETED!', 'success');
      fetchRide(true);
    } catch (err) {
      showToast(err.message || 'Failed to complete ride', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setActionLoading(true);
    try {
      await ridesAPI.markAsPaid(id);
      showToast('Marked as paid!', 'success');
      fetchRide(true);
    } catch (err) {
      showToast(err.message || 'Failed to mark as paid', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
        <p className="text-sm font-medium text-ink-900/55">Fetching live ride status...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-brand-navy">Ride Not Found</h2>
        <p className="text-sm text-ink-900/50">The requested ride ID could not be located.</p>
        <Button onClick={() => router.back()} variant="primary" size="sm">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-navy hover:text-brand-orange transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs font-mono font-bold text-ink-900/50">Ride #{ride.id}</span>
      </div>

      {/* Main Status Container */}
      <Card className="p-6 sm:p-8 space-y-8">
        <div className="border-b border-black/5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-navy">Live PillionGo Tracking</h1>
            <p className="text-xs text-ink-900/50">Commute Route & Status Progress</p>
          </div>
          <StatusBadge status={ride.status} size="lg" />
        </div>

        {/* STEPPER PROGRESS BAR */}
        <StatusProgress status={ride.status} />

        {/* RIDE DETAILS CARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/[0.03] p-6 rounded-2xl border border-black/5">
          {/* Route Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-orange" /> Route & Timing
            </h3>
            <div className="space-y-3 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-black/10">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="text-[11px] text-ink-900/35 font-semibold uppercase">Pickup From</p>
                  <p className="font-extrabold text-brand-navy text-sm">{ride.fromLocation}</p>
                </div>
              </div>

              <div className="h-4 border-l-2 border-dashed border-black/15 ml-1.5" />

              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-brand-orange mt-1 shrink-0" />
                <div>
                  <p className="text-[11px] text-ink-900/35 font-semibold uppercase">Drop-off To</p>
                  <p className="font-extrabold text-brand-navy text-sm">{ride.toLocation}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-ink-900/55 bg-white/70 backdrop-blur-md p-3 rounded-xl border border-black/10">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-ink-900/35" /> Scheduled Time:
              </span>
              <span className="font-bold text-brand-navy">
                {new Date(
                  ride.scheduledDate && ride.scheduledTime
                    ? ride.scheduledDate + ' ' + ride.scheduledTime
                    : ride.createdAt
                ).toLocaleString([], {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          {/* People & Vehicle Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              {ride.vehicleType === 'Car' ? (
                <Car className="w-4 h-4 text-brand-orange" />
              ) : (
                <Bike className="w-4 h-4 text-brand-orange" />
              )} Driver & Vehicle Information
            </h3>

            <div className="space-y-3 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-black/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-900/50 font-semibold">Rider Name:</span>
                <span className="font-bold text-brand-navy">{ride.riderName || 'Commuter'}</span>
              </div>

              {ride.riderPhone ? (
                <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Rider Phone:
                  </span>
                  <a
                    href={`tel:${ride.riderPhone}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm transition-all text-xs"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{ride.riderPhone}</span>
                  </a>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span className="text-ink-900/50 font-semibold">Driver Name:</span>
                <span className="font-bold text-brand-navy">
                  {ride.driverName || (ride.status === 'REQUESTED' ? 'Searching driver...' : 'No driver assigned')}
                </span>
              </div>

              {ride.driverPhone ? (
                <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Driver Phone:
                  </span>
                  <a
                    href={`tel:${ride.driverPhone}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm transition-all text-xs"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{ride.driverPhone}</span>
                  </a>
                </div>
              ) : ride.status === 'REQUESTED' ? (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                  🔒 Phone contact will be revealed here automatically once a driver accepts this ride.
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span className="text-ink-900/50 font-semibold">Vehicle Type & Model:</span>
                <span className="font-bold text-brand-orange">
                  {ride.vehicleType || 'Bike'} - {ride.vehicleModel || 'Standard'} ({ride.vehiclePlate || 'N/A'})
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-black/5 pt-2">
                <span className="text-ink-900/50 font-semibold">Total Fare:</span>
                <span className="flex items-center gap-2">
                  <span className="text-lg font-black text-brand-orange">₹{ride.fare || 45}</span>
                  {ride.seatCount > 1 && (
                    <span className="ml-2 text-xs font-semibold text-ink-900/50">({ride.seatCount} seats)</span>
                  )}
                  {ride.paid && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                  )}
                </span>
              </div>

              {['STARTED', 'COMPLETED'].includes(ride.status) && !ride.paid && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  isLoading={actionLoading}
                  onClick={handleMarkAsPaid}
                  icon={IndianRupee}
                >
                  Mark Fare as Paid (Cash)
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* LIVE LOCATION — cash-settled between rider/driver in person;
            this is just "where is the other person right now", shown once
            the ride is actually underway. Each side sees the OTHER
            party's position: a driver sees the rider (to find the
            pickup), a rider sees the driver (to track their ride) — and
            both are quietly broadcasting their own position back, the
            useEffect above. */}
        {['ACCEPTED', 'STARTED'].includes(ride.status) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-brand-orange" /> {isDriverUser ? 'Live Rider Location' : 'Live Driver Location'}
            </h3>
            <LiveDriverMap
              lat={isDriverUser ? ride.riderLat : ride.driverLat}
              lng={isDriverUser ? ride.riderLng : ride.driverLng}
              updatedAt={isDriverUser ? ride.riderLocationUpdatedAt : ride.driverLocationUpdatedAt}
              driverName={isDriverUser ? ride.riderName : ride.driverName}
              vehicleLabel={isDriverUser ? null : ride.vehicleModel}
              role={isDriverUser ? 'rider' : 'driver'}
            />
            <p className="text-[10px] text-ink-900/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              You're sharing your live location with {isDriverUser ? 'the rider' : 'the driver'} on this ride — just keep this page open
              (if your browser asks, allow location access).
            </p>
          </div>
        )}

        {/* REAL STAGE ACTIONS */}
        {ride.status === 'ACCEPTED' && (
          <Alert
            variant="success"
            title="Driver has accepted the ride!"
            action={
              <Button variant="emerald" size="sm" isLoading={actionLoading} onClick={handleStartRide} icon={CheckCircle2}>
                Start Ride
              </Button>
            }
          >
            Rider must click "Start Ride" when meeting the driver.
          </Alert>
        )}

        {ride.status === 'STARTED' && (
          <Alert
            variant="info"
            title="Ride is currently in progress!"
            action={
              <Button variant="emerald" size="sm" isLoading={actionLoading} onClick={handleCompleteRide} icon={CheckCircle2}>
                Complete Ride
              </Button>
            }
          >
            Driver can complete the trip once arrived at destination.
          </Alert>
        )}

        {/* Cancel / SOS */}
        {(['REQUESTED', 'ACCEPTED'].includes(ride.status) || ['ACCEPTED', 'STARTED'].includes(ride.status)) && (
          <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {['ACCEPTED', 'STARTED'].includes(ride.status) ? (
              <SosButton rideId={ride.id} />
            ) : (
              <span />
            )}

            {['REQUESTED', 'ACCEPTED'].includes(ride.status) && (
              <Button
                variant="destructive"
                size="sm"
                isLoading={actionLoading}
                onClick={handleCancelRide}
                icon={XCircle}
              >
                Cancel Ride Request
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
