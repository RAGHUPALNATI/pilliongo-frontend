'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Navigation,
  Bike,
  Car,
  MapPin,
  UserCheck,
  Wallet,
  Users,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Atmosphere from '@/components/Atmosphere';
import { Card } from '@/components/Card';

const FEATURED_LOCATIONS = [
  'LPU University Main Gate',
  'Green Valley Main Gate',
  'Hardaspur',
  'Meheru',
  'Cheharu',
  'Rama Mandi',
  'Deep Nagar',
  'Phagwara Bus Stand',
  'Jalandhar City',
  'Nakodar Chowk',
];

export default function LandingPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Auto-redirect logged in users directly to their respective dashboards
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const roleUpper = (user.role || '').toUpperCase();
      if (roleUpper === 'ADMIN') {
        router.push('/admin');
      } else if (roleUpper === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/rider/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || (isAuthenticated && user)) {
    return (
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Atmosphere />
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
        <p className="text-sm font-bold text-slate-300">Redirecting to your PillionGo portal...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* The whole landing page sits on the atmosphere — this is the one
          page where the full "spatial glass" treatment is meant to show,
          per the approved design system (dark atmosphere for hero/marketing
          surfaces, light glass for dense functional screens). */}
      <Atmosphere />

      <div className="space-y-20 pb-20">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              Comfortable Bike &amp; Car Ride-Sharing
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-white">
              Share the ride. <br />
              <span className="text-brand-orange">Split the cost.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Ditch crowded, slow auto-rickshaws. Connect with commuters traveling your route and travel comfortably on bikes or cars while saving money.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/login?role=Rider"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-b from-[#F5720B] to-brand-orange hover:to-brand-orange-hover text-white text-base font-semibold shadow-glow-brand hover:shadow-[0_0_0_1px_rgba(234,88,12,0.5),0_16px_36px_-6px_rgba(234,88,12,0.55)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Find a Ride</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/login?role=Driver"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white text-base font-semibold border border-white/15 hover:border-white/30 shadow-glass-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <div className="flex items-center gap-1">
                  <Bike className="w-5 h-5 text-brand-orange" />
                  <Car className="w-5 h-5 text-emerald-400" />
                </div>
                <span>Offer a Ride</span>
              </Link>
            </div>

            <div className="pt-8 border-t border-white/10 max-w-4xl mx-auto space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top routes &amp; destinations</p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                {FEATURED_LOCATIONS.map((loc) => (
                  <span
                    key={loc}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 font-medium text-slate-300 hover:border-brand-orange/50 hover:text-white transition-colors"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest">Fast &amp; Easy</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">How PillionGo Works</h2>
            <p className="text-slate-300 text-sm mt-2">Get matched with commuters on your route in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hover className="p-8 flex flex-col items-center text-center space-y-4 relative">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange font-black text-sm flex items-center justify-center">
                01
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5720B] to-brand-orange text-white flex items-center justify-center shadow-glow-brand">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Register Account</h3>
              <p className="text-sm text-ink-900/55 leading-relaxed">
                Sign up with your details to join the verified PillionGo commuter network.
              </p>
            </Card>

            <Card hover className="p-8 flex flex-col items-center text-center space-y-4 relative">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange font-black text-sm flex items-center justify-center">
                02
              </div>
              <div className="w-16 h-16 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-glass">
                <MapPin className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Set Your Route</h3>
              <p className="text-sm text-ink-900/55 leading-relaxed">
                Select your pickup and drop-off points (Green Valley, Hardaspur, Rama Mandi, LPU Gate, etc.).
              </p>
            </Card>

            <Card hover className="p-8 flex flex-col items-center text-center space-y-4 relative">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange font-black text-sm flex items-center justify-center">
                03
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center gap-1 shadow-glow-emerald">
                <Bike className="w-6 h-6" />
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Hop On &amp; Ride</h3>
              <p className="text-sm text-ink-900/55 leading-relaxed">
                Match with a bike or car driver heading your way, share the ride, and split fuel costs effortlessly!
              </p>
            </Card>
          </div>
        </section>

        {/* WHY PILLIONGO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest">Better Than Autos</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Why Travel with PillionGo?</h2>
            <p className="text-slate-300 text-sm mt-2">Ditch crowded, overpriced autos for a faster, comfortable commute</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hover className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/15 text-brand-orange flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">Save Money</h3>
              <p className="text-sm text-ink-900/55 leading-relaxed">
                Pay significantly less than auto fares. Drivers earn extra income by sharing seats on their daily routes.
              </p>
            </Card>

            <Card hover className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center gap-1">
                <Bike className="w-5 h-5" />
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">Bike &amp; Car Options</h3>
              <p className="text-sm text-ink-900/55 leading-relaxed">
                Choose between quick bike rides or comfortable carpooling depending on what is available on your route.
              </p>
            </Card>

            <Card hover className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">Skip Crowded Autos</h3>
              <p className="text-sm text-ink-900/55 leading-relaxed">
                No more waiting for cramped autos to fill up. Get direct, point-to-point rides in comfort.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
