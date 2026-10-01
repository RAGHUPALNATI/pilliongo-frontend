'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LogoMark from '@/components/Logo';
import {
  Bike,
  Car,
  LogOut,
  ShieldCheck,
  Compass,
  ShieldAlert,
  Calendar,
  Menu,
  X,
  History,
  HelpCircle,
} from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      {/* Floating dark-glass bar: its own tint (ink-900/65 + blur) dominates
          over whatever sits behind it — a light unmigrated page today, or
          the atmospheric background once a page adopts it — so it reads
          correctly either way without depending on global layout changes. */}
      <header className="sticky top-3 sm:top-4 z-40 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto bg-ink-900/65 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass-lg">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5720B] to-brand-orange flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform">
                  <LogoMark className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
                    Pillion<span className="text-brand-orange">Go</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-medium -mt-1 tracking-wider uppercase flex items-center gap-1">
                    <Bike className="w-3 h-3 text-brand-orange" />
                    <Car className="w-3 h-3 text-emerald-400" />
                    Instant &amp; Pre-Planned Rides
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-2 sm:gap-3">
                <Link
                  href="/plan-ride"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Plan Ride</span>
                </Link>

                <Link
                  href="/help"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Help</span>
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      href={getDashboardHref()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                    >
                      {roleUpper === 'ADMIN' ? (
                        <ShieldAlert className="w-4 h-4 text-brand-orange" />
                      ) : (
                        <Compass className="w-4 h-4 text-brand-orange" />
                      )}
                      <span>{roleUpper === 'ADMIN' ? 'Admin Portal' : 'Dashboard'}</span>
                    </Link>

                    {roleUpper !== 'ADMIN' && (
                      <Link
                        href={getHistoryHref()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                      >
                        <History className="w-4 h-4 text-emerald-400" />
                        <span>Ride History</span>
                      </Link>
                    )}

                    <NotificationBell />

                    {/* User Profile Button */}
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      title="Click to edit profile"
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold transition-colors cursor-pointer ml-1"
                    >
                      <div className="w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-white text-xs font-semibold line-clamp-1 max-w-[90px]">
                          {user?.name || 'Commuter'}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          {user?.role || 'Rider'}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={logout}
                      className="p-2 text-white/50 hover:text-brand-orange hover:bg-white/10 rounded-lg transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-[#F5720B] to-brand-orange hover:to-brand-orange-hover text-white text-xs font-semibold shadow-glow-brand transition-all"
                    >
                      Register
                    </Link>
                  </>
                )}
              </nav>

              {/* Mobile Hamburger Toggle Button */}
              <div className="flex md:hidden items-center gap-2">
                {isAuthenticated && <NotificationBell />}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-white/10 text-white focus:outline-none"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mobile Collapsible Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/10 space-y-2 animate-fade-in">
                <Link
                  href="/plan-ride"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-white"
                >
                  <Calendar className="w-4 h-4 text-brand-orange" />
                  <span>Pre-Planned Route Marketplace</span>
                </Link>

                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-white"
                >
                  <HelpCircle className="w-4 h-4 text-brand-orange" />
                  <span>Help & Support</span>
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      href={getDashboardHref()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-white"
                    >
                      <Compass className="w-4 h-4 text-brand-orange" />
                      <span>Dashboard</span>
                    </Link>

                    {roleUpper !== 'ADMIN' && (
                      <Link
                        href={getHistoryHref()}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-white"
                      >
                        <History className="w-4 h-4 text-emerald-400" />
                        <span>Ride History &amp; Logs</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-white text-left"
                    >
                      <span>Edit Profile ({user?.name})</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </button>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-xs font-semibold text-rose-300 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 text-center rounded-xl bg-white/5 text-xs font-semibold text-white"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 text-center rounded-xl bg-gradient-to-b from-[#F5720B] to-brand-orange text-xs font-semibold text-white shadow-glow-brand"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </>
  );
}
