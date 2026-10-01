'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bike,
  Car,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import LogoMark from '@/components/Logo';
import Atmosphere from '@/components/Atmosphere';
import { Card, CardTitle, CardDescription } from '@/components/Card';
import { Input } from '@/components/Input';
import Button from '@/components/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, verifyOtp, resendOtp, showToast } = useAuth();

  const [step, setStep] = useState('REGISTER'); // 'REGISTER' | 'OTP'

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Rider', // Rider or Driver (Admin cannot be registered)
    vehicleType: 'Bike', // Bike or Car
    vehicleModel: '',
    vehicleNumber: '',
  });

  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 10-Minute Countdown Timer for OTP Step
  useEffect(() => {
    let timerInterval = null;
    if (step === 'OTP' && otpTimer > 0) {
      timerInterval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [step, otpTimer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (formData.role === 'Driver' && (!formData.vehicleModel || !formData.vehicleNumber)) {
      showToast('Drivers must provide Vehicle Model and Registration Number', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      setStep('OTP');
      setOtpTimer(600); // Start 10 min countdown
      showToast('OTP sent to your email! Please enter it to complete registration.', 'info');
    } catch (err) {
      // Handled by AuthContext toast
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.trim().length !== 6) {
      showToast('Please enter a valid 6-digit OTP code', 'error');
      return;
    }

    setOtpLoading(true);
    try {
      await verifyOtp(formData.email, otp.trim());
      showToast('Email verified. You can now login.', 'success');
      router.push('/login');
    } catch (err) {
      // Handled by AuthContext toast
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtpClick = async () => {
    setResending(true);
    try {
      await resendOtp(formData.email);
      setOtpTimer(600); // Reset timer to 10 minutes
      showToast('A new OTP has been sent to your email.', 'success');
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-10">
      <Atmosphere />

      <Card className="w-full max-w-xl p-6 sm:p-8 space-y-6 animate-scale-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5720B] to-brand-orange text-white flex items-center justify-center mx-auto shadow-glow-brand">
            <LogoMark className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl">{step === 'REGISTER' ? 'Join PillionGo' : 'Verify Your Email'}</CardTitle>
          <CardDescription>
            {step === 'REGISTER'
              ? 'Create your commuter & ride-sharing profile'
              : `Enter the OTP sent to ${formData.email}`}
          </CardDescription>
        </div>

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'REGISTER' ? (
          <>
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-ink-900/70 uppercase tracking-wide">
                Select Your Role <span className="text-brand-orange">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => handleRoleSelect('Rider')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2 ${
                    formData.role === 'Rider'
                      ? 'border-brand-navy bg-brand-navy/5 shadow-glass scale-[1.02]'
                      : 'border-black/10 hover:border-black/20 bg-white/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      formData.role === 'Rider' ? 'bg-brand-navy text-white' : 'bg-black/5 text-ink-900/60'
                    }`}
                  >
                    🎒
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-navy">I am a Rider</h4>
                    <p className="text-[11px] text-ink-900/45">Looking for rides on daily routes</p>
                  </div>
                </div>

                <div
                  onClick={() => handleRoleSelect('Driver')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2 ${
                    formData.role === 'Driver'
                      ? 'border-brand-orange bg-brand-orange/5 shadow-glass scale-[1.02]'
                      : 'border-black/10 hover:border-black/20 bg-white/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      formData.role === 'Driver' ? 'bg-brand-orange text-white' : 'bg-black/5 text-ink-900/60'
                    }`}
                  >
                    🏍️ / 🚗
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-navy">I am a Driver</h4>
                    <p className="text-[11px] text-ink-900/45">I own a Bike or Car &amp; offer rides</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmitRegister} className="space-y-4">
              <Input
                label="Full Name"
                icon={User}
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@domain.com"
                />
                <Input
                  label="Phone Number"
                  icon={Phone}
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                />
              </div>

              {formData.role === 'Driver' && (
                <div className="p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-brand-orange uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Driver Vehicle Details
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-900/60 uppercase mb-1.5">
                      Select Vehicle Type
                    </label>
                    <div className="flex gap-4">
                      <label
                        className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                          formData.vehicleType === 'Bike'
                            ? 'bg-brand-navy text-white border-brand-navy shadow-glass-sm'
                            : 'bg-white/60 text-ink-900 border-black/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicleType"
                          value="Bike"
                          checked={formData.vehicleType === 'Bike'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <Bike className="w-4 h-4" /> Bike
                      </label>

                      <label
                        className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                          formData.vehicleType === 'Car'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-glass-sm'
                            : 'bg-white/60 text-ink-900 border-black/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicleType"
                          value="Car"
                          checked={formData.vehicleType === 'Car'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <Car className="w-4 h-4" /> Car
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Vehicle Model"
                      name="vehicleModel"
                      required
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      placeholder={formData.vehicleType === 'Car' ? 'e.g. Maruti Swift' : 'e.g. Hero Splendor+'}
                    />
                    <Input
                      label="Plate Number"
                      name="vehicleNumber"
                      required
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      placeholder="e.g. PB 09 AB 1234"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-ink-900/35 hover:text-brand-navy transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-brand-orange" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Input
                  label="Confirm Password"
                  icon={Lock}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-ink-900/35 hover:text-brand-navy transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 text-brand-orange" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={loading} icon={ArrowRight}>
                {loading ? 'Creating Account...' : 'Register on PillionGo'}
              </Button>
            </form>
          </>
        ) : (
          /* STEP 2: OTP VERIFICATION FORM */
          <div className="space-y-6 animate-fade-in">
            <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-bold text-brand-navy">OTP sent to your email address</p>
              <p className="text-xs text-ink-900/60 font-mono">{formData.email}</p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-900/70 uppercase text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 px-4 rounded-2xl bg-white/70 backdrop-blur-md border-2 border-brand-orange/50 focus:outline-none focus:ring-4 focus:ring-brand-orange/30 focus:border-brand-orange font-bold text-ink-900 shadow-glass-sm"
                  />
                  <KeyRound className="w-5 h-5 text-ink-900/30 absolute left-3 top-4" />
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-between text-xs text-ink-900/60 px-4 bg-white/50 backdrop-blur-md py-2.5 rounded-xl border border-black/10">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-brand-orange" /> Time Remaining:
                </span>
                <span className={`font-mono font-extrabold text-sm ${otpTimer > 60 ? 'text-brand-navy' : 'text-rose-600 animate-pulse'}`}>
                  {formatTimer(otpTimer)}
                </span>
              </div>

              <Button type="submit" variant="emerald" size="lg" className="w-full" isLoading={otpLoading} icon={CheckCircle2}>
                Verify OTP &amp; Complete Setup
              </Button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-ink-900/60">
              <button
                type="button"
                onClick={handleResendOtpClick}
                disabled={resending}
                className="font-bold text-brand-orange hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend OTP Code'}
              </button>

              <button type="button" onClick={() => setStep('REGISTER')} className="text-ink-900/50 hover:text-brand-navy underline">
                Change Registration Info
              </button>
            </div>
          </div>
        )}

        {/* Existing User */}
        <div className="text-center border-t border-black/5 pt-4 text-xs text-ink-900/50">
          Already registered on PillionGo?{' '}
          <Link href="/login" className="font-bold text-brand-orange hover:underline">
            Login here
          </Link>
        </div>
      </Card>
    </div>
  );
}
