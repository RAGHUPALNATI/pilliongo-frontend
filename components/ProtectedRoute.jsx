'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRole = null }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && isAuthenticated && allowedRole && user?.role) {
      if (allowedRole.toUpperCase() !== user.role.toUpperCase()) {
        const userRole = user.role.toUpperCase();
        if (userRole === 'ADMIN') router.push('/admin');
        else if (userRole === 'DRIVER') router.push('/driver/dashboard');
        else router.push('/rider/dashboard');
      }
    }
  }, [isAuthenticated, loading, user, allowedRole, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
        <p className="text-sm font-medium text-ink-900/55">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

