'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  UserPlus,
  Database,
  Building2,
  Bell,
  CheckCircle2,
  ChevronDown,
  Home,
  ReceiptText,
  Users,
  ShieldCheck,
  Sparkles,
  Command,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { api, getAuthOwner, setAuthOwner } from '@/services/api';
import OwnerProfileModal from './OwnerProfileModal';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active owner profile on mount
  useEffect(() => {
    const owner = getAuthOwner();
    if (owner) setCurrentUser(owner);
    api.getMe().then((res) => {
      if (res.owner) {
        setCurrentUser(res.owner);
        setAuthOwner(res.owner);
      }
    }).catch(() => {});
  }, []);

  // Click outside to close notifications & profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut: Ctrl+K or Cmd+K focuses search, Esc closes dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/flats?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Determine current section breadcrumb & icon
  const getSectionInfo = () => {
    if (pathname === '/') return { label: 'Executive Cockpit', icon: Home };
    if (pathname.startsWith('/flats/add')) return { label: 'Add Property Unit', icon: Plus };
    if (pathname.startsWith('/flats/edit')) return { label: 'Edit Property Specs', icon: Building2 };
    if (pathname.startsWith('/flats/')) return { label: 'Property Details Master', icon: Building2 };
    if (pathname === '/flats') return { label: 'Flats & Properties', icon: Building2 };
    if (pathname === '/payments') return { label: 'Financial Accounting', icon: ReceiptText };
    if (pathname === '/customers') return { label: 'Customer CRM Directory', icon: Users };
    if (pathname === '/check-in') return { label: 'Tenant Check-in Portal', icon: UserPlus };
    return { label: 'Property Manager', icon: Home };
  };

  const currentSection = getSectionInfo();
  const SectionIcon = currentSection.icon;

  return (
    <header className="desktop-topbar">
      {/* Left: Active Section Context & Command Search Bar */}
      <div className="topbar-left">
        {/* Dynamic Context Pill */}
        <div className="topbar-context-pill">
          <SectionIcon size={14} color="var(--color-blue)" />
          <span className="context-title">{currentSection.label}</span>
        </div>

        <div className="topbar-v-divider" />

        {/* Global Search Input with Keyboard Shortcut Pill */}
        <form onSubmit={handleSearchSubmit} className="topbar-search-box">
          <Search size={15} className="topbar-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="topbar-search-input"
            placeholder="Search flats, tenants, payments, CNIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="topbar-search-shortcut" onClick={() => searchInputRef.current?.focus()}>
            <Command size={10} style={{ marginRight: '1px' }} />
            <span>K</span>
          </div>
        </form>
      </div>

      {/* Right: Real-time DB Sync Badge, Quick CTAs, Notification & Profile */}
      <div className="topbar-right">
        {/* Live SQLite Sync Badge with Pulsing Emerald LED */}
        <div
          className="sync-status-badge"
          title="Shared SQLite Database (nest.sqlite via port 5000) • Two-way real-time sync with mobile app"
        >
          <span className="live-pulse-dot" />
          <span style={{ fontWeight: '700', letterSpacing: '0.2px' }}>Live Sync</span>
          {timeStr && <span className="sync-time-str">• {timeStr}</span>}
        </div>

        {/* Quick Check-in Button */}
        <Link
          href="/check-in"
          className="btn-topbar-action btn-topbar-mint"
          title="Check-in and register a new tenant"
        >
          <UserPlus size={14} />
          <span>Check-in</span>
        </Link>

        {/* Quick Add Flat Button */}
        <Link
          href="/flats/add"
          className="btn-topbar-action btn-topbar-primary"
          title="Add a new flat to property portfolio"
        >
          <Plus size={14} />
          <span>Add Flat</span>
        </Link>

        {/* Vertical Divider */}
        <div className="topbar-v-divider" />

        {/* Notification Bell with Pending Alert Pill */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications & Alerts"
          >
            <Bell size={17} />
            <span className="notification-ping-dot" />
          </button>

          {showNotifications && (
            <div className="topbar-dropdown-menu">
              <div className="dropdown-header">
                <strong>System Alerts</strong>
                <span className="badge badge-mint" style={{ fontSize: '10px', padding: '2px 6px' }}>Live</span>
              </div>
              <div className="dropdown-body">
                <div className="dropdown-item">
                  <div className="alert-dot-coral" />
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-navy)', fontSize: '12px' }}>Pending Rent Invoices</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Review unpaid rent dues in Payments</div>
                  </div>
                </div>
                <div className="dropdown-item">
                  <div className="alert-dot-blue" />
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-navy)', fontSize: '12px' }}>Database Synchronized</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Mobile app and web dashboard in sync</div>
                  </div>
                </div>
              </div>
              <div className="dropdown-footer">
                <Link href="/payments" onClick={() => setShowNotifications(false)} style={{ color: 'var(--color-blue)', textDecoration: 'none', fontSize: '11.5px', fontWeight: '600' }}>
                  Open Financial Ledger →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Owner Profile Pill with Dropdown */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <div
            className="topbar-profile-pill"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ cursor: 'pointer' }}
          >
            <div className="topbar-avatar-wrap" style={{ overflow: 'hidden' }}>
              {currentUser?.profile_image ? (
                <img
                  src={currentUser.profile_image}
                  alt={currentUser.name || 'Owner'}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span>{currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}</span>
              )}
              <span className="avatar-online-dot" />
            </div>
            <div className="topbar-user-text">
              <span className="profile-name">
                {currentUser ? currentUser.name : 'Owner Portal'}
              </span>
              <span className="profile-role">
                <ShieldCheck size={10} color="#3E7BFA" />
                <span>{currentUser ? 'Verified Owner' : 'Admin'}</span>
              </span>
            </div>
            <ChevronDown size={13} color="#94A3B8" />
          </div>

          {showProfileMenu && (
            <div className="topbar-dropdown-menu" style={{ width: '250px', right: 0 }}>
              <div className="dropdown-header" style={{ padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '13px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {currentUser?.profile_image ? (
                      <img
                        src={currentUser.profile_image}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span>{currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--color-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.name || 'Primary Owner'}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.email || 'owner@gmail.com'}
                    </span>
                  </div>
                </div>

                {(currentUser?.phone || currentUser?.address) && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {currentUser?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>📞</span>
                        <span style={{ fontWeight: '500' }}>{currentUser.phone}</span>
                      </div>
                    )}
                    {currentUser?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>📍</span>
                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="dropdown-body" style={{ padding: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="dropdown-item"
                  style={{
                    width: '100%',
                    background: 'rgba(62, 123, 250, 0.08)',
                    border: '1px solid rgba(62, 123, 250, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    textAlign: 'left'
                  }}
                >
                  <User size={15} color="var(--color-blue)" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-navy)' }}>
                      Edit Profile & Settings
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                      Photo, phone, address
                    </div>
                  </div>
                </button>

                <Link
                  href="/login"
                  onClick={() => setShowProfileMenu(false)}
                  className="dropdown-item"
                  style={{ textDecoration: 'none', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={14} color="var(--color-blue)" />
                  <span style={{ fontSize: '12px', color: 'var(--color-navy)', fontWeight: '600' }}>
                    Switch Account / Sign In
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await api.logout();
                    window.location.href = '/login';
                  }}
                  style={{
                    width: '100%',
                    background: '#FEF2F2',
                    border: '0.5px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out of Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Owner Profile Modal */}
      <OwnerProfileModal
        isOpen={isProfileModalOpen}
        owner={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={(updatedOwner) => {
          setCurrentUser(updatedOwner);
          setAuthOwner(updatedOwner);
        }}
      />
    </header>
  );
}
