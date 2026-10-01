'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const router = useRouter();

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('pilliongo_token');
    const storedUser = localStorage.getItem('user') || localStorage.getItem('pilliongo_user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser({
            ...parsed,
            name: parsed.fullName || parsed.name || parsed.email?.split('@')[0],
          });
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      } else {
        setUser({ authenticated: true });
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login({ email, password });
      
      const userObj = {
        token: data.token,
        role: data.role,
        fullName: data.fullName,
        email: data.email,
        name: data.fullName || data.email?.split('@')[0],
      };

      setToken(data.token);
      setUser(userObj);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userObj));

      showToast(`Welcome back, ${userObj.name}!`, 'success');

      const userRole = (data.role || '').toUpperCase();
      if (userRole === 'ADMIN') {
        router.push('/admin');
      } else if (userRole === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/rider/dashboard');
      }

      return data;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const message = await authAPI.register(userData);
      showToast(typeof message === 'string' ? message : 'Registration initiated! Please verify OTP.', 'success');
      return message;
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const message = await authAPI.verifyOtp(email, otp);
      showToast(typeof message === 'string' ? message : 'Email verified successfully!', 'success');
      return message;
    } catch (err) {
      showToast(err.message || 'OTP verification failed', 'error');
      throw err;
    }
  };

  const resendOtp = async (email) => {
    try {
      const message = await authAPI.resendOtp(email);
      showToast(typeof message === 'string' ? message : 'OTP resent to your email.', 'info');
      return message;
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP', 'error');
      throw err;
    }
  };

  const updateUserProfile = async (updatedData) => {
    try {
      const data = await authAPI.updateProfile(updatedData);
      const updatedUser = {
        ...user,
        fullName: data.fullName || user?.fullName,
        name: data.fullName || user?.name,
        email: data.email || user?.email,
        phone: updatedData.phone || user?.phone,
        vehicleType: updatedData.vehicleType || user?.vehicleType,
        vehicleModel: updatedData.vehicleModel || user?.vehicleModel,
        vehiclePlate: updatedData.vehiclePlate || user?.vehiclePlate,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      }
      showToast('Profile updated successfully!', 'success');
      return data;
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
      throw err;
    }
  };

  // Merges a partial update straight into the local user object + storage —
  // no API call. Used after an action that already saved server-side (e.g.
  // setting a primary vehicle) to keep things like the dashboard header's
  // vehicle display in sync immediately, without a redundant profile PUT.
  const patchUser = (partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pilliongo_token');
    localStorage.removeItem('pilliongo_user');
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        updateUserProfile,
        patchUser,
        logout,
        showToast,
        toast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
