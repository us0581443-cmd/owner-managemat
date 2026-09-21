'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken, setAuthOwner, getApiBase, setCustomApiBase } from '@/services/api';
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
  Sparkles,
  Server,
  Settings,
  WifiOff,
  Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'login', 'signup', 'otp'
  const [mode, setMode] = useState('login');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Backend API URL Configuration for Deployed Sites
  const [serverUrl, setServerUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    setServerUrl(getApiBase());
  }, []);

  const handleSaveServerUrl = async (e) => {
    e?.preventDefault();
    if (!serverUrl.trim()) return;
    setTestingConnection(true);
    setServerStatus(null);
    try {
      const clean = serverUrl.trim().replace(/\/+$/, '');
      const testRes = await fetch(`${clean}/health`).catch(() => null);
      setCustomApiBase(clean);
      if (testRes && testRes.ok) {
        setServerStatus({ ok: true, msg: 'Connected successfully to backend API!' });
        setError('');
      } else {
        setServerStatus({ ok: true, msg: `Saved! Targeting: ${clean}` });
        setError('');
      }
    } catch (err) {
      setServerStatus({ ok: false, msg: `Connection error: ${err.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

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

  // Handle individual OTP digit change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextInput = document.getElementById(`web-otp-${Math.min(pasted.length, 5)}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '');
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`web-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`web-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const fillDefaultOwner = () => {
    setEmail('owner@gmail.com');
    setPassword('nest1234');
    setError('');
  };

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
      router.push('/');
    } catch (err) {
      if (err.data?.needs_verification) {
        setDemoOtp(err.data.demo_otp || '');
        setOtpTimer(60);
        setCanResend(false);
        setMode('otp');
        setError(err.message || 'Please verify your OTP code to activate your account.');
      } else {
        setError(err.message || 'Invalid email or password.');
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
      setError('Please fill in name, email, and password.');
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
      setSuccessMsg('6-digit OTP code sent! Enter below to complete registration.');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
      router.push('/');
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
      setSuccessMsg('A fresh 6-digit OTP has been generated.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1E293B 0%, #0F172A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 12px 30px rgba(37, 99, 235, 0.45)'
        }}>
          <Building2 size={32} color="#ffffff" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.6px', margin: 0 }}>
          NEST Web Dashboard
        </h1>
        <p style={{ fontSize: '13.5px', color: '#94A3B8', marginTop: '6px' }}>
          Executive Property Portfolio & Multi-Owner Architecture
        </p>
      </div>

      {/* Card Form */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '0.5px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Server Endpoint Bar & Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '8px',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748B' }}>
            <Server size={12} color="var(--color-blue)" />
            <span style={{ maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              API: {getApiBase()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-blue)',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Settings size={11} />
            <span>{showServerConfig ? 'Close' : 'Change Server'}</span>
          </button>
        </div>

        {/* Server Configuration Panel */}
        {showServerConfig && (
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--color-navy)', fontSize: '12.5px' }}>
                Backend API Server Endpoint
              </strong>
              <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                Custom URL
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
              If deployed on Vercel/Netlify, paste your deployed backend URL (e.g. Render, Railway, VPS, or Ngrok tunnel). Note: Deployed HTTPS sites require <code>https://</code>.
            </p>
            <form onSubmit={handleSaveServerUrl} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://your-backend.onrender.com/api"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 10px', flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testingConnection}
                style={{ padding: '6px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                {testingConnection ? 'Saving...' : 'Save & Connect'}
              </button>
            </form>
            {serverStatus && (
              <div style={{
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '600',
                background: serverStatus.ok ? '#ECFDF5' : '#FEF2F2',
                color: serverStatus.ok ? '#059669' : '#DC2626'
              }}>
                {serverStatus.msg}
              </div>
            )}
          </div>
        )}

        {/* Failed to fetch / Server unreachable smart helper */}
        {error && error.toLowerCase().includes('failed to fetch') ? (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px',
            color: '#991B1B',
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
              <WifiOff size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#DC2626', fontSize: '13px', display: 'block' }}>
                  Backend Server Unreachable (Failed to fetch)
                </strong>
                <span style={{ color: '#64748B', fontSize: '11.5px', lineHeight: '1.4', display: 'block', marginTop: '3px' }}>
                  Your frontend is deployed, but the browser cannot reach the Express backend at:
                </span>
                <code style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#1E293B', display: 'inline-block', marginTop: '4px', wordBreak: 'break-all' }}>
                  {getApiBase()}
                </code>
              </div>
            </div>

            {!showServerConfig && (
              <button
                type="button"
                onClick={() => setShowServerConfig(true)}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: 'var(--color-blue)',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '8px'
                }}
              >
                <Settings size={12} />
                <span>Configure Backend Server URL (Render / Ngrok / Railway)</span>
              </button>
            )}
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FEF2F2',
            border: '0.5px solid #FCA5A5',
            color: '#DC2626',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F0FDF4',
            border: '0.5px solid #86EFAC',
            color: '#16A34A',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==============================================================
            MODE: LOGIN
            ============================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)', margin: 0 }}>
                Sign In
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '3px' }}>
                Access your dedicated owner properties and ledger
              </p>
            </div>

            {/* Quick Fill Default Owner Chip */}
            <button
              type="button"
              onClick={fillDefaultOwner}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                background: '#F0FDF4',
                border: '0.5px dashed #86EFAC',
                color: '#15803D',
                fontSize: '12.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '18px',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} />
              <span>Fill Default Owner (Access Current Portfolio)</span>
            </button>

            {/* Email */}
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
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0F172A'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '22px' }}>
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
                    padding: '12px 10px',
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: 'var(--color-blue)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
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
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
              Are you a new owner?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setMode('signup');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-blue)',
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

        {/* ==============================================================
            MODE: SIGNUP
            ============================================================== */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)', margin: 0 }}>
                Owner Registration
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '3px' }}>
                Set up a fresh workspace to manage your properties
              </p>
            </div>

            {/* Name */}
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

            {/* Email */}
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

            {/* Phone */}
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

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Password (min 6 characters)
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: 'var(--color-mint)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
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
            <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-blue)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ==============================================================
            MODE: OTP VERIFICATION
            ============================================================== */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <ShieldCheck size={26} color="#2563EB" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)', margin: 0 }}>
                Verify 6-Digit Code
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                Enter the code sent to: <strong style={{ color: '#0F172A' }}>{email}</strong>
              </p>
            </div>

            {/* Demo Helper Pill or Email Sent Confirmation */}
            {demoOtp ? (
              <div
                onClick={fillDemoOtp}
                style={{
                  background: '#F0FDF4',
                  border: '0.5px dashed #86EFAC',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  marginBottom: '18px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', color: '#15803D', fontWeight: '600' }}>
                  Generated OTP Code (SMTP not configured in .env):
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '4px', color: '#16A34A', marginTop: '2px' }}>
                  {demoOtp}
                </div>
                <div style={{ fontSize: '10.5px', color: '#4ADE80', marginTop: '2px' }}>
                  (Click to auto-fill)
                </div>
              </div>
            ) : (
              <div style={{
                background: '#EFF6FF',
                border: '0.5px solid #BFDBFE',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                textAlign: 'center',
                color: '#1E40AF',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                ✉️ <strong>Email Sent to Gmail!</strong> Please check your inbox (or Spam folder) for the 6-digit verification code.
              </div>
            )}

            {/* 6 Individual Digit Inputs */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '22px' }}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`web-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: '50px',
                    height: '56px',
                    borderRadius: '12px',
                    border: digit ? '2px solid var(--color-blue)' : '1px solid #CBD5E1',
                    background: digit ? '#EFF6FF' : '#F8FAFC',
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: '800',
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
                padding: '13px',
                borderRadius: '10px',
                background: 'var(--color-blue)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
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
                  <span>Verify & Open Workspace</span>
                </>
              )}
            </button>

            {/* Resend OTP & Back */}
            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
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
                  style={{ background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
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

      <div style={{ marginTop: '24px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
        NEST Property Management Architecture • Multi-Owner Data Isolation
      </div>
    </div>
  );
}
