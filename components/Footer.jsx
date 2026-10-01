'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LogoMark from '@/components/Logo';
import EditProfileModal from '@/components/EditProfileModal';
import { Bike, Car, ShieldCheck, Compass, Calendar, History, UserCog, LogIn, UserPlus } from 'lucide-react';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const roleUpper = (user?.role || '').toUpperCase();

  const getDashboardHref = () => {
    if (roleUpper === 'ADMIN') return '/admin';
    if (roleUpper === 'DRIVER') return '/driver/dashboard';
    return '/rider/dashboard';
  };

  const getHistoryHref = () => {
    if (roleUpper === 'DRIVER') return '/driver/history';
    return '/rider/history';
  };

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-b from-ink-900 to-ink-950 text-slate-300">
      {/* Footer carries its own confined atmosphere so it looks intentional
          regardless of whether the page above it has migrated yet. */}
      <div aria-hidden="true" className="absolute -bottom-32 -left-20 w-[420px] h-[420px] rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute -top-24 -right-20 w-[380px] h-[380px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                <LogoMark className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Pillion<span className="text-brand-orange">Go</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Skip crowded auto-rickshaws. PillionGo connects commuters to travel comfortably on available bikes &amp; cars while splitting travel expenses.
            </p>
          </div>

          {/* Quick Links / Your Account */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <UserCog className="w-3.5 h-3.5 text-brand-orange" /> Your Account
            </h4>

            {isAuthenticated ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <Link href={getDashboardHref()} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Compass className="w-3.5 h-3.5 text-brand-orange shrink-0" /> Dashboard
                </Link>
                {roleUpper !== 'ADMIN' && (
                  <Link href={getHistoryHref()} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                    <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Ride History
                  </Link>
                )}
                <Link href="/plan-ride" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange shrink-0" /> Plan a Ride
                </Link>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-left"
                >
                  <UserCog className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Edit Profile
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <Link href="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <LogIn className="w-3.5 h-3.5 text-brand-orange shrink-0" /> Login
                </Link>
                <Link href="/register" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Register
                </Link>
                <Link href="/plan-ride" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange shrink-0" /> Plan a Ride
                </Link>
              </div>
            )}
          </div>

          {/* Trust & Safety */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safe Community Rides
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Verified driver profiles with real-time status tracking on bikes and cars for a safe, hassle-free commute.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-emerald-400 font-medium">
              <Bike className="w-3.5 h-3.5" /> <Car className="w-3.5 h-3.5" /> Bike &amp; Car Verified
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PillionGo. Travel comfortably on your daily commute.</p>
          <div className="flex gap-6 text-xs">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Safety Guidelines</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </footer>
  );
}
