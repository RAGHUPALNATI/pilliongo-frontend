'use client';

import React from 'react';
import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import DriverRequestTile from '@/components/DriverRequestTile';
import { Power, Clock } from 'lucide-react';

// Shared body for a request list card — same lock/unavailable/empty logic
// on both the Instant and Planned pages, just parameterized per list.
export default function DriverRequestSection({
  activeRide,
  isAvailable,
  list,
  emptyTitle,
  emptyDescription,
  actionLoadingId,
  onAccept,
  onDecline,
}) {
  if (activeRide) {
    return (
      <Alert variant="lock" title="Single Active Ride Rule Enforced">
        You are currently servicing ride <strong className="font-mono">#{activeRide.id}</strong> ({activeRide.fromLocation} → {activeRide.toLocation}). Complete this ride before accepting new requests.
      </Alert>
    );
  }
  if (!isAvailable) {
    return (
      <EmptyState
        icon={Power}
        title="You are currently set to Unavailable"
        description="Toggle your status to Available at the top to receive ride requests."
      />
    );
  }
  if (list.length === 0) {
    return <EmptyState icon={Clock} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {list.map((req) => (
        <DriverRequestTile key={req.id} req={req} actionLoadingId={actionLoadingId} onAccept={onAccept} onDecline={onDecline} />
      ))}
    </div>
  );
}
