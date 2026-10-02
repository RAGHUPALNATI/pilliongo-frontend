'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ridesAPI, driverAPI } from '@/lib/api';
import { usePolling, POLL_MS } from '@/hooks/usePolling';

// Shared data/state/handlers for both driver dashboard pages
// (/driver/dashboard for Instant + /driver/dashboard/planned for Planned).
// Pulled out into one hook so the polling, geolocation broadcast, and
// accept/decline/complete logic only exists in one place — each page just
// picks which slice of the returned data it renders.
export default function useDriverDashboard() {
  const { user, showToast } = useAuth();

  const [isAvailable, setIsAvailable] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [driverHistory, setDriverHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [upcomingPlannedRides, setUpcomingPlannedRides] = useState([]);

  const fetchDriverData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      try {
        const earningsData = await driverAPI.getEarnings();
        if (earningsData && typeof earningsData.available === 'boolean') {
          setIsAvailable(earningsData.available);
        }
      } catch (e) {
        console.error('Error fetching driver status:', e);
      }

      const history = await ridesAPI.getRideHistory();
      setDriverHistory(history);

      // A ride only makes the driver "busy right now" (blocking new
      // accepts/offers) when it's actually happening now or about to:
      //   - STARTED, any type — physically driving someone right now.
      //   - ACCEPTED + INSTANT — accepted, about to start any moment.
      //   - ACCEPTED + PLANNED, but only if its scheduled time is within
      //     the next 2 hours (mirrors the backend's conflict window).
      // An ACCEPTED planned ride scheduled further out is a commitment for
      // later, not a reason to block instant rides right now.
      const mine = (r) => r.driverId === user?.id || !r.driverId || r.driverName === user?.name;
      const now = new Date();

      const isNearTerm = (r) => {
        if (!r.scheduledDate) return false;
        const scheduled = new Date(`${r.scheduledDate}T${r.scheduledTime || '00:00:00'}`);
        const minutesDiff = (scheduled.getTime() - now.getTime()) / 60000;
        return minutesDiff >= 0 && minutesDiff <= 120;
      };

      const active = history.find((r) => {
        if (!mine(r)) return false;
        if (r.status === 'STARTED') return true;
        if (r.status === 'ACCEPTED' && r.rideType === 'INSTANT') return true;
        if (r.status === 'ACCEPTED' && r.rideType === 'PLANNED') return isNearTerm(r);
        return false;
      });
      setActiveRide(active || null);

      // Accepted planned rides that aren't near-term yet — shown as
      // informational upcoming commitments with full details, doesn't
      // block anything until they get close to their scheduled time.
      const upcoming = history.filter(
        (r) => mine(r) && r.status === 'ACCEPTED' && r.rideType === 'PLANNED' && !isNearTerm(r)
      );
      setUpcomingPlannedRides(upcoming);

      const available = await ridesAPI.getAvailableRides();
      setPendingRequests(available);
    } catch (err) {
      console.error('Error fetching driver dashboard data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData(false);
  }, []);

  // Refresh available rides & status every 12 seconds. Pauses while the
  // tab is in the background and refreshes the moment the driver returns.
  usePolling(() => fetchDriverData(true), POLL_MS.dashboard);

  // Live location broadcast — only while actually on an active ride
  // (accepted or in progress), so it never runs idly in the background.
  // Overwrites the same two columns server-side each time, so this never
  // grows storage no matter how long the ride runs.
  useEffect(() => {
    const isTrackable = activeRide && ['ACCEPTED', 'STARTED'].includes(activeRide.status);
    if (!isTrackable || !navigator.geolocation) return;

    const pingLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          driverAPI.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
        },
        () => {}, // permission denied — silently skip, nothing else to do
        { timeout: 8000, maximumAge: 5000 }
      );
    };

    pingLocation();
    const interval = setInterval(pingLocation, 12000);
    return () => clearInterval(interval);
  }, [activeRide?.id, activeRide?.status]);

  const handleAccept = async (id) => {
    if (activeRide) {
      showToast(`You already have an active ride (#${activeRide.id})! Complete it before accepting new requests.`, 'error');
      return;
    }

    setActionLoadingId(id);
    try {
      const updated = await ridesAPI.acceptRide(id);
      showToast('Ride request accepted! Connect with your passenger.', 'success');
      setActiveRide(updated);
      fetchDriverData(true);
    } catch (err) {
      showToast(err.message || 'Failed to accept ride', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = (id) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('Ride request hidden from view', 'info');
  };

  const handleComplete = async (id) => {
    setActionLoadingId(id);
    try {
      const updated = await ridesAPI.completeRide(id);
      showToast(`Ride completed! You earned ₹${updated.fare || 45}.`, 'success');
      setActiveRide(null);
      fetchDriverData(true);
    } catch (err) {
      showToast(err.message || 'Failed to complete ride', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await driverAPI.toggleAvailability(nextState);
      showToast(
        nextState ? 'Status set to Available' : 'Status set to Unavailable',
        nextState ? 'success' : 'info'
      );
      fetchDriverData(true);
    } catch (err) {
      showToast(err.message || 'Failed to update availability', 'error');
    }
  };

  const completedRides = driverHistory.filter((r) => r.status === 'COMPLETED');
  const totalEarnings = completedRides.reduce((sum, r) => sum + (r.fare || 45), 0);

  // Split, not tab-filtered: instant (15-min) and pre-planned requests are
  // computed here so both pages can read whichever slice they need without
  // re-deriving it.
  const instantRequests = pendingRequests.filter((r) => r.rideType === 'INSTANT' || !r.rideType);
  const plannedRequests = pendingRequests.filter((r) => r.rideType === 'PLANNED');

  return {
    user,
    showToast,
    isAvailable,
    toggleAvailability,
    pendingRequests,
    activeRide,
    driverHistory,
    loading,
    actionLoadingId,
    upcomingPlannedRides,
    fetchDriverData,
    handleAccept,
    handleDecline,
    handleComplete,
    completedRides,
    totalEarnings,
    instantRequests,
    plannedRequests,
  };
}
