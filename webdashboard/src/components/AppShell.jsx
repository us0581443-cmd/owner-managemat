'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { api, getAuthToken, setAuthToken, setAuthOwner, getAuthOwner } from '@/services/api';
import { Building2, RefreshCw } from 'lucide-react';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const initialCheckDone = useRef(false);

  // Initialize directly from localStorage to eliminate any splash screen delay
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('nest_auth_token');
    }
    return false;
  });

  const [checkingAuth, setCheckingAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      // If on login page or token already exists, don't block render
      if (window.location.pathname === '/login' || localStorage.getItem('nest_auth_token')) {
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    // If on /login page
    if (pathname === '/login') {
      const token = getAuthToken();
      if (token) {
        router.replace('/');
      }
      setCheckingAuth(false);
      return;
    }

    // Protected routes
    const token = getAuthToken();
    if (!token) {
      setIsAuthenticated(false);
      setCheckingAuth(false);
      router.replace('/login');
      return;
    }

    // Token exists: user is already active
    setIsAuthenticated(true);
    setCheckingAuth(false);

    // Verify token validity in the background ONCE on initial mount
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      api.getMe()
        .then(res => {
          if (res?.owner) {
            setAuthOwner(res.owner);
          }
        })
        .catch(err => {
          console.warn('Session verification notice:', err.message);
          if (err?.status === 401) {
            setAuthToken(null);
            setAuthOwner(null);
            setIsAuthenticated(false);
            router.replace('/login');
          }
        });
    }
  }, [pathname, router]);

  // If on /login, show login card only
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Only show splash if strictly unverified and no token found
  if (checkingAuth && !isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)'
        }}>
          <Building2 size={24} color="#FFFFFF" />
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={14} className="animate-spin" />
          <span>Opening NEST Dashboard...</span>
        </div>
      </div>
    );
  }

  // Authenticated user on protected route: Render full desktop shell with Sidebar & Header
  return (
    <div className="web-shell">
      <Sidebar />
      <div className="web-main">
        <Header />
        <main className="web-content-container">
          {children}
        </main>
      </div>
    </div>
  );
}
