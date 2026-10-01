'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ridesAPI } from '@/lib/api';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import { Input } from '@/components/Input';
import {
  History,
  ArrowLeft,
  Phone,
  Search,
} from 'lucide-react';

export default function RiderHistoryPage() {
  return (
    <ProtectedRoute allowedRole="Rider">
      <RiderHistoryContent />
    </ProtectedRoute>
  );
}

function RiderHistoryContent() {
  const { user } = useAuth();
  const [historyRides, setHistoryRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await ridesAPI.getRideHistory();
      setHistoryRides(data);
    } catch (err) {
      console.error('Error fetching rider history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredRides = historyRides.filter((r) => {
    if (filter === 'INSTANT' && r.rideType !== 'INSTANT') return false;
    if (filter === 'PLANNED' && r.rideType !== 'PLANNED') return false;
    if (filter === 'COMPLETED' && r.status !== 'COMPLETED') return false;
    if (filter === 'CANCELLED' && r.status !== 'CANCELLED' && r.status !== 'EXPIRED') return false;
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      const haystack = [r.driverName, r.fromLocation, r.toLocation].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/rider/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:text-brand-orange transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy flex items-center gap-2.5">
            <History className="w-7 h-7 text-brand-orange" /> Commuter Ride History
          </h1>
          <p className="text-xs sm:text-sm text-ink-900/50 mt-1">
            Complete record of your instant departures and pre-planned route trips.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-brand-navy text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
            }`}
          >
            All ({historyRides.length})
          </button>
          <button
            onClick={() => setFilter('INSTANT')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'INSTANT' ? 'bg-brand-orange text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
            }`}
          >
            Instant
          </button>
          <button
            onClick={() => setFilter('PLANNED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'PLANNED' ? 'bg-blue-600 text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
            }`}
          >
            Planned
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* History Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>History Records</CardTitle>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              icon={Search}
              placeholder="Search driver or route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="w-full sm:w-64"
            />
            <span className="text-xs text-ink-900/50 font-medium shrink-0">{filteredRides.length} entries</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : filteredRides.length === 0 ? (
            <EmptyState
              icon={History}
              title="No rides found in this view"
              description="Your completed and past rides will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] text-ink-900/55 font-bold uppercase border-b border-black/5">
                  <tr>
                    <th className="py-3.5 px-4">Ride ID</th>
                    <th className="py-3.5 px-4">Route (From → To)</th>
                    <th className="py-3.5 px-4">Type & Date</th>
                    <th className="py-3.5 px-4">Driver Details</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Fare</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-medium text-ink-900/70">
                  {filteredRides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-black/[0.015] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-brand-navy">#{ride.id}</td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-brand-navy">{ride.fromLocation}</span>
                        <span className="text-brand-orange px-1.5">→</span>
                        <span className="font-bold text-brand-navy">{ride.toLocation}</span>
                      </td>
                      <td className="py-4 px-4 text-ink-900/50">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mr-1.5 ${
                          ride.rideType === 'PLANNED' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {ride.rideType || 'INSTANT'}
                        </span>
                        {new Date(
                          ride.scheduledDate && ride.scheduledTime
                            ? ride.scheduledDate + ' ' + ride.scheduledTime
                            : ride.createdAt
                        ).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-4 px-4">
                        {ride.driverName ? (
                          <div>
                            <p className="font-bold text-brand-navy">{ride.driverName}</p>
                            <p className="text-[10px] text-ink-900/35">{ride.vehicleType || 'Vehicle'} ({ride.vehicleModel || 'Standard'})</p>
                          </div>
                        ) : ride.status === 'REQUESTED' ? (
                          <span className="text-amber-600 italic">Searching driver...</span>
                        ) : (
                          <span className="text-ink-900/30 italic">No driver assigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {ride.driverPhone ? (
                          <a
                            href={`tel:${ride.driverPhone}`}
                            className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{ride.driverPhone}</span>
                          </a>
                        ) : (
                          <span className="text-ink-900/30">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-brand-orange">
                        ₹{ride.fare}
                        {ride.paid && <span className="ml-1.5 text-[9px] font-extrabold text-emerald-600 align-middle">✓ PAID</span>}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={ride.status} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link href={`/ride/${ride.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
