'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/services/api';
import {
  Home,
  KeyRound,
  ReceiptText,
  Users,
  UserPlus,
  PlusCircle,
  Wrench,
  Building2,
  Database,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { getAuthOwner } from '@/services/api';

export default function Sidebar() {
  const pathname = usePathname();
  const [flatCount, setFlatCount] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(getAuthOwner());
    const fetchCounters = async () => {
      try {
        const [flatsRes, dashRes] = await Promise.all([
          api.getFlats(),
          api.getDashboard()
        ]);
        if (flatsRes?.data) {
          setFlatCount(flatsRes.data.length);
        }
        if (dashRes?.data?.payments) {
          const pending = dashRes.data.payments.filter(p => p.status === 'Pending').length;
          setPendingCount(pending);
        }
      } catch (e) {
        // quiet fallback
      }
    };

    fetchCounters();
    const timer = setInterval(fetchCounters, 20000);
    return () => clearInterval(timer);
  }, []);

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { href: '/', label: 'Overview Cockpit', icon: Home },
        { href: '/flats', label: 'Flats & Properties', icon: Building2, count: flatCount },
        { href: '/payments', label: 'Financial Ledger', icon: ReceiptText, count: pendingCount, countVariant: 'coral' },
        { href: '/customers', label: 'Customer CRM', icon: Users },
      ]
    },
    {
      title: 'QUICK ACTIONS',
      items: [
        { href: '/check-in', label: 'Check-in Tenant', icon: UserPlus },
        { href: '/flats/add', label: 'Add Property', icon: PlusCircle },
      ]
    }
  ];

  return (
    <aside className="desktop-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div className="sidebar-logo-icon">
          N
        </div>
        <div>
          <div className="sidebar-brand-name">NEST</div>
          <div className="sidebar-brand-sub">PropTech Suite</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="sidebar-nav-section">{sec.title}</div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <div className="sidebar-link-inner">
                    <Icon size={18} strokeWidth={1.4} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== null && item.count !== undefined && item.count > 0 && (
                    <span
                      className="sidebar-pill-badge"
                      style={item.countVariant === 'coral' && !isActive ? { background: 'rgba(229, 89, 78, 0.25)', color: '#fca5a5' } : {}}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Database & Sync Status Mini Card */}
        <div style={{
          marginTop: 'auto',
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          border: '0.5px solid rgba(255, 255, 255, 0.08)',
          fontSize: '11px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontWeight: '700', marginBottom: '4px' }}>
            <Database size={13} />
            <span>SHARED SQLITE DB</span>
          </div>
          <div style={{ color: '#94a3b8', lineHeight: '1.4' }}>
            Two-way live synchronization active with Mobile App on port 5000.
          </div>
        </div>
      </nav>

      {/* Footer User Info */}
      <div className="sidebar-user-card">
        <div className="user-avatar-circle">
          {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}
        </div>
        <div className="user-info-text">
          <div className="user-name-line">{currentUser?.name || 'Property Owner'}</div>
          <div className="user-role-line" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.email || 'owner@gmail.com'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
