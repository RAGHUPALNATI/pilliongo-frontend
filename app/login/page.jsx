'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import Button from '@/components/Button';
import { Card, CardTitle, CardDescription } from '@/components/Card';
import { Input } from '@/components/Input';
import Modal from '@/components/Modal';
import Atmosphere from '@/components/Atmosphere';
import LogoMark from '@/components/Logo';
import { User, Lock, ArrowRight, Eye, EyeOff, Mail, KeyRound } from 'lucide-react';

const OTP_VALID_SECONDS = 10 * 60; // matches the backend's 10-minute OTP expiry

const formatCountdown = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot-password flow state (Step 1: email, Step 2: OTP, Step 3: new password)
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);

  const { login, showToast } = useAuth();
  const router = useRouter();

  // Countdown timer — only ticks while the OTP step is showing.
  useEffect(() => {
    if (!showForgotModal || forgotStep !== 2) return;
    const interval = setInterval(() => {
      setOtpSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showForgotModal, forgotStep]);

  const closeForgotModal = () => {
    setShowForgotModal(false);
    // Reset all forgot-password state so re-opening the modal always
    // starts fresh at step 1, instead of resuming a half-finished flow.
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setResetToken('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setOtpSecondsLeft(0);
  };

  const handleForgotSubmitEmail = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      showToast('OTP sent to your email', 'success');
      setForgotOtp('');
      setOtpSecondsLeft(OTP_VALID_SECONDS);
      setForgotStep(2);
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      showToast('OTP resent to your email', 'info');
      setForgotOtp('');
      setOtpSecondsLeft(OTP_VALID_SECONDS);
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) {
      showToast('Enter the 6-digit OTP', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const data = await authAPI.verifyResetOtp(forgotEmail, forgotOtp);
      setResetToken(data.resetToken);
      showToast(typeof data.message === 'string' ? data.message : 'OTP verified', 'success');
      setForgotStep(3);
    } catch (err) {
      showToast(err.message || 'Invalid or expired OTP', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.resetPassword(forgotEmail, resetToken, forgotNewPassword, forgotConfirmPassword);
      closeForgotModal();
      showToast('Password reset successfully. Please login.', 'success');
      router.push('/login');
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error handled by AuthContext toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16">
      <Atmosphere />

      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 animate-scale-up relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5720B] to-brand-orange text-white flex items-center justify-center mx-auto shadow-glow-brand">
            <LogoMark className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your PillionGo account. We will automatically route you to your dashboard.
          </CardDescription>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            icon={User}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />

          {/* Password with Eye Show/Hide Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-ink-900/70 uppercase tracking-wide">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-brand-orange hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <Input
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ink-900/35 hover:text-brand-navy focus:outline-none transition-colors"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-brand-orange" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading} icon={ArrowRight}>
            Sign In
          </Button>
        </form>

        {/* Register Link */}
        <div className="text-center border-t border-black/5 pt-4 text-xs text-ink-900/50">
          Don't have a PillionGo account?{' '}
          <Link href="/register" className="font-bold text-brand-orange hover:underline">
            Register here
          </Link>
        </div>
      </Card>

      {/* Forgot Password Modal — Step 1: email, Step 2: OTP, Step 3: new password */}
      <Modal
        isOpen={showForgotModal}
        onClose={closeForgotModal}
        title={forgotStep === 1 ? 'Forgot Password' : forgotStep === 2 ? 'Verify OTP' : 'Set New Password'}
        size="sm"
      >
        {forgotStep === 1 && (
          <form onSubmit={handleForgotSubmitEmail} className="space-y-4">
            <p className="text-xs text-ink-900/60 leading-relaxed">
              Enter your registered email and we'll send you a 6-digit OTP to reset your password.
            </p>
            <Input
              label="Email Address"
              icon={Mail}
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={forgotLoading}>
              Send OTP
            </Button>
          </form>
        )}

        {forgotStep === 2 && (
          <form onSubmit={handleVerifyResetOtp} className="space-y-4">
            <p className="text-xs text-ink-900/60 leading-relaxed">
              Enter the 6-digit OTP sent to <span className="font-semibold text-brand-navy">{forgotEmail}</span>
            </p>
            <Input
              label="OTP"
              icon={KeyRound}
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={otpSecondsLeft <= 0 ? 'font-semibold text-rose-600' : 'text-ink-900/50'}>
                {otpSecondsLeft > 0 ? `OTP expires in ${formatCountdown(otpSecondsLeft)}` : 'OTP expired'}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={forgotLoading}
                className="font-semibold text-brand-orange hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={forgotLoading}>
              Verify OTP
            </Button>
          </form>
        )}

        {forgotStep === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="New Password"
              icon={Lock}
              type={showNewPassword ? 'text' : 'password'}
              required
              value={forgotNewPassword}
              onChange={(e) => setForgotNewPassword(e.target.value)}
              placeholder="••••••••"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-ink-900/35 hover:text-brand-navy focus:outline-none transition-colors"
                  title={showNewPassword ? 'Hide Password' : 'Show Password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-brand-orange" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Input
              label="Confirm Password"
              icon={Lock}
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={forgotConfirmPassword}
              onChange={(e) => setForgotConfirmPassword(e.target.value)}
              placeholder="••••••••"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-ink-900/35 hover:text-brand-navy focus:outline-none transition-colors"
                  title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-brand-orange" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={forgotLoading}>
              Reset Password
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
