'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import useDriverDashboard from '@/hooks/useDriverDashboard';
import DriverDashboardHeader from '@/components/DriverDashboardHeader';
import DriverRequestSection from '@/components/DriverRequestSection';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import {
  Clock,
  IndianRupee,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  User,
  ArrowRight,
  Zap,
  ExternalLink,
  Phone,
} from 'lucide-react';

export default function DriverDashboardPage() {
  return (
    <ProtectedRoute allowedRole="Driver">
      <DriverInstantContent />
    </ProtectedRoute>
  );
}

// The Instant page: this is what a driver lands on. It's the time-critical
// half of the dashboard — the 15-minute requests and whatever ride is
// actively in progress right now — kept on its own page so it's never
// scrolled past or mixed in with the planned-rides browsing. See
// /driver/dashboard/planned for pre-planned requests + accepted bookings.
function DriverInstantContent() {
  const {
    user,
    isAvailable,
    toggleAvailability,
    activeRide,
    loading,
    actionLoadingId,
    handleAccept,
    handleDecline,
    handleComplete,
    completedRides,
    totalEarnings,
    instantRequests,
    plannedRequests,
    upcomingPlannedRides,
  } = useDriverDashboard();

  const plannedTabCount = plannedRequests.length + upcomingPlannedRides.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DriverDashboardHeader
        user={user}
        isAvailable={isAvailable}
        onToggleAvailability={toggleAvailability}
        active="instant"
        instantCount={instantRequests.length}
        plannedCount={plannedTabCount}
      />

      {/* ⚡ Instant Requests — always visible, right under the header, so a
          live 15-minute request is never hidden behind a scroll or a tab. */}
      <Card className={`overflow-hidden ring-1 ${instantRequests.length > 0 ? 'ring-brand-orange/50' : 'ring-black/5'}`}>
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-glass shrink-0 ${instantRequests.length > 0 ? 'bg-brand-orange animate-pulse' : 'bg-brand-orange/70'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                ⚡ Instant Requests
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-orange text-white">
                  {instantRequests.length}
                </span>
              </CardTitle>
              <CardDescription>Departing within 15 minutes — respond fast, these expire.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DriverRequestSection
            activeRide={activeRide}
            isAvailable={isAvailable}
            list={instantRequests}
            emptyTitle="No live instant requests right now"
            emptyDescription="New instant departures from nearby riders will appear here the moment they come in."
            actionLoadingId={actionLoadingId}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </CardContent>
      </Card>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Earnings Card */}
        <Card className="bg-brand-navy text-white p-6 flex flex-col justify-between space-y-4 border-none shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-brand-orange tracking-wider">
              Today's Earnings
            </span>
            <div className="w-10 h-10 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1">
              <span>₹</span>
              <span>{totalEarnings}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {completedRides.length} ride{completedRides.length !== 1 ? 's' : ''} completed today
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Fuel costs covered
            </span>
            <span className="font-semibold text-emerald-400">Verified Driver</span>
          </div>
        </Card>

        {/* Active Ride Card */}
        <Card className="md:col-span-2 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h3 className="font-bold text-base text-brand-navy flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-orange" /> Active Driver Workflow
            </h3>
            {activeRide && (
              <StatusBadge status={activeRide.status} size="sm" />
            )}
          </div>

          {activeRide ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/[0.03] p-4 rounded-xl border border-black/5 text-xs">
                <div>
                  <p className="text-ink-900/50 font-semibold">Passenger Details:</p>
                  <p className="font-bold text-brand-navy text-sm flex items-center gap-1.5 mt-0.5">
                    <User className="w-4 h-4 text-brand-orange" /> {activeRide.riderName || 'Commuter'}
                    {activeRide.seatCount > 1 && (
                      <span className="ml-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                        {activeRide.seatCount} seats
                      </span>
                    )}
                  </p>
                  {activeRide.riderPhone && (
                    <a
                      href={`tel:${activeRide.riderPhone}`}
                      className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Passenger ({activeRide.riderPhone})</span>
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-ink-900/50 font-semibold">Route & Fare:</p>
                  <p className="font-bold text-brand-navy text-sm flex items-center gap-1 mt-0.5">
                    <span>{activeRide.fromLocation}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
                    <span>{activeRide.toLocation}</span>
                  </p>
                  <p className="text-xs font-extrabold text-brand-orange mt-0.5">Fare: ₹{activeRide.fare}</p>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {activeRide.status === 'ACCEPTED' && (
                  <Alert variant="warning" icon={Clock} className="flex-1">
                    Accepted! Waiting for passenger ({activeRide.riderName}) to click "Start Ride"...
                  </Alert>
                )}

                {activeRide.status === 'STARTED' && (
                  <Button
                    variant="emerald"
                    size="md"
                    className="flex-1"
                    isLoading={actionLoadingId === activeRide.id}
                    onClick={() => handleComplete(activeRide.id)}
                    icon={CheckCircle}
                  >
                    Complete Ride
                  </Button>
                )}

                <Link href={`/ride/${activeRide.id}`}>
                  <Button variant="secondary" size="md" icon={ExternalLink}>
                    View Details Page
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No active ride in progress"
              description="Accept an instant request or reserve a pre-planned scheduled ride below."
              className="py-4"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
