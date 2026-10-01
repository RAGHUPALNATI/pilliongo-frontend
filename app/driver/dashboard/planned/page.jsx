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
import { Calendar, Clock, User, ArrowRight, ExternalLink, Phone } from 'lucide-react';

export default function DriverPlannedPage() {
  return (
    <ProtectedRoute allowedRole="Driver">
      <DriverPlannedContent />
    </ProtectedRoute>
  );
}

// The Planned page: pre-planned route requests waiting to be accepted, plus
// the bookings already confirmed — kept off the Instant page entirely so
// browsing scheduled rides never buries a live 15-minute request there.
function DriverPlannedContent() {
  const {
    user,
    isAvailable,
    toggleAvailability,
    activeRide,
    actionLoadingId,
    handleAccept,
    handleDecline,
    upcomingPlannedRides,
    instantRequests,
    plannedRequests,
  } = useDriverDashboard();

  const plannedTabCount = plannedRequests.length + upcomingPlannedRides.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DriverDashboardHeader
        user={user}
        isAvailable={isAvailable}
        onToggleAvailability={toggleAvailability}
        active="planned"
        instantCount={instantRequests.length}
        plannedCount={plannedTabCount}
      />

      {/* 📅 Pre-Planned Requests — scheduled route bookings a rider wants
          confirmed in advance. */}
      <Card className="overflow-hidden ring-1 ring-blue-400/30">
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-glass shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                📅 Pre-Planned Requests
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                  {plannedRequests.length}
                </span>
              </CardTitle>
              <CardDescription>Scheduled route rides requested for a future date/time.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DriverRequestSection
            activeRide={activeRide}
            isAvailable={isAvailable}
            list={plannedRequests}
            emptyTitle="No pending pre-planned requests"
            emptyDescription="New scheduled route requests from riders will appear here."
            actionLoadingId={actionLoadingId}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </CardContent>
      </Card>

      {/* Accepted Rides — your confirmed pre-planned bookings, shown with
          full details. Informational/upcoming only; doesn't block instant
          rides until each one gets close to its scheduled time. */}
      <Card className="overflow-hidden ring-1 ring-blue-400/30">
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-glass shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Accepted Rides</CardTitle>
              <CardDescription>
                Confirmed pre-planned bookings. You're free to accept instant rides until each one gets close to its scheduled time.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {upcomingPlannedRides.length === 0 ? (
            <p className="text-xs text-ink-900/45 text-center py-8">
              No confirmed pre-planned bookings yet — accept one above and it'll show up here.
            </p>
          ) : (
            upcomingPlannedRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-black/10 shadow-glass-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 text-xs">
                  <div>
                    <p className="text-ink-900/50 font-semibold">Passenger:</p>
                    <p className="font-bold text-brand-navy text-sm flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-brand-orange" /> {ride.riderName || 'Awaiting rider'}
                      {ride.seatCount > 1 && (
                        <span className="ml-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                          {ride.seatCount} seats
                        </span>
                      )}
                    </p>
                    {ride.riderPhone && (
                      <a
                        href={`tel:${ride.riderPhone}`}
                        className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call ({ride.riderPhone})</span>
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-ink-900/50 font-semibold">Route &amp; Fare:</p>
                    <p className="font-bold text-brand-navy text-sm flex items-center gap-1 mt-0.5">
                      <span>{ride.fromLocation}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
                      <span>{ride.toLocation}</span>
                    </p>
                    <p className="text-xs font-extrabold text-brand-orange mt-0.5">Fare: ₹{ride.fare}</p>
                  </div>

                  <div>
                    <p className="text-ink-900/50 font-semibold">Scheduled:</p>
                    <p className="font-bold text-brand-navy text-sm flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-blue-600" /> {ride.scheduledDate} at {ride.scheduledTime}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={ride.status} size="sm" />
                    </div>
                  </div>
                </div>

                <Link href={`/ride/${ride.id}`}>
                  <Button variant="secondary" size="sm" icon={ExternalLink}>
                    View Details
                  </Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
