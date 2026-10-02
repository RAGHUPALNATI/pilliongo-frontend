'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ridesAPI, vehicleAPI, locationAPI, LOCATIONS } from '@/lib/api';
import { usePolling, POLL_MS } from '@/hooks/usePolling';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Select, Input, Textarea } from '@/components/Input';
import LocationSelect from '@/components/LocationSelect';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import FareEstimate from '@/components/FareEstimate';
import EmptyState from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Bike,
  Car,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  Plus,
  CheckCircle2,
  Sparkles,
  User,
  MessageSquare,
  Zap,
  X,
  Phone,
} from 'lucide-react';

export default function PlanRidePage() {
  const { user, isAuthenticated, showToast } = useAuth();
  const router = useRouter();

  // Top-level: Instant (right now) vs Pre-Planned (scheduled days ahead).
  // Instant defaults first — it's the fastest way to get moving, and
  // showing it front and center is what actually makes this page the
  // single home for ride requests instead of splitting them across the
  // dashboards.
  const [topTab, setTopTab] = useState('INSTANT'); // 'INSTANT' | 'PLANNED'

  const isDriverUser = (user?.role || '').toUpperCase() === 'DRIVER';

  const [allLocations, setAllLocations] = useState(LOCATIONS);
  useEffect(() => {
    locationAPI.getAll().then(setAllLocations).catch(() => {});
  }, []);

  // A driver's own vehicles — required to post either kind of offer.
  const [myVehicles, setMyVehicles] = useState([]);
  const loadMyVehicles = async () => {
    try {
      const list = await vehicleAPI.getMyVehicles();
      setMyVehicles(list);
      return list;
    } catch (err) {
      console.error('Error loading vehicles:', err);
      return [];
    }
  };
  useEffect(() => {
    if (isDriverUser) loadMyVehicles();
  }, [isDriverUser]);

  // Native <select>s only fire onChange when the user actually changes the
  // selection — with just one vehicle on file, the browser shows it
  // pre-selected but React's state never hears about it, so "vehicleId"
  // stays empty and the submit guard below fires even though a vehicle is
  // visibly chosen. Pre-fill both offer forms with the driver's primary
  // (or first) vehicle as soon as the list loads, without clobbering a
  // choice the driver already made.
  useEffect(() => {
    if (myVehicles.length === 0) return;
    const defaultVehicle = myVehicles.find((v) => v.primaryVehicle) || myVehicles[0];
    setInstantOfferForm((prev) => (prev.vehicleId ? prev : { ...prev, vehicleId: String(defaultVehicle.id) }));
    setOfferForm((prev) => (prev.vehicleId ? prev : { ...prev, vehicleId: String(defaultVehicle.id) }));
  }, [myVehicles]);

  /* =========================================================
     INSTANT TAB — driver posts a "driving right now" offer, or
     rider requests an instant departure / books a live driver offer.
     ========================================================= */
  const [instantOfferForm, setInstantOfferForm] = useState({
    fromLocation: 'LPU University Main Gate',
    toLocation: 'Rama Mandi',
    notes: '',
    vehicleId: '',
  });
  const [postingInstantOffer, setPostingInstantOffer] = useState(false);
  const [cancellingOfferId, setCancellingOfferId] = useState(null);
  const [myDriverHistory, setMyDriverHistory] = useState([]);

  const [instantRequestForm, setInstantRequestForm] = useState({
    fromLocation: 'LPU University Main Gate',
    toLocation: 'Rama Mandi',
    preferredVehicle: 'Any',
    passengers: 1,
  });
  const [requestingInstant, setRequestingInstant] = useState(false);
  const [myActiveInstantRide, setMyActiveInstantRide] = useState(null);
  const [instantOffers, setInstantOffers] = useState([]);
  const [bookingOfferId, setBookingOfferId] = useState(null);

  const loadInstantData = async () => {
    try {
      if (isDriverUser) {
        const history = await ridesAPI.getRideHistory();
        setMyDriverHistory(history);
      } else if (isAuthenticated) {
        const history = await ridesAPI.getRideHistory();
        const active = history.find(
          (r) => r.rideType === 'INSTANT' && ['REQUESTED', 'ACCEPTED', 'STARTED'].includes(r.status)
        );
        setMyActiveInstantRide(active || null);

        const offers = await ridesAPI.getInstantOffers();
        setInstantOffers(offers);
      } else {
        const offers = await ridesAPI.getInstantOffers();
        setInstantOffers(offers);
      }
    } catch (err) {
      console.error('Error loading instant ride data:', err);
    }
  };

  useEffect(() => {
    if (topTab !== 'INSTANT') return;
    loadInstantData();
  }, [topTab, isDriverUser, isAuthenticated]);

  // Keep the instant board fresh, only while the Instant tab is open and
  // this browser tab is visible.
  usePolling(loadInstantData, POLL_MS.dashboard, { enabled: topTab === 'INSTANT' });

  // A driver-posted instant offer that's still waiting for a rider to book it
  const myLiveInstantOffer = myDriverHistory.find(
    (r) => r.rideType === 'INSTANT' && r.status === 'REQUESTED' && !r.riderName
  );

  const instantOfferToOptions = allLocations.filter((loc) => loc !== instantOfferForm.fromLocation);
  const instantRequestToOptions = allLocations.filter((loc) => loc !== instantRequestForm.fromLocation);

  const handlePostInstantOffer = async (e) => {
    e.preventDefault();
    if (myLiveInstantOffer) {
      showToast('You already have a live instant offer posted.', 'error');
      return;
    }
    if (instantOfferForm.fromLocation === instantOfferForm.toLocation) {
      showToast('Pickup and destination cannot be the same location', 'error');
      return;
    }
    if (!instantOfferForm.vehicleId) {
      showToast("Please select which vehicle you're using for this ride", 'error');
      return;
    }

    setPostingInstantOffer(true);
    try {
      await ridesAPI.offerInstantRide(instantOfferForm);
      showToast('Instant ride offer posted! Riders can book it now (auto-expires in 15 mins).', 'success');
      loadInstantData();
    } catch (err) {
      showToast(err.message || 'Failed to post instant ride offer', 'error');
    } finally {
      setPostingInstantOffer(false);
    }
  };

  const handleCancelInstantOffer = async (id) => {
    setCancellingOfferId(id);
    try {
      await ridesAPI.cancelRide(id);
      showToast('Instant ride offer cancelled.', 'info');
      loadInstantData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel offer', 'error');
    } finally {
      setCancellingOfferId(null);
    }
  };

  const handleRequestInstantRide = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to request an instant ride', 'error');
      router.push('/login?role=Rider');
      return;
    }
    if (myActiveInstantRide) {
      showToast(`You already have an active instant ride (#${myActiveInstantRide.id}) — manage it from your Dashboard.`, 'error');
      return;
    }
    if (instantRequestForm.fromLocation === instantRequestForm.toLocation) {
      showToast('Pickup and drop-off cannot be the same location', 'error');
      return;
    }

    setRequestingInstant(true);
    try {
      await ridesAPI.createRide({
        ...instantRequestForm,
        rideType: 'INSTANT',
        note: 'Instant departure request (auto-expires in 15 mins).',
      });
      showToast('Instant ride request posted! Searching drivers nearby...', 'success');
      router.push('/rider/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to post instant ride request', 'error');
    } finally {
      setRequestingInstant(false);
    }
  };

  const handleBookInstantOffer = async (offer) => {
    if (!isAuthenticated) {
      showToast('Please login to book this ride', 'error');
      router.push('/login?role=Rider');
      return;
    }
    if (isDriverUser) {
      showToast("Drivers can't book other drivers' offers", 'error');
      return;
    }
    if (myActiveInstantRide) {
      showToast(`You already have an active instant ride (#${myActiveInstantRide.id}) — manage it from your Dashboard.`, 'error');
      return;
    }

    setBookingOfferId(offer.id);
    try {
      await ridesAPI.bookDriverOffer(offer.id);
      showToast(`Booked! ${offer.driverName || 'A driver'} is heading your way.`, 'success');
      router.push('/rider/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to book this ride', 'error');
    } finally {
      setBookingOfferId(null);
    }
  };

  const getOfferMinutesLeft = (offer) => {
    const expiry = offer.expiresAt
      ? new Date(offer.expiresAt).getTime()
      : offer.createdAt
      ? new Date(offer.createdAt).getTime() + 15 * 60 * 1000
      : null;
    if (!expiry) return null;
    const diffMs = expiry - Date.now();
    return diffMs > 0 ? Math.ceil(diffMs / 60000) : 0;
  };

  const formatPostedAgo = (createdAt) => {
    if (!createdAt) return 'just now';
    const diffMin = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diffMin <= 0) return 'just now';
    if (diffMin === 1) return '1 min ago';
    return `${diffMin} mins ago`;
  };

  /* =========================================================
     PRE-PLANNED TAB — existing scheduled-route marketplace.
     ========================================================= */
  const [fromLocation, setFromLocation] = useState('LPU University Main Gate');
  const [toLocation, setToLocation] = useState('Jalandhar City');
  const [departureDate, setDepartureDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const [plannedRoutes, setPlannedRoutes] = useState([]);
  const [riderRequests, setRiderRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OFFERS'); // 'OFFERS' (Driver offers) or 'REQUESTS' (Rider requests)

  const [showDriverOfferModal, setShowDriverOfferModal] = useState(false);
  const [showRiderReqModal, setShowRiderReqModal] = useState(false);

  const [offerForm, setOfferForm] = useState({
    fromLocation: 'LPU University Main Gate',
    toLocation: 'Jalandhar City',
    departureDate: '',
    time: '09:30',
    seatsAvailable: 3,
    notes: '',
    vehicleId: '',
  });

  const selectedOfferVehicle = myVehicles.find((v) => String(v.id) === String(offerForm.vehicleId));
  const selectedOfferVehicleIsBike = (selectedOfferVehicle?.vehicleType || '').toLowerCase() === 'bike';

  const [riderReqForm, setRiderReqForm] = useState({
    fromLocation: 'LPU University Main Gate',
    toLocation: 'Jalandhar City',
    departureDate: '',
    time: '09:30',
    passengers: 1,
    preferredVehicle: 'Any',
    notes: '',
  });

  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const nextMon = new Date();
    nextMon.setDate(nextMon.getDate() + ((1 + 7 - nextMon.getDay()) % 7 || 7));
    const formatted = nextMon.toISOString().slice(0, 10);
    setDepartureDate(formatted);
    setOfferForm((prev) => ({ ...prev, departureDate: formatted }));
    setRiderReqForm((prev) => ({ ...prev, departureDate: formatted }));
  }, []);

  const loadPlannedData = async () => {
    setLoading(true);
    try {
      const allPlanned = await ridesAPI.getPlannedRoutes();
      const driverOffers = allPlanned.filter((r) => r.driverName);
      const riderReqs = allPlanned.filter((r) => r.riderName && !r.driverName);
      setPlannedRoutes(driverOffers);
      setRiderRequests(riderReqs);
    } catch (err) {
      console.error('Error fetching plan-ride data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlannedData();
  }, []);

  const availableToOptions = allLocations.filter((loc) => loc !== fromLocation);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (fromLocation === toLocation) {
      showToast('Pickup and destination cannot be the same location', 'error');
      return;
    }
    showToast(`Searching pre-planned routes from ${fromLocation} to ${toLocation}`, 'info');
  };

  const handleBookSeat = async (routeOffer) => {
    if (!isAuthenticated) {
      showToast('Please login to book a scheduled carpool seat', 'error');
      router.push('/login?role=Rider');
      return;
    }
    if (isDriverUser) {
      showToast("Drivers can't book seats on other drivers' offers", 'error');
      return;
    }

    try {
      const seats = Math.min(passengers, routeOffer.seatsAvailable || 1);
      await ridesAPI.bookDriverOffer(routeOffer.id, seats);
      showToast(
        `${seats > 1 ? `${seats} seats` : 'Seat'} booked! You joined ${routeOffer.driverName || 'Driver'}'s route offer.`,
        'success'
      );
      router.push('/rider/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to book seat', 'error');
    }
  };

  const handleOfferRideToRider = async (riderReq) => {
    if (!isAuthenticated || !isDriverUser) {
      showToast('Only registered drivers can offer rides to passenger requests', 'error');
      router.push('/login?role=Driver');
      return;
    }

    try {
      await ridesAPI.acceptRide(riderReq.id);
      showToast(`Accepted ride request from ${riderReq.riderName || 'Rider'}!`, 'success');
      router.push('/driver/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to offer ride', 'error');
    }
  };

  const handlePublishDriverOffer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !isDriverUser) {
      showToast('Only registered drivers can publish route offers', 'error');
      return;
    }
    if (!offerForm.vehicleId) {
      showToast("Please select which vehicle you're using for this ride", 'error');
      return;
    }

    setPublishing(true);
    try {
      await ridesAPI.publishPlannedRoute(offerForm);
      showToast('Pre-planned driver offer published successfully!', 'success');
      setShowDriverOfferModal(false);
      loadPlannedData();
    } catch (err) {
      showToast(err.message || 'Failed to publish offer', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishRiderReq = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to post a pre-planned route request', 'error');
      router.push('/login?role=Rider');
      return;
    }
    if (isDriverUser) {
      showToast('Drivers cannot post rider requests. Drivers can only offer planned route trips.', 'error');
      setShowRiderReqModal(false);
      return;
    }

    setPublishing(true);
    try {
      await ridesAPI.publishRiderPlannedRequest(riderReqForm);
      showToast('Pre-planned passenger request posted! Drivers will see your request.', 'success');
      setShowRiderReqModal(false);
      loadPlannedData();
    } catch (err) {
      showToast(err.message || 'Failed to post request', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* HERO BANNER */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-ink-900 via-ink-950 to-ink-950 text-white">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-140px] left-[-100px] w-[380px] h-[380px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand-orange" /> Instant Rides & Pre-Planned Routes
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Travel anywhere together. <br />
                <span className="text-brand-orange">Spend smarter.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300">
                Need a ride right now? Or planning days ahead? Everything lives here — riders and drivers, instant or scheduled.
              </p>
            </div>
          </div>

          {/* TOP-LEVEL TAB SWITCHER */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
            <button
              onClick={() => setTopTab('INSTANT')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                topTab === 'INSTANT' ? 'bg-brand-orange text-white shadow-glow-brand' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" /> Instant (Now)
            </button>
            <button
              onClick={() => setTopTab('PLANNED')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                topTab === 'PLANNED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> Pre-Planned (Scheduled)
            </button>
          </div>

          {topTab === 'PLANNED' && (
            <>
              <div className="flex justify-end">
                {!isDriverUser && (
                  <Button variant="primary" size="md" icon={Plus} onClick={() => setShowRiderReqModal(true)}>
                    Rider: Request Scheduled Route
                  </Button>
                )}
                {isDriverUser && (
                  <Button variant="emerald" size="md" icon={Plus} onClick={() => setShowDriverOfferModal(true)}>
                    Driver: Offer Route Trip
                  </Button>
                )}
              </div>

              <Card className="p-4 sm:p-6">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <Select
                    label="From"
                    icon={MapPin}
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    options={allLocations.map((loc) => ({ value: loc, label: loc }))}
                  />
                  <Select
                    label="To"
                    icon={MapPin}
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    options={availableToOptions.map((loc) => ({ value: loc, label: loc }))}
                  />
                  <Input
                    label="Departure Date"
                    icon={Calendar}
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                  <Select
                    label="Passengers"
                    icon={Users}
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    options={[
                      { value: 1, label: '1 Passenger' },
                      { value: 2, label: '2 Passengers' },
                      { value: 3, label: '3 Passengers' },
                    ]}
                  />
                  <Button type="submit" variant="primary" size="lg" className="w-full" icon={Search}>
                    Search Scheduled Rides
                  </Button>
                </form>
              </Card>
            </>
          )}
        </div>
      </section>

      {topTab === 'INSTANT' ? (
        /* =====================================================
           INSTANT TAB CONTENT
           ===================================================== */
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {isDriverUser ? (
            /* --- DRIVER: post an instant offer, or manage the live one --- */
            myLiveInstantOffer ? (
              <Card className="overflow-hidden ring-1 ring-brand-orange/25">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5720B] to-brand-orange flex items-center justify-center font-bold text-white shadow-glow-brand">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-brand-navy">Your Instant Offer Is Live</h3>
                        <StatusBadge status="REQUESTED" size="sm" />
                      </div>
                      <p className="text-xs text-ink-900/50">Visible to riders now — auto-expires in 15 minutes if nobody books it.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-brand-navy">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs">{myLiveInstantOffer.fromLocation}</span>
                    <ArrowRight className="w-4 h-4 text-brand-orange shrink-0" />
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">{myLiveInstantOffer.toLocation}</span>
                    <span className="text-brand-orange font-extrabold">₹{myLiveInstantOffer.fare}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    isLoading={cancellingOfferId === myLiveInstantOffer.id}
                    onClick={() => handleCancelInstantOffer(myLiveInstantOffer.id)}
                    icon={X}
                  >
                    Cancel Offer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-brand-orange" /> Post Instant Ride Offer
                  </CardTitle>
                  <CardDescription>Tell riders you're driving this route right now. Live for 15 minutes, or until someone books it.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePostInstantOffer} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <LocationSelect
                        label="From"
                        icon={MapPin}
                        value={instantOfferForm.fromLocation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInstantOfferForm((prev) => ({
                            ...prev,
                            fromLocation: val,
                            toLocation: prev.toLocation === val ? (allLocations.find((l) => l !== val) || prev.toLocation) : prev.toLocation,
                          }));
                        }}
                        options={allLocations.map((loc) => ({ value: loc, label: loc }))}
                      />
                      <LocationSelect
                        label="To"
                        icon={MapPin}
                        value={instantOfferForm.toLocation}
                        onChange={(e) => setInstantOfferForm((prev) => ({ ...prev, toLocation: e.target.value }))}
                        options={instantOfferToOptions.map((loc) => ({ value: loc, label: loc }))}
                      />
                    </div>
                    <div className="flex justify-center -mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInstantOfferForm((prev) => ({ ...prev, fromLocation: prev.toLocation, toLocation: prev.fromLocation }))
                        }
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-brand-orange/80 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full px-3 py-1.5 transition-colors"
                        title="Swap pickup and drop-off"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
                      </button>
                    </div>

                    {myVehicles.length > 0 ? (
                      <Select
                        label="Vehicle for this ride"
                        icon={Bike}
                        value={instantOfferForm.vehicleId}
                        onChange={(e) => setInstantOfferForm((prev) => ({ ...prev, vehicleId: e.target.value }))}
                        options={myVehicles.map((v) => ({
                          value: String(v.id),
                          label: `${v.vehicleType} — ${v.vehicleModel} (${v.vehiclePlate})`,
                        }))}
                      />
                    ) : (
                      <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                        You don't have any vehicles on file yet. Add one from your profile before posting an offer.
                      </p>
                    )}

                    <Textarea
                      label="Notes (optional)"
                      rows={2}
                      placeholder="e.g. Leaving in 5 minutes, space for 1 passenger."
                      value={instantOfferForm.notes}
                      onChange={(e) => setInstantOfferForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />

                    <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={postingInstantOffer} icon={CheckCircle2}>
                      Post Instant Offer Now
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )
          ) : (
            /* --- RIDER: request an instant ride, or see the active one --- */
            <>
              {myActiveInstantRide && (
                <Alert variant="lock" title={`Active Instant Ride #${myActiveInstantRide.id}`}>
                  You already have an active instant ride in progress ({myActiveInstantRide.status}).{' '}
                  <Link href="/rider/dashboard" className="font-bold underline">
                    Manage it from your Dashboard
                  </Link>
                  .
                </Alert>
              )}

              <Card className={myActiveInstantRide ? 'opacity-60 pointer-events-none max-w-2xl' : 'max-w-2xl'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-brand-orange" /> Request Instant Departure (Now)
                  </CardTitle>
                  <CardDescription>Depart immediately! Auto-expires in 15 mins if no driver accepts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRequestInstantRide} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <LocationSelect
                        label="Pickup Location (From)"
                        icon={MapPin}
                        value={instantRequestForm.fromLocation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInstantRequestForm((prev) => ({
                            ...prev,
                            fromLocation: val,
                            toLocation: prev.toLocation === val ? (allLocations.find((l) => l !== val) || prev.toLocation) : prev.toLocation,
                          }));
                        }}
                        options={allLocations.map((loc) => ({ value: loc, label: loc }))}
                      />
                      <LocationSelect
                        label="Drop-off Location (To)"
                        icon={MapPin}
                        value={instantRequestForm.toLocation}
                        onChange={(e) => setInstantRequestForm((prev) => ({ ...prev, toLocation: e.target.value }))}
                        options={instantRequestToOptions.map((loc) => ({ value: loc, label: loc }))}
                      />
                    </div>
                    <div className="flex justify-center -mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInstantRequestForm((prev) => ({ ...prev, fromLocation: prev.toLocation, toLocation: prev.fromLocation }))
                        }
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-brand-orange/80 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full px-3 py-1.5 transition-colors"
                        title="Swap pickup and drop-off"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Select
                        label="Vehicle Type Preference"
                        value={instantRequestForm.preferredVehicle}
                        onChange={(e) => setInstantRequestForm((prev) => ({ ...prev, preferredVehicle: e.target.value }))}
                        options={[
                          { value: 'Any', label: 'Any Vehicle (Bike or Car)' },
                          { value: 'Bike', label: 'Bike Only 🏍️' },
                          { value: 'Car', label: 'Car Only 🚗' },
                        ]}
                      />
                    </div>

                    <FareEstimate from={instantRequestForm.fromLocation} to={instantRequestForm.toLocation} />

                    <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={requestingInstant} icon={ArrowRight}>
                      Request Instant Ride Now
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Drivers Available Right Now */}
              {instantOffers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-brand-orange" /> Drivers Available Right Now
                    </CardTitle>
                    <CardDescription>These drivers are already on the road — book one directly instead of waiting for a match.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {instantOffers.map((offer) => {
                      const minutesLeft = getOfferMinutesLeft(offer);
                      return (
                        <div
                          key={offer.id}
                          className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-black/10 shadow-glass-sm space-y-4 hover:border-brand-orange/40 hover:shadow-glass transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {offer.driverName ? offer.driverName.charAt(0) : 'D'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-brand-navy truncate">{offer.driverName || 'Driver'}</h4>
                                <p className="text-[11px] text-ink-900/45 flex items-center gap-1">
                                  {offer.vehicleType === 'Car' ? (
                                    <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Bike className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                                  )}
                                  <span className="truncate">{offer.vehicleType || 'Vehicle'} • {offer.vehicleModel || 'Standard'}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-extrabold text-brand-orange block">₹{offer.fare}</span>
                              {minutesLeft !== null && (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${minutesLeft <= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                                  <Clock className="w-3 h-3" /> {minutesLeft > 0 ? `${minutesLeft}m left` : 'Expiring'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="bg-black/[0.03] p-3.5 rounded-lg border border-black/5 space-y-2 text-xs">
                            <div className="flex items-center justify-between font-semibold text-brand-navy">
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {offer.fromLocation}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-brand-orange" /> {offer.toLocation}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-ink-900/50 border-t border-black/5 pt-1.5">
                              <span>Plate: <strong className="text-brand-navy font-mono">{offer.vehicleNumber || offer.vehiclePlate || 'N/A'}</strong></span>
                              <span>Posted {formatPostedAgo(offer.createdAt)}</span>
                            </div>
                            {offer.description && (
                              <p className="text-[11px] text-ink-900/50 italic border-t border-black/5 pt-1.5">"{offer.description}"</p>
                            )}
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            isLoading={bookingOfferId === offer.id}
                            onClick={() => handleBookInstantOffer(offer)}
                            icon={CheckCircle2}
                          >
                            Book This Ride
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>
      ) : (
        /* =====================================================
           PRE-PLANNED TAB CONTENT
           ===================================================== */
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" /> Pre-Planned Route Marketplace
              </h2>
              <p className="text-xs text-ink-900/50">Browse driver offers or passenger route requests</p>
            </div>

            <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-xl">
              <button
                onClick={() => setActiveTab('OFFERS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'OFFERS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>🚗 Driver Offers ({plannedRoutes.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('REQUESTS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'REQUESTS' ? 'bg-brand-orange text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>🎒 Rider Requests ({riderRequests.length})</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} lines={4} />
              ))}
            </div>
          ) : activeTab === 'OFFERS' ? (
            plannedRoutes.length === 0 ? (
              <Card>
                <EmptyState icon={Car} title="No driver route offers published yet" description="Drivers will post their upcoming carpool routes here." />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plannedRoutes.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-black/10 shadow-glass-sm space-y-5 hover:shadow-glass hover:border-brand-orange/40 transition-all relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-base">
                          {offer.driverName ? offer.driverName.charAt(0) : 'D'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-brand-navy">{offer.driverName}</h4>
                          <p className="text-xs text-ink-900/50 flex items-center gap-1">
                            {offer.vehicleType === 'Car' ? (
                              <Car className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Bike className="w-3.5 h-3.5 text-brand-orange" />
                            )}
                            <span>{offer.vehicleModel} ({offer.vehicleNumber})</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-brand-orange">₹{offer.farePerSeat}</span>
                        <p className="text-[10px] text-ink-900/35 font-semibold">per seat</p>
                      </div>
                    </div>

                    <div className="bg-black/[0.03] p-4 rounded-xl border border-black/5 space-y-3">
                      <div className="flex items-center justify-between font-bold text-sm text-brand-navy">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-500" /> {offer.fromLocation}</span>
                        <ArrowRight className="w-4 h-4 text-brand-orange shrink-0" />
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-orange" /> {offer.toLocation}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-ink-900/55 border-t border-black/5 pt-2">
                        <span className="flex items-center gap-1 font-semibold text-brand-navy">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {new Date(offer.departureDate).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })} at {offer.time}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {offer.seatsAvailable} of {offer.seatsTotal} seat{offer.seatsTotal !== 1 ? 's' : ''} left
                        </span>
                      </div>
                      {offer.notes && (
                        <p className="text-[11px] text-ink-900/55 italic bg-white/70 p-2 rounded border border-black/5">"{offer.notes}"</p>
                      )}
                    </div>

                    {isDriverUser ? (
                      <p className="text-[11px] text-center text-ink-900/40 font-semibold bg-black/[0.03] rounded-lg py-2.5">
                        Drivers can't book seats on other drivers' offers
                      </p>
                    ) : passengers > offer.seatsAvailable ? (
                      <p className="text-[11px] text-center text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg py-2.5">
                        Only {offer.seatsAvailable} seat{offer.seatsAvailable !== 1 ? 's' : ''} left — you searched for {passengers}
                      </p>
                    ) : (
                      <Button variant="primary" size="md" className="w-full" onClick={() => handleBookSeat(offer)} icon={ArrowRight}>
                        {passengers > 1
                          ? `Book ${passengers} Seats for ₹${Math.round(offer.farePerSeat * passengers)}`
                          : `Book Seat for ₹${offer.farePerSeat}`}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : riderRequests.length === 0 ? (
            <Card>
              <EmptyState icon={User} title="No rider route requests posted yet" description="Riders will post their requested scheduled routes here." />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riderRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-black/10 shadow-glass-sm space-y-5 hover:shadow-glass hover:border-brand-orange/40 transition-all relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5720B] to-brand-orange text-white flex items-center justify-center font-bold text-base shadow-glow-brand">
                        {req.riderName ? req.riderName.charAt(0) : 'R'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-brand-navy">{req.riderName}</h4>
                        <p className="text-xs text-ink-900/50">Passenger looking for ride</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-600">₹{req.budgetFare}</span>
                      <p className="text-[10px] text-ink-900/35 font-semibold">fare</p>
                    </div>
                  </div>

                  <div className="bg-black/[0.03] p-4 rounded-xl border border-black/5 space-y-3">
                    <div className="flex items-center justify-between font-bold text-sm text-brand-navy">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-500" /> {req.fromLocation}</span>
                      <ArrowRight className="w-4 h-4 text-brand-orange shrink-0" />
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-orange" /> {req.toLocation}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-900/55 border-t border-black/5 pt-2">
                      <span className="flex items-center gap-1 font-semibold text-brand-navy">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {new Date(req.departureDate).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })} at {req.time}
                      </span>
                      <span className="font-bold text-brand-navy bg-black/5 px-2 py-0.5 rounded">Pref: {req.preferredVehicle || 'Any'}</span>
                    </div>
                    {req.notes && (
                      <p className="text-[11px] text-ink-900/55 italic bg-white/70 p-2 rounded border border-black/5">"{req.notes}"</p>
                    )}
                  </div>

                  {isDriverUser ? (
                    <Button variant="emerald" size="md" className="w-full" onClick={() => handleOfferRideToRider(req)} icon={MessageSquare}>
                      Offer Ride to {req.riderName} ("Hey I'm going there!")
                    </Button>
                  ) : (
                    <p className="text-[11px] text-center text-ink-900/40 font-semibold bg-black/[0.03] rounded-lg py-2.5">
                      Only drivers can offer a ride for this request
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* RIDER POST SCHEDULED REQUEST MODAL */}
      <Modal
        isOpen={showRiderReqModal}
        onClose={() => setShowRiderReqModal(false)}
        title="Post Rider Pre-Planned Request"
        description="Tell drivers where and when you need a ride."
        icon={User}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowRiderReqModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="rider-req-form" variant="primary" size="md" isLoading={publishing} icon={CheckCircle2}>
              Post Pre-Planned Request
            </Button>
          </>
        }
      >
        <form id="rider-req-form" onSubmit={handlePublishRiderReq} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LocationSelect
              label="From Pickup"
              icon={MapPin}
              value={riderReqForm.fromLocation}
              onChange={(e) => setRiderReqForm({ ...riderReqForm, fromLocation: e.target.value })}
              options={allLocations.map((loc) => ({ value: loc, label: loc }))}
            />
            <LocationSelect
              label="To Destination"
              icon={MapPin}
              value={riderReqForm.toLocation}
              onChange={(e) => setRiderReqForm({ ...riderReqForm, toLocation: e.target.value })}
              options={allLocations.filter((l) => l !== riderReqForm.fromLocation).map((loc) => ({ value: loc, label: loc }))}
            />
          </div>
          <div className="flex justify-center -mt-2">
            <button
              type="button"
              onClick={() => setRiderReqForm((prev) => ({ ...prev, fromLocation: prev.toLocation, toLocation: prev.fromLocation }))}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-brand-orange/80 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full px-3 py-1.5 transition-colors"
              title="Swap pickup and drop-off"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Departure Date"
              icon={Calendar}
              type="date"
              required
              value={riderReqForm.departureDate}
              onChange={(e) => setRiderReqForm({ ...riderReqForm, departureDate: e.target.value })}
            />
            <Input
              label="Preferred Time"
              icon={Clock}
              type="time"
              required
              value={riderReqForm.time}
              onChange={(e) => setRiderReqForm({ ...riderReqForm, time: e.target.value })}
            />
          </div>

          <Select
            label="Vehicle Preference"
            icon={Bike}
            value={riderReqForm.preferredVehicle}
            onChange={(e) => setRiderReqForm({ ...riderReqForm, preferredVehicle: e.target.value })}
            options={[
              { value: 'Any', label: 'Any Vehicle (Bike or Car)' },
              { value: 'Bike', label: 'Bike Only 🏍️' },
              { value: 'Car', label: 'Car Only 🚗' },
            ]}
          />

          <FareEstimate from={riderReqForm.fromLocation} to={riderReqForm.toLocation} />

          <Textarea
            label="Request Notes"
            rows={2}
            placeholder="e.g. Going for Monday morning exam at Jalandhar. Will split fuel costs!"
            value={riderReqForm.notes}
            onChange={(e) => setRiderReqForm({ ...riderReqForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* DRIVER OFFER ROUTE MODAL */}
      <Modal
        isOpen={showDriverOfferModal}
        onClose={() => setShowDriverOfferModal(false)}
        title="Publish Pre-Planned Route Offer"
        description="Let riders reserve a seat on your upcoming route."
        icon={Car}
        iconClassName="bg-emerald-500/10 text-emerald-600"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowDriverOfferModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="driver-offer-form" variant="emerald" size="md" isLoading={publishing} icon={CheckCircle2}>
              Publish Route Offer
            </Button>
          </>
        }
      >
        <form id="driver-offer-form" onSubmit={handlePublishDriverOffer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LocationSelect
              label="From Pickup"
              icon={MapPin}
              value={offerForm.fromLocation}
              onChange={(e) => setOfferForm({ ...offerForm, fromLocation: e.target.value })}
              options={allLocations.map((loc) => ({ value: loc, label: loc }))}
            />
            <LocationSelect
              label="To Destination"
              icon={MapPin}
              value={offerForm.toLocation}
              onChange={(e) => setOfferForm({ ...offerForm, toLocation: e.target.value })}
              options={allLocations.filter((l) => l !== offerForm.fromLocation).map((loc) => ({ value: loc, label: loc }))}
            />
          </div>
          <div className="flex justify-center -mt-2">
            <button
              type="button"
              onClick={() => setOfferForm((prev) => ({ ...prev, fromLocation: prev.toLocation, toLocation: prev.fromLocation }))}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-brand-orange/80 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full px-3 py-1.5 transition-colors"
              title="Swap pickup and drop-off"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Departure Date"
              icon={Calendar}
              type="date"
              required
              value={offerForm.departureDate}
              onChange={(e) => setOfferForm({ ...offerForm, departureDate: e.target.value })}
            />
            <Input
              label="Departure Time"
              icon={Clock}
              type="time"
              required
              value={offerForm.time}
              onChange={(e) => setOfferForm({ ...offerForm, time: e.target.value })}
            />
          </div>

          <Input
            label={selectedOfferVehicleIsBike ? 'Available Seats (bikes carry 1 pillion)' : 'Available Seats'}
            type="number"
            min={1}
            max={selectedOfferVehicleIsBike ? 1 : 6}
            required
            disabled={selectedOfferVehicleIsBike}
            value={selectedOfferVehicleIsBike ? 1 : offerForm.seatsAvailable}
            onChange={(e) =>
              setOfferForm({ ...offerForm, seatsAvailable: Math.min(6, Math.max(1, Number(e.target.value) || 1)) })
            }
          />

          {myVehicles.length > 0 ? (
            <Select
              label="Vehicle for this ride"
              icon={Bike}
              value={offerForm.vehicleId}
              onChange={(e) => setOfferForm({ ...offerForm, vehicleId: e.target.value })}
              options={myVehicles.map((v) => ({
                value: String(v.id),
                label: `${v.vehicleType} — ${v.vehicleModel} (${v.vehiclePlate})`,
              }))}
            />
          ) : (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              You don't have any vehicles on file yet. Add one from your profile before publishing an offer.
            </p>
          )}

          <FareEstimate from={offerForm.fromLocation} to={offerForm.toLocation} />

          <Textarea
            label="Trip Notes & Luggage Info"
            rows={2}
            placeholder="e.g. Driving Maruti Swift to Jalandhar. AC car, space for 2 backpacks."
            value={offerForm.notes}
            onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
