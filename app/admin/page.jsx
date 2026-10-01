'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, locationAPI, LOCATIONS } from '@/lib/api';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card } from '@/components/Card';
import { Input, Select } from '@/components/Input';
import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import UserProfileModal from '@/components/UserProfileModal';
import {
  ShieldAlert,
  Users,
  Bike,
  Car,
  Navigation,
  IndianRupee,
  Activity,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  MapPin,
  Plus,
  Wallet,
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
  Clock,
  ArrowRight,
  Eye,
  Phone,
} from 'lucide-react';

export default function AdminControllerPage() {
  return (
    <ProtectedRoute allowedRole="Admin">
      <Suspense fallback={null}>
        <AdminControllerContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function AdminControllerContent() {
  const { user, showToast } = useAuth();
  const searchParams = useSearchParams();

  // Deep-linkable tabs (e.g. /admin?tab=support from the Help page) so
  // "go manage this" links can land directly on the right tab instead of
  // just dumping the admin on User Management.
  const initialTab = searchParams.get('tab') || 'users';
  const [activeTab, setActiveTab] = useState(initialTab); // 'users' | 'rides' | 'locations' | 'earnings' | 'support' | 'locationRequests'
  const [stats, setStats] = useState({
    totalUsers: 0,
    riders: 0,
    drivers: 0,
    totalRides: 0,
    activeRides: 0,
    completedRides: 0,
    totalVolume: 0,
    totalDistanceTraveled: 0,
  });

  const [usersList, setUsersList] = useState([]);
  const [ridesList, setRidesList] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [knownLocationsList, setKnownLocationsList] = useState([]);
  const [allLocations, setAllLocations] = useState(LOCATIONS);
  const [locationSearch, setLocationSearch] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [rideFilter, setRideFilter] = useState('ALL');
  const [rideTypeFilter, setRideTypeFilter] = useState('ALL');
  const [rideSearch, setRideSearch] = useState('');

  // Driver Earnings
  const [driverEarnings, setDriverEarnings] = useState([]);

  // Support Inbox
  const [supportMessages, setSupportMessages] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({}); // { [messageId]: draftText }

  // Location Requests
  const [locationRequests, setLocationRequests] = useState([]);
  const [fareDrafts, setFareDrafts] = useState({}); // { [requestId]: overrideFare }
  const [rejectDrafts, setRejectDrafts] = useState({}); // { [requestId]: reasonText }

  // SOS Alerts
  const [sosAlerts, setSosAlerts] = useState([]);

  // Destination Management Form State
  const [newDestFrom, setNewDestFrom] = useState('LPU University Main Gate');
  const [newDestName, setNewDestName] = useState('');
  const [newDestFare, setNewDestFare] = useState('');
  const [editingDest, setEditingDest] = useState(null); // { id, name, fromLocation, fare }

  // All Locations (master list) — rename or delete a place name itself,
  // not just its fare rule. { id, name } while editing inline.
  const [editingKnownLocId, setEditingKnownLocId] = useState(null);
  const [editingKnownLocName, setEditingKnownLocName] = useState('');

  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const systemStats = await adminAPI.getSystemStats();
      if (systemStats) {
        setStats({
          totalUsers: systemStats.totalUsers || 0,
          riders: systemStats.totalRiders ?? systemStats.riders ?? 0,
          drivers: systemStats.totalDrivers ?? systemStats.drivers ?? 0,
          totalRides: systemStats.totalRides || 0,
          activeRides: systemStats.activeRides || 0,
          completedRides: systemStats.completedRides || 0,
          totalVolume: systemStats.totalFareVolume ?? systemStats.totalVolume ?? 0,
          totalDistanceTraveled: systemStats.totalDistanceTraveled ?? 0,
        });
      }

      const allUsers = await adminAPI.getAllUsers();
      setUsersList(Array.isArray(allUsers) ? allUsers : []);

      const allRides = await adminAPI.getAllRides();
      setRidesList(Array.isArray(allRides) ? allRides : []);

      await loadDestinations();
      await loadDriverEarnings();
      await loadSupportMessages();
      await loadLocationRequests();
      await loadSosAlerts();
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDriverEarnings = async () => {
    try {
      const earnings = await adminAPI.getDriverEarnings();
      setDriverEarnings(Array.isArray(earnings) ? earnings : []);
    } catch (err) {
      console.error('Error loading driver earnings:', err);
    }
  };

  const loadSupportMessages = async () => {
    try {
      const msgs = await adminAPI.getSupportMessages();
      setSupportMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Error loading support messages:', err);
    }
  };

  const loadLocationRequests = async () => {
    try {
      const reqs = await adminAPI.getLocationRequests();
      setLocationRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      console.error('Error loading location requests:', err);
    }
  };

  const loadSosAlerts = async () => {
    try {
      const alerts = await adminAPI.getSosAlerts();
      setSosAlerts(Array.isArray(alerts) ? alerts : []);
    } catch (err) {
      console.error('Error loading SOS alerts:', err);
    }
  };

  const handleResolveSosAlert = async (id) => {
    try {
      await adminAPI.resolveSosAlert(id);
      showToast('SOS alert marked as resolved', 'success');
      loadSosAlerts();
    } catch (err) {
      showToast(err.message || 'Failed to resolve SOS alert', 'error');
    }
  };

  const loadDestinations = async () => {
    try {
      const dests = await adminAPI.getDestinations();
      setDestinationsList(Array.isArray(dests) ? dests : []);
    } catch (err) {
      console.error('Error loading destinations:', err);
    }
  };

  const loadKnownLocations = async () => {
    try {
      const locs = await adminAPI.getKnownLocations();
      setKnownLocationsList(Array.isArray(locs) ? locs : []);
    } catch (err) {
      console.error('Error loading known locations:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadKnownLocations();
    locationAPI.getAll().then(setAllLocations).catch(() => {});
  }, []);

  // Handle Toggle User Status (Active vs Suspended via On/Off Toggle Switch)
  const handleToggleUserStatus = async (userId, currentName) => {
    try {
      const updatedUser = await adminAPI.toggleUserStatus(userId);
      showToast(
        `User ${currentName} status changed to ${updatedUser.status}`,
        updatedUser.status === 'Active' ? 'success' : 'info'
      );
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  // Handle Admin Override Ride Status
  const handleOverrideRideStatus = async (rideId, newStatus) => {
    try {
      await adminAPI.overrideRideStatus(rideId, newStatus);
      showToast(`Ride #${rideId} status overridden to ${newStatus}`, 'success');
      loadAdminData();
    } catch (err) {
      showToast('Failed to override ride status', 'error');
    }
  };

  // Destination CRUD Actions
  const refreshLocations = () => {
    locationAPI.getAll().then(setAllLocations).catch(() => {});
  };

  const handleAddDestinationSubmit = async (e) => {
    e.preventDefault();
    if (!newDestFrom.trim() || !newDestName.trim() || !newDestFare) {
      showToast('Please fill in From, destination name, and fare amount', 'error');
      return;
    }
    if (newDestFrom.trim().toLowerCase() === newDestName.trim().toLowerCase()) {
      showToast('From and destination cannot be the same place', 'error');
      return;
    }
    // A duplicate is the exact (name, from) PAIR — a different origin for
    // the same place name is a legitimate separate fixed fare, not a
    // conflict, so only block/redirect on a true exact-pair repeat (which
    // the backend would otherwise reject).
    const existingMatch = destinationsList.find(
      (d) =>
        (d.name || '').trim().toLowerCase() === newDestName.trim().toLowerCase() &&
        (d.fromLocation || '').trim().toLowerCase() === newDestFrom.trim().toLowerCase()
    );
    if (existingMatch) {
      setEditingDest(existingMatch);
      showToast(`'${newDestFrom.trim()} → ${existingMatch.name}' already has a fixed fare (₹${existingMatch.fare}) — edit it below instead of adding a new one.`, 'info');
      return;
    }
    try {
      await adminAPI.addDestination({
        fromLocation: newDestFrom.trim(),
        name: newDestName.trim(),
        fare: parseFloat(newDestFare),
      });
      showToast(`Route '${newDestFrom.trim()} → ${newDestName.trim()}' added successfully!`, 'success');
      setNewDestName('');
      setNewDestFare('');
      loadDestinations();
      refreshLocations();
    } catch (err) {
      showToast(err.message || 'Failed to add destination', 'error');
    }
  };

  const handleUpdateDestinationSubmit = async (e) => {
    e.preventDefault();
    if (!editingDest || !editingDest.name.trim() || !editingDest.fare) return;
    try {
      await adminAPI.updateDestination(editingDest.id, {
        name: editingDest.name.trim(),
        fromLocation: (editingDest.fromLocation || '').trim(),
        fare: parseFloat(editingDest.fare),
      });
      showToast(`Route updated successfully!`, 'success');
      setEditingDest(null);
      loadDestinations();
      refreshLocations();
    } catch (err) {
      showToast(err.message || 'Failed to update destination', 'error');
    }
  };

  // "View profile" — read-only panel so the admin can actually check an
  // account out (contact info, vehicles, ride history, support usage)
  // before deciding it's a real user vs. a throwaway/test one.
  const [viewUserId, setViewUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const handleViewUserClick = (id) => {
    setViewUserId(id);
    setIsProfileModalOpen(true);
  };

  const handleDeleteUserClick = async (id, name) => {
    if (
      !confirm(
        `Permanently delete '${name}'? This deletes their account AND every ride, vehicle, support message, and route request tied to it. This cannot be undone.`
      )
    )
      return;
    try {
      await adminAPI.deleteUser(id);
      showToast(`'${name}' and all their data have been deleted`, 'info');
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleDeleteDestinationClick = async (id, name) => {
    if (!confirm(`Are you sure you want to remove '${name}'?`)) return;
    try {
      await adminAPI.deleteDestination(id);
      showToast(`Destination '${name}' deleted`, 'info');
      loadDestinations();
    } catch (err) {
      showToast(err.message || 'Failed to delete destination', 'error');
    }
  };

  // All Locations (master list) CRUD — this is what actually controls
  // every pickup/destination dropdown in the app. Renaming or deleting a
  // fare rule above does NOT touch this list; this is the place to fix a
  // typo or remove a junk entry so it's gone everywhere, not just from
  // the fare-rules table.
  const handleStartRenameKnownLoc = (loc) => {
    setEditingKnownLocId(loc.id);
    setEditingKnownLocName(loc.name);
  };

  const handleSaveRenameKnownLoc = async (e) => {
    e.preventDefault();
    if (!editingKnownLocName.trim()) return;
    try {
      await adminAPI.renameKnownLocation(editingKnownLocId, editingKnownLocName.trim());
      showToast('Location renamed', 'success');
      setEditingKnownLocId(null);
      setEditingKnownLocName('');
      loadKnownLocations();
      loadDestinations();
      refreshLocations();
    } catch (err) {
      showToast(err.message || 'Failed to rename location', 'error');
    }
  };

  const handleDeleteKnownLoc = async (id, name) => {
    if (
      !confirm(
        `Remove '${name}' from every pickup/destination dropdown? Any fare rule using it will be removed too. Existing ride history is unaffected.`
      )
    )
      return;
    try {
      await adminAPI.deleteKnownLocation(id);
      showToast(`'${name}' removed from all locations`, 'info');
      loadKnownLocations();
      loadDestinations();
      refreshLocations();
    } catch (err) {
      showToast(err.message || 'Failed to delete location', 'error');
    }
  };

  // Support Inbox Actions
  const handleReplySupport = async (id) => {
    const reply = (replyDrafts[id] || '').trim();
    if (!reply) {
      showToast('Please write a reply before sending', 'error');
      return;
    }
    try {
      await adminAPI.replySupportMessage(id, reply);
      showToast('Reply sent! The user has been emailed too.', 'success');
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
      loadSupportMessages();
    } catch (err) {
      showToast(err.message || 'Failed to send reply', 'error');
    }
  };

  const handleDeleteSupportMessage = async (id, subject) => {
    if (!confirm(`Delete message "${subject}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteSupportMessage(id);
      showToast('Message deleted', 'info');
      loadSupportMessages();
    } catch (err) {
      showToast(err.message || 'Failed to delete message', 'error');
    }
  };

  // Location Request Actions
  const handleApproveLocationRequest = async (req) => {
    const fareOverride = fareDrafts[req.id];
    const fare = fareOverride && fareOverride !== '' ? parseFloat(fareOverride) : undefined;
    try {
      await adminAPI.approveLocationRequest(req.id, fare);
      showToast(`Approved! ${req.fromLocation} → ${req.toLocation} is now a live route.`, 'success');
      loadLocationRequests();
      loadDestinations();
      refreshLocations();
    } catch (err) {
      showToast(err.message || 'Failed to approve request', 'error');
    }
  };

  const handleRejectLocationRequest = async (req) => {
    const reason = (rejectDrafts[req.id] || '').trim();
    try {
      await adminAPI.rejectLocationRequest(req.id, reason);
      showToast('Request rejected', 'info');
      loadLocationRequests();
    } catch (err) {
      showToast(err.message || 'Failed to reject request', 'error');
    }
  };

  // Live "this exact route already has a fixed fare" lookup for the Add
  // Route form. A place's fixed fare is keyed by the (name, from) PAIR now
  // — the same destination can be fixed-priced separately from several
  // different origins (e.g. "Butani Colony" from LPU Main Gate AND,
  // separately, from Meheru) — so only an EXACT pair match is a true
  // duplicate the backend would reject; that gets the blocking "edit this
  // instead" hint. A same-name match from a DIFFERENT origin is valid and
  // just gets a quiet informational note so the admin knows it exists.
  const exactPairMatch = newDestName.trim()
    ? destinationsList.find(
        (d) =>
          (d.name || '').trim().toLowerCase() === newDestName.trim().toLowerCase() &&
          (d.fromLocation || '').trim().toLowerCase() === newDestFrom.trim().toLowerCase()
      )
    : null;
  const sameNameOtherOrigins = newDestName.trim()
    ? destinationsList.filter(
        (d) =>
          (d.name || '').trim().toLowerCase() === newDestName.trim().toLowerCase() &&
          (d.fromLocation || '').trim().toLowerCase() !== newDestFrom.trim().toLowerCase()
      )
    : [];

  // Filtering users with safe navigation
  const filteredUsers = usersList.filter((u) => {
    const userName = (u.name || u.fullName || '').toLowerCase();
    const userEmail = (u.email || '').toLowerCase();
    const query = (userSearch || '').toLowerCase();
    return userName.includes(query) || userEmail.includes(query);
  });

  // Filtering rides — status dropdown (existing) + ride type + free-text
  // search across rider/driver name and route, all client-side since the
  // full list is already loaded.
  const filteredRides = ridesList.filter((r) => {
    if (rideFilter !== 'ALL' && r.status !== rideFilter) return false;
    if (rideTypeFilter !== 'ALL' && r.rideType !== rideTypeFilter) return false;
    if (rideSearch.trim()) {
      const query = rideSearch.trim().toLowerCase();
      const haystack = [r.riderName, r.driverName, r.fromLocation || r.pickupLocation, r.toLocation || r.destination]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const openSupportCount = supportMessages.filter((m) => m.status === 'OPEN').length;
  const pendingLocationCount = locationRequests.filter((r) => r.status === 'PENDING').length;
  const openSosCount = sosAlerts.filter((a) => a.status === 'OPEN').length;
  const totalDriverEarnings = driverEarnings.reduce((sum, d) => sum + (d.totalEarnings || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Shared autocomplete list for every "From"/"To" location input on
          this page — lets the admin type a brand-new place instead of only
          picking from what already exists, while still suggesting known ones. */}
      <datalist id="known-locations">
        {allLocations.map((loc) => (
          <option key={loc} value={loc} />
        ))}
      </datalist>

      {/* Header — compact single row, small icon-only refresh on the right */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-navy text-brand-orange flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-brand-navy">Admin Portal</h1>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          title="Refresh Data"
          className="w-9 h-9 rounded-xl bg-black/5 hover:bg-black/10 text-brand-navy transition-all flex items-center justify-center shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-5 space-y-1">
          <div className="flex items-center justify-between text-ink-900/50 text-xs font-bold uppercase">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-brand-orange" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy">{stats.totalUsers}</p>
          <p className="text-[10px] text-ink-900/35 font-semibold">{stats.riders} Riders • {stats.drivers} Drivers</p>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="flex items-center justify-between text-ink-900/50 text-xs font-bold uppercase">
            <span>Active Rides</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600">{stats.activeRides}</p>
          <p className="text-[10px] text-ink-900/35 font-semibold">Accepted or Ongoing</p>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="flex items-center justify-between text-ink-900/50 text-xs font-bold uppercase">
            <span>Completed Rides</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.completedRides}</p>
          <p className="text-[10px] text-ink-900/35 font-semibold">Total Fulfilled</p>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="flex items-center justify-between text-ink-900/50 text-xs font-bold uppercase">
            <span>Platform Volume</span>
            <IndianRupee className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600">₹{stats.totalVolume}</p>
          <p className="text-[10px] text-ink-900/35 font-semibold">Gross Fare Volume</p>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="flex items-center justify-between text-ink-900/50 text-xs font-bold uppercase">
            <span>Distance Traveled</span>
            <Navigation className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.totalDistanceTraveled} km</p>
          <p className="text-[10px] text-ink-900/35 font-semibold">Completed Rides Total</p>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Card className="overflow-hidden">
        <div className="flex border-b border-black/5 bg-black/[0.02]">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-brand-orange text-brand-orange bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button
            onClick={() => setActiveTab('rides')}
            className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'rides'
                ? 'border-brand-orange text-brand-orange bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <Activity className="w-4 h-4" /> Platform Rides
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'locations'
                ? 'border-brand-orange text-brand-orange bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <MapPin className="w-4 h-4" /> Route Destinations & Fares
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'earnings'
                ? 'border-brand-orange text-brand-orange bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <Wallet className="w-4 h-4" /> Driver Earnings
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`relative flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'support'
                ? 'border-brand-orange text-brand-orange bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Support Inbox
            {openSupportCount > 0 && (
              <span className="absolute top-2 right-3 sm:relative sm:top-0 sm:right-0 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold">
                {openSupportCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('locationRequests')}
            className={`relative flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'locationRequests'
                ? 'border-brand-orange text-brand-orange bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Route Requests
            {pendingLocationCount > 0 && (
              <span className="absolute top-2 right-3 sm:relative sm:top-0 sm:right-0 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold">
                {pendingLocationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`relative flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'sos'
                ? 'border-rose-600 text-rose-600 bg-white/60'
                : 'border-transparent text-ink-900/50 hover:text-ink-900/70'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> SOS Alerts
            {openSosCount > 0 && (
              <span className="absolute top-2 right-3 sm:relative sm:top-0 sm:right-0 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                {openSosCount}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Input
                  icon={Search}
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  wrapperClassName="w-full sm:w-72"
                />
              </div>

              {loading ? (
                <div className="space-y-4 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <EmptyState icon={Users} title="No users found" description="Try a different name or email search." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/[0.02] text-ink-900/55 font-bold uppercase border-b border-black/5">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Vehicle Details</th>
                        <th className="py-3 px-4">Distance (km)</th>
                        <th className="py-3 px-4 text-right">Account Status (On / Off)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-medium text-ink-900/70">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleViewUserClick(u.id)}
                              title="View full profile"
                              className="flex items-center gap-2 font-bold text-brand-navy hover:text-brand-orange transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {(u.name || u.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="underline decoration-transparent hover:decoration-current">{u.name || u.fullName}</p>
                                <p className="text-[10px] text-ink-900/35">{u.phone || 'N/A'}</p>
                              </div>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-brand-navy">{u.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={u.role} type="role" size="sm" />
                          </td>
                          <td className="py-3 px-4">
                            {(u.role || '').toUpperCase() === 'DRIVER' ? (
                              <div className="flex items-center gap-1.5">
                                {u.vehicleType === 'Car' ? (
                                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Bike className="w-3.5 h-3.5 text-brand-orange" />
                                )}
                                <span>{u.vehicleModel || 'Vehicle'} ({u.vehiclePlate || u.vehicleNumber || 'N/A'})</span>
                              </div>
                            ) : (
                              <span className="text-ink-900/30">N/A (Rider)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-ink-900/70">
                            {u.distanceTraveled ?? 0} km
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleViewUserClick(u.id)}
                                title="View full profile"
                                className="p-1.5 rounded-lg text-ink-900/45 hover:text-brand-navy hover:bg-black/5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {(u.role || '').toUpperCase() !== 'ADMIN' && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[11px] font-bold ${u.status === 'Active' || u.active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {u.status === 'Active' || u.active ? 'Active' : 'Suspended'}
                                    </span>
                                    <button
                                      onClick={() => handleToggleUserStatus(u.id, u.name || u.fullName)}
                                      title={u.status === 'Active' || u.active ? 'Click to Suspend User' : 'Click to Activate User'}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                        u.status === 'Active' || u.active ? 'bg-emerald-500' : 'bg-rose-400'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                          u.status === 'Active' || u.active ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteUserClick(u.id, u.name || u.fullName)}
                                    title="Permanently delete this account and all their data"
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLATFORM RIDES */}
          {activeTab === 'rides' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  icon={Search}
                  placeholder="Search rider, driver, or route..."
                  value={rideSearch}
                  onChange={(e) => setRideSearch(e.target.value)}
                  wrapperClassName="w-full sm:w-72"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink-900/50 uppercase shrink-0">Status:</span>
                  <Select
                    value={rideFilter}
                    onChange={(e) => setRideFilter(e.target.value)}
                    wrapperClassName="w-44"
                    options={[
                      { value: 'ALL', label: 'All Statuses' },
                      { value: 'REQUESTED', label: 'Requested' },
                      { value: 'ACCEPTED', label: 'Accepted' },
                      { value: 'STARTED', label: 'Started' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink-900/50 uppercase shrink-0">Type:</span>
                  <Select
                    value={rideTypeFilter}
                    onChange={(e) => setRideTypeFilter(e.target.value)}
                    wrapperClassName="w-40"
                    options={[
                      { value: 'ALL', label: 'All Types' },
                      { value: 'INSTANT', label: 'Instant' },
                      { value: 'PLANNED', label: 'Pre-Planned' },
                    ]}
                  />
                </div>
                <span className="text-[11px] text-ink-900/40 font-semibold sm:ml-auto">
                  {filteredRides.length} of {ridesList.length} rides
                </span>
              </div>

              {loading ? (
                <div className="space-y-4 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : filteredRides.length === 0 ? (
                <EmptyState icon={Activity} title="No rides found" description="No rides match this status filter yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/[0.02] text-ink-900/55 font-bold uppercase border-b border-black/5">
                      <tr>
                        <th className="py-3 px-4">Ride ID</th>
                        <th className="py-3 px-4">Rider</th>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Route</th>
                        <th className="py-3 px-4">Fare Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Controller Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-medium text-ink-900/70">
                      {filteredRides.map((r) => (
                        <tr key={r.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-brand-navy">#{r.id}</td>
                          <td className="py-3 px-4 font-semibold text-brand-navy">{r.riderName}</td>
                          <td className="py-3 px-4 font-semibold text-ink-900/70">
                            {r.driverName ? r.driverName : <span className="text-ink-900/30 italic">Unassigned</span>}
                          </td>
                          <td className="py-3 px-4">
                            {r.fromLocation || r.pickupLocation} → {r.toLocation || r.destination}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-brand-orange">₹{r.fare}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={r.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="emerald"
                                  size="sm"
                                  onClick={() => handleOverrideRideStatus(r.id, 'COMPLETED')}
                                >
                                  Force Complete
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOverrideRideStatus(r.id, 'CANCELLED')}
                                >
                                  Force Cancel
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROUTE DESTINATIONS & FARE MANAGEMENT */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-navy/5 p-4 rounded-xl border border-brand-navy/10">
                <div>
                  <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-orange" /> Route Destinations & Fares Management
                  </h3>
                  <p className="text-xs text-ink-900/50">Add new destinations, update fare prices, or remove locations from the platform.</p>
                </div>

                {/* Add New Route Form — From + To + Fare, so the fare rule
                    always says exactly which pickup it applies from
                    instead of silently assuming the campus hub. */}
                <div className="w-full sm:w-auto">
                  <form onSubmit={handleAddDestinationSubmit} className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
                    <Input
                      label="From (new or existing place)"
                      list="known-locations"
                      autoComplete="off"
                      placeholder="Starting point..."
                      value={newDestFrom}
                      onChange={(e) => setNewDestFrom(e.target.value)}
                      wrapperClassName="w-full sm:w-44"
                    />
                    <Input
                      label="To (new or existing place)"
                      list="known-locations"
                      autoComplete="off"
                      placeholder="Destination Name..."
                      value={newDestName}
                      onChange={(e) => setNewDestName(e.target.value)}
                      wrapperClassName="w-full sm:w-48"
                    />
                    <Input
                      label="Fare (₹)"
                      type="number"
                      step="0.01"
                      placeholder="Fare (₹)..."
                      value={newDestFare}
                      onChange={(e) => setNewDestFare(e.target.value)}
                      wrapperClassName="w-28"
                    />
                    <Button type="submit" variant="emerald" size="md" icon={Plus} className="shrink-0">
                      Add Route
                    </Button>
                  </form>

                  {/* Live EXACT duplicate hint (same name + same from) —
                      this is the one the backend would actually reject, so
                      it's a blocking-style redirect straight into editing
                      that row. */}
                  {exactPairMatch && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2">
                      <span>
                        <strong>{newDestFrom.trim()} → {exactPairMatch.name}</strong> already has a fixed fare:{' '}
                        <strong>₹{exactPairMatch.fare}</strong>.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDest(exactPairMatch);
                          setNewDestName('');
                          setNewDestFare('');
                        }}
                        className="font-bold underline underline-offset-2 hover:text-amber-700 shrink-0"
                      >
                        Edit this instead
                      </button>
                    </div>
                  )}

                  {/* Same NAME, different origin — not a conflict (each
                      origin can have its own fixed fare for this place),
                      just a quiet FYI so the admin knows the other rows
                      exist and isn't surprised to see the name twice in
                      the table below. */}
                  {!exactPairMatch && sameNameOtherOrigins.length > 0 && (
                    <div className="mt-2 text-xs bg-black/[0.03] border border-black/10 text-ink-900/60 rounded-lg px-3 py-2">
                      <strong>{newDestName.trim()}</strong> already has a fixed fare from{' '}
                      {sameNameOtherOrigins.map((d, i) => (
                        <span key={d.id}>
                          {i > 0 && ', '}
                          <strong>{d.fromLocation}</strong> (₹{d.fare})
                        </span>
                      ))}
                      . Adding this will create a separate fixed fare just for the {newDestFrom.trim()} → {newDestName.trim()} route.
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Route Banner */}
              {editingDest && (
                <form onSubmit={handleUpdateDestinationSubmit} className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-wrap items-end gap-3">
                  <span className="text-xs font-bold text-amber-900 pb-2.5">Editing Route #{editingDest.id}:</span>
                  <Input
                    label="From"
                    list="known-locations"
                    autoComplete="off"
                    value={editingDest.fromLocation ?? ''}
                    onChange={(e) => setEditingDest((prev) => ({ ...prev, fromLocation: e.target.value }))}
                    wrapperClassName="w-44"
                  />
                  <Input
                    label="To"
                    list="known-locations"
                    autoComplete="off"
                    value={editingDest.name ?? ''}
                    onChange={(e) => setEditingDest((prev) => ({ ...prev, name: e.target.value }))}
                    wrapperClassName="w-48"
                  />
                  <Input
                    label="Fare (₹)"
                    type="number"
                    step="0.01"
                    value={editingDest.fare}
                    onChange={(e) => setEditingDest((prev) => ({ ...prev, fare: e.target.value }))}
                    wrapperClassName="w-28"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    Save
                  </button>
                  <Button type="button" variant="secondary" size="md" onClick={() => setEditingDest(null)}>
                    Cancel
                  </Button>
                </form>
              )}

              {/* Destinations & Fares Table */}
              {destinationsList.length === 0 ? (
                <EmptyState icon={MapPin} title="No destinations configured" description="Add a destination above to start managing fares." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/[0.02] text-ink-900/55 font-bold uppercase border-b border-black/5">
                      <tr>
                        <th className="py-3 px-4"># ID</th>
                        <th className="py-3 px-4">Route</th>
                        <th className="py-3 px-4">Fixed Fare (₹)</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-medium text-ink-900/70">
                      {destinationsList.map((dest) => (
                        <tr key={dest.id || dest.name} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-brand-navy">#{dest.id || '-'}</td>
                          <td className="py-3 px-4 font-extrabold text-brand-navy">
                            {dest.fromLocation || 'LPU University Main Gate'}
                            <span className="text-ink-900/30 font-normal mx-1.5">→</span>
                            {dest.name}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-emerald-600">₹{dest.fare || '50.00'}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingDest(dest)}
                                className="px-3 py-1 bg-black/5 hover:bg-black/10 text-brand-navy text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                              >
                                Edit Fare
                              </button>
                              {dest.id && (
                                <button
                                  onClick={() => handleDeleteDestinationClick(dest.id, dest.name)}
                                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* All Locations — the master list every pickup/destination
                  dropdown in the app actually reads from. Separate from
                  the fare-rule table above: renaming or removing a fare
                  rule up there does NOT remove the place name itself from
                  dropdowns — this is where that actually happens. */}
              <div className="pt-6 border-t border-black/5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-brand-orange" /> All Locations
                    </h3>
                    <p className="text-xs text-ink-900/50">
                      Every place name selectable in pickup/destination dropdowns app-wide. Fix a typo or remove a junk entry here.
                    </p>
                  </div>
                  <Input
                    icon={Search}
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    wrapperClassName="w-full sm:w-64"
                  />
                </div>

                {knownLocationsList.length === 0 ? (
                  <EmptyState icon={MapPin} title="No locations yet" description="Locations added above (or approved from a rider/driver request) will appear here." />
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-black/5">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black/[0.02] text-ink-900/55 font-bold uppercase border-b border-black/5 sticky top-0">
                        <tr>
                          <th className="py-3 px-4"># ID</th>
                          <th className="py-3 px-4">Location Name</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 font-medium text-ink-900/70">
                        {knownLocationsList
                          .filter((loc) => loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase()))
                          .map((loc) => (
                            <tr key={loc.id} className="hover:bg-black/[0.015] transition-colors">
                              <td className="py-2.5 px-4 font-mono font-bold text-brand-navy">#{loc.id}</td>
                              <td className="py-2.5 px-4 font-extrabold text-brand-navy">
                                {editingKnownLocId === loc.id ? (
                                  <form onSubmit={handleSaveRenameKnownLoc} className="flex items-center gap-2">
                                    <input
                                      autoFocus
                                      value={editingKnownLocName}
                                      onChange={(e) => setEditingKnownLocName(e.target.value)}
                                      className="px-2.5 py-1 rounded-lg border border-brand-orange/50 bg-white text-xs font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                                    />
                                    <button type="submit" className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors">
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingKnownLocId(null)}
                                      className="px-2.5 py-1 bg-black/5 hover:bg-black/10 text-ink-900/60 text-[11px] font-bold rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </form>
                                ) : (
                                  loc.name
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {editingKnownLocId !== loc.id && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleStartRenameKnownLoc(loc)}
                                      className="px-3 py-1 bg-black/5 hover:bg-black/10 text-brand-navy text-[11px] font-bold rounded-lg transition-colors"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKnownLoc(loc.id, loc.name)}
                                      className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold rounded-lg transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DRIVER EARNINGS */}
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-navy/5 p-4 rounded-xl border border-brand-navy/10">
                <div>
                  <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-brand-orange" /> Driver Earnings Breakdown
                  </h3>
                  <p className="text-xs text-ink-900/50">Per-driver earnings, alongside the platform-wide total above.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-ink-900/40 font-bold uppercase">Sum of all drivers</p>
                  <p className="text-xl font-extrabold text-emerald-600">₹{totalDriverEarnings.toFixed(2)}</p>
                </div>
              </div>

              {driverEarnings.length === 0 ? (
                <EmptyState icon={Wallet} title="No drivers yet" description="Driver earnings will show up here once drivers register." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/[0.02] text-ink-900/55 font-bold uppercase border-b border-black/5">
                      <tr>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Completed / Total Rides</th>
                        <th className="py-3 px-4 text-right">Total Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-medium text-ink-900/70">
                      {driverEarnings.map((d) => (
                        <tr key={d.driverId} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3 px-4 font-bold text-brand-navy">
                            <p>{d.driverName || 'Driver'}</p>
                            <p className="text-[10px] text-ink-900/35 font-normal">{d.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {d.vehicleType === 'Car' ? (
                                <Car className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Bike className="w-3.5 h-3.5 text-brand-orange" />
                              )}
                              <span>{d.vehicleModel || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-bold ${d.available ? 'text-emerald-600' : 'text-ink-900/40'}`}>
                              {d.available ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{d.completedRides} / {d.totalRides}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-600">₹{(d.totalEarnings || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPPORT INBOX */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-navy/10">
                <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-orange" /> Support Inbox
                </h3>
                <p className="text-xs text-ink-900/50">View, reply to, and delete in-app help messages. Replies are also emailed to the user.</p>
              </div>

              {supportMessages.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No support messages" description="User messages sent via the Help page will show up here." />
              ) : (
                <div className="space-y-3">
                  {supportMessages.map((msg) => (
                    <div key={msg.id} className="bg-white/70 rounded-xl p-4 border border-black/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-brand-navy">{msg.subject}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${msg.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {msg.status === 'OPEN' ? 'Awaiting Reply' : 'Replied'}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-900/45">{msg.userName} ({msg.userEmail}) • {msg.userRole}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteSupportMessage(msg.id, msg.subject)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 w-fit"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>

                      <p className="text-xs text-ink-900/70 bg-black/[0.03] rounded-lg p-3">{msg.message}</p>

                      {msg.adminReply ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                          <p className="font-bold mb-1">Your reply:</p>
                          <p>{msg.adminReply}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                          <Input
                            wrapperClassName="flex-1"
                            placeholder="Type your reply..."
                            value={replyDrafts[msg.id] || ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                          />
                          <Button variant="primary" size="md" icon={Send} onClick={() => handleReplySupport(msg.id)} className="shrink-0">
                            Send Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LOCATION / ROUTE REQUESTS */}
          {activeTab === 'locationRequests' && (
            <div className="space-y-4">
              <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-navy/10">
                <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-orange" /> New Route Requests
                </h3>
                <p className="text-xs text-ink-900/50">Approving turns the request into a real, selectable fixed-fare route instantly.</p>
              </div>

              {locationRequests.length === 0 ? (
                <EmptyState icon={MapPin} title="No route requests" description="Requests submitted via the Help page will show up here." />
              ) : (
                <div className="space-y-3">
                  {locationRequests.map((req) => (
                    <div key={req.id} className="bg-white/70 rounded-xl p-4 border border-black/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                            <span>{req.fromLocation}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
                            <span>{req.toLocation}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : req.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-900/45">
                            {req.userName} ({req.userEmail}) • Suggested fare: ₹{req.suggestedFare}
                          </p>
                        </div>
                      </div>

                      {req.notes && <p className="text-xs text-ink-900/60 italic bg-black/[0.03] rounded-lg p-2.5">"{req.notes}"</p>}

                      {req.status === 'PENDING' ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                          <Input
                            label="Fare (₹) — leave blank to use suggested"
                            type="number"
                            wrapperClassName="w-full sm:w-56"
                            placeholder={`${req.suggestedFare}`}
                            value={fareDrafts[req.id] || ''}
                            onChange={(e) => setFareDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          />
                          <Button variant="emerald" size="md" icon={CheckCircle} onClick={() => handleApproveLocationRequest(req)} className="shrink-0">
                            Approve
                          </Button>
                          <Input
                            wrapperClassName="flex-1"
                            placeholder="Rejection reason (optional)"
                            value={rejectDrafts[req.id] || ''}
                            onChange={(e) => setRejectDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          />
                          <Button variant="destructive" size="md" icon={XCircle} onClick={() => handleRejectLocationRequest(req)} className="shrink-0">
                            Reject
                          </Button>
                        </div>
                      ) : req.status === 'REJECTED' && req.rejectionReason ? (
                        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">Reason: {req.rejectionReason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SOS ALERTS */}
          {activeTab === 'sos' && (
            <div className="space-y-4">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" /> SOS Alerts
                </h3>
                <p className="text-xs text-rose-700/70">Triggered when a rider or driver presses the emergency SOS button mid-ride. Resolve once you've followed up.</p>
              </div>

              {sosAlerts.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="No SOS alerts" description="Emergency alerts from riders and drivers will show up here immediately." />
              ) : (
                <div className="space-y-3">
                  {sosAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl p-4 border space-y-3 ${
                        alert.status === 'OPEN' ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200' : 'bg-white/70 border-black/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                            <span>{alert.userName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 text-ink-900/60">{alert.userRole}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                alert.status === 'OPEN' ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-900/45">
                            {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            {alert.rideId ? ` • Ride #${alert.rideId} (${alert.pickupLocation} → ${alert.destination})` : ' • No ride linked'}
                          </p>
                        </div>

                        {alert.userPhone && (
                          <a
                            href={`tel:${alert.userPhone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shrink-0"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call {alert.userPhone}
                          </a>
                        )}
                      </div>

                      {alert.lat != null && alert.lng != null && (
                        <a
                          href={`https://www.google.com/maps?q=${alert.lat},${alert.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:text-brand-orange"
                        >
                          <MapPin className="w-3.5 h-3.5 text-brand-orange" /> View location on map
                        </a>
                      )}

                      {alert.status === 'OPEN' && (
                        <div className="flex justify-end">
                          <Button variant="emerald" size="sm" icon={CheckCircle} onClick={() => handleResolveSosAlert(alert.id)}>
                            Mark Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={viewUserId}
        adminAPI={adminAPI}
      />
    </div>
  );
}
