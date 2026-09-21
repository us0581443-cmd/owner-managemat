import React, { useState, useEffect } from 'react';
import { api, setAuthToken, setAuthOwner } from '../services/api';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function AuthPage({ onAuthSuccess, showToast }) {
  // Mode: 'login', 'signup', 'otp'
  const [mode, setMode] = useState('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (mode === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // User pasted full code
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextInput = document.getElementById(`otp-input-${Math.min(pasted.length, 5)}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '');
    setOtpDigits(newDigits);

    // Auto move focus to next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Quick fill default owner credentials
  const fillDefaultOwner = () => {
    setEmail('owner@gmail.com');
    setPassword('nest1234');
    setError('');
  };

  // Quick fill demo OTP
  const fillDemoOtp = () => {
    if (demoOtp && demoOtp.length === 6) {
      setOtpDigits(demoOtp.split(''));
    }
  };

  // 1. Submit Login
  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(email, password);
      setAuthToken(res.token);
      setAuthOwner(res.owner);
      showToast?.(`Welcome back, ${res.owner.name}!`, 'success');
      onAuthSuccess(res.owner, res.token);
    } catch (err) {
      if (err.data?.needs_verification) {
        setDemoOtp(err.data.demo_otp || '');
        setOtpTimer(60);
        setCanResend(false);
        setMode('otp');
        setError(err.message || 'Please verify your OTP code to activate your account.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Signup
  const handleSignup = async (e) => {
    e?.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.signup({
        name,
        email,
        phone,
        password
      });

      setDemoOtp(res.demo_otp || '');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setCanResend(false);
      setMode('otp');
      showToast?.('6-digit OTP code sent! Please verify.', 'success');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.verifyOtp(email, fullOtp);
      setAuthToken(res.token);
      setAuthOwner(res.owner);
      showToast?.(res.message || 'Account verified! Welcome to your fresh workspace.', 'success');
      onAuthSuccess(res.owner, res.token);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setLoading(true);
      const res = await api.resendOtp(email);
      setDemoOtp(res.demo_otp || '');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setCanResend(false);
      setError('');
      showToast?.('A fresh 6-digit OTP has been issued.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
      color: '#ffffff'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px auto',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)'
        }}>
          <Building2 size={28} color="#ffffff" />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0, color: '#FFFFFF' }}>
          NEST
        </h1>
        <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
          Owner Property & Tenant Management
        </p>
      </div>

      {/* Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '28px 22px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        color: '#0F172A'
      }}>
        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FEF2F2',
            border: '0.5px solid #FCA5A5',
            color: '#DC2626',
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '12.5px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ==================================================================
            VIEW 1: LOGIN
            ================================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: '700', margin: 0, color: '#0F172A' }}>
                Owner Login
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Enter your Gmail & password to open your dashboard
              </p>
            </div>

            {/* Quick Fill Default Owner Chip */}
            <button
              type="button"
              onClick={fillDefaultOwner}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#F0FDF4',
                border: '0.5px dashed #86EFAC',
                color: '#16A34A',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} />
              <span>Tap to Fill Default Owner (Current Flats)</span>
            </button>

            {/* Email Field */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '0.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Mail size={16} color="#64748B" />
                <input
                  type="email"
                  required
                  placeholder="owner@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '0.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Lock size={16} color="#64748B" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#2563EB',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Switch to Signup */}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: '#64748B' }}>
              Are you a new owner?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('signup');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Register Here
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================
            VIEW 2: SIGNUP
            ================================================================== */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: '700', margin: 0, color: '#0F172A' }}>
                Create Owner Account
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Start maintaining your own properties & records from scratch
              </p>
            </div>

            {/* Name Field */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Full Name
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '0.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <User size={16} color="#64748B" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Asim Raza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Email Address (Gmail)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '0.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Mail size={16} color="#64748B" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Mobile Number
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '0.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Phone size={16} color="#64748B" />
                <input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Set Password (min 6 chars)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '0.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Lock size={16} color="#64748B" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Signup Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#10B981',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating OTP...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <KeyRound size={16} />
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12.5px', color: '#64748B' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================
            VIEW 3: OTP VERIFICATION
            ================================================================== */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <ShieldCheck size={24} color="#2563EB" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0F172A' }}>
                Verify 6-Digit OTP
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                Code sent to: <strong style={{ color: '#0F172A' }}>{email}</strong>
              </p>
            </div>

            {/* Demo Helper Pill or Email Sent Confirmation */}
            {demoOtp ? (
              <div
                onClick={fillDemoOtp}
                style={{
                  background: '#F0FDF4',
                  border: '0.5px dashed #86EFAC',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', color: '#15803D', fontWeight: '600' }}>
                  Generated OTP Code (SMTP not yet set):
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '4px', color: '#16A34A', marginTop: '2px' }}>
                  {demoOtp}
                </div>
                <div style={{ fontSize: '10.5px', color: '#4ADE80', marginTop: '2px' }}>
                  (Tap here to auto-fill)
                </div>
              </div>
            ) : (
              <div style={{
                background: '#EFF6FF',
                border: '0.5px solid #BFDBFE',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                textAlign: 'center',
                color: '#1E40AF',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                ✉️ <strong>Email Dispatched!</strong> Please check your Gmail inbox (or Spam folder) for the 6-digit code.
              </div>
            )}

            {/* 6 Individual Digit Inputs */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '52px',
                    borderRadius: '10px',
                    border: digit ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                    background: digit ? '#EFF6FF' : '#F8FAFC',
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#2563EB',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Verify & Enter Workspace</span>
                </>
              )}
            </button>

            {/* Resend OTP & Back */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
              >
                ← Back to Login
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                >
                  Resend OTP
                </button>
              ) : (
                <span style={{ color: '#94A3B8' }}>
                  Resend in {otpTimer}s
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Footer copyright */}
      <div style={{ marginTop: '24px', fontSize: '11.5px', color: '#64748B', textAlign: 'center' }}>
        Protected by NEST Multi-Tenancy Architecture • SQLite Live Sync
      </div>
    </div>
  );
}
