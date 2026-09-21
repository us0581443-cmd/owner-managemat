'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import ReceiptModal from '@/components/ReceiptModal';
import QuickDaysBookingModal from '@/components/QuickDaysBookingModal';
import Toast from '@/components/Toast';
import {
  Wallet,
  TrendingUp,
  Clock,
  Building2,
  Plus,
  UserPlus,
  ReceiptText,
  Users,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  FileText,
  Star,
  RefreshCw,
  Eye,
  Send,
  Calendar
} from 'lucide-react';

const getCachedDashboard = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('nest_cached_dashboard');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState(() => getCachedDashboard());
  const [loading, setLoading] = useState(() => !getCachedDashboard());
  const [error, setError] = useState(null);
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [bookingModalFlat, setBookingModalFlat] = useState(null);

  // Quick Expense state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseFlatId, setExpenseFlatId] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Repairs & Plumber');
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent && !data) setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      if (res?.data) {
        setData(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nest_cached_dashboard', JSON.stringify(res.data));
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      if (!data) {
        setError('Unable to load dashboard data. Ensure backend is running on port 5000.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCache = !!data;
    fetchDashboard(hasCache);
    const onFocus = () => fetchDashboard(true);
    window.addEventListener('focus', onFocus);
    // Real-time sync every 12s when window is visible so network is not congested
    const pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchDashboard(true);
      }
    }, 12000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(pollTimer);
    };
  }, []);

  const handleOpenReceipt = async (paymentId) => {
    try {
      const rec = await api.getReceipt(paymentId);
      if (rec.data) {
        setSelectedReceipt(rec.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert('Failed to load receipt details');
    }
  };

  const handleQuickExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert('Please enter expense title and amount');
      return;
    }

    setIsLoggingExpense(true);
    try {
      await api.addExpense({
        flat_id: expenseFlatId || null,
        title: expenseTitle,
        category: expenseCategory,
        amount: expenseAmount,
        expense_date: new Date().toISOString().split('T')[0],
        notes: 'Logged from Executive Cockpit'
      });

      setToastMessage('Expense logged successfully and deducted from net balance.');
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseFlatId('');
      fetchDashboard(true);
    } catch (err) {
      alert(err.message || 'Failed to log expense');
    } finally {
      setIsLoggingExpense(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid var(--color-ice)',
          borderTopColor: 'var(--color-blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px auto'
        }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '500' }}>
          Syncing with NEST database...
        </p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px 24px',
        textAlign: 'center',
        border: '0.5px solid var(--color-border)',
        margin: '24px 0'
      }}>
        <AlertCircle size={38} color="var(--color-coral)" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '8px' }}>
          Backend Connection Offline
        </h3>
        <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto 18px auto' }}>
          {error}
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => fetchDashboard(false)}>
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Live dynamic metrics directly from SQLite database
  const totalIncome = data?.totalIncome || 0;
  const netProfit = data?.netProfit || 0;
  const expenses = data?.expenses || 0;
  const rentDueAmount = data?.rentDueAmount || 0;
  const rentDueCount = data?.rentDueCount || 0;
  const occupancyRate = data?.occupancyRate ? `${data.occupancyRate}%` : '0%';
  const totalFlatsCount = data?.totalFlats || 0;
  const occupiedFlatsCount = data?.occupiedFlats || 0;
  const vacantFlatsCount = data?.vacantFlats || 0;

  const allFlats = data?.allFlats || [];
  const mostRentedFlats = data?.mostRentedFlats || [];
  const leastRentedFlats = data?.leastRentedFlats || [];
  const recentPayments = data?.recentPayments || [];
  const payments = recentPayments;

  const vacantFlats = allFlats.filter(f => f.status === 'Vacant');
  const occupiedFlats = allFlats.filter(f => f.status === 'Rented' || f.status === 'Booked');

  // Filtered flats according to active desktop tab
  let displayedFlats = allFlats;
  if (propertyFilter === 'hot') displayedFlats = mostRentedFlats;
  else if (propertyFilter === 'vacant') displayedFlats = vacantFlats;
  else if (propertyFilter === 'occupied') displayedFlats = occupiedFlats;
  else if (propertyFilter === 'cold') displayedFlats = leastRentedFlats;

  const occupancyPercent = totalFlatsCount > 0
    ? Math.round((occupiedFlatsCount / totalFlatsCount) * 100)
    : 0;

  return (
    <div>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      <ReceiptModal
        isOpen={isReceiptOpen}
        receipt={selectedReceipt}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* ====================================================================
          1. DESKTOP EXECUTIVE WELCOME BANNER & ACTION BAR
          ==================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
            Executive Cockpit
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Portfolio overview • Real-time synchronization with mobile app & SQLite database
          </p>
        </div>

        {/* Primary Desktop Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/check-in"
            className="btn btn-mint"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <UserPlus size={15} />
            <span>Check-in Tenant</span>
          </Link>

          <Link
            href="/flats/add"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Plus size={15} />
            <span>Add Property</span>
          </Link>

          <Link
            href="/payments"
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <ReceiptText size={15} />
            <span>Rent Invoicing</span>
          </Link>
        </div>
      </div>

      {/* ====================================================================
          2. 4-CARD ENTERPRISE KPI ANALYTICS GRID
          ==================================================================== */}
      <div className="kpi-grid-row">
        {/* KPI 1: Net Operating Profit */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Net Operating Profit</span>
            <div className="kpi-icon-wrap mint">
              <Wallet size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-mint)' }}>
            PKR {Number(netProfit).toLocaleString()}
          </div>
          <div className="kpi-footer-note">
            <span className="kpi-trend-pill up">
              <ArrowUpRight size={11} />
              <span>Net Inflow</span>
            </span>
            <span style={{ color: '#64748B', fontSize: '11.5px', marginLeft: '6px' }}>
              Income minus expenses
            </span>
          </div>
        </div>

        {/* KPI 2: Total Revenue Collected */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Revenue</span>
            <div className="kpi-icon-wrap blue">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">
            PKR {Number(totalIncome).toLocaleString()}
          </div>
          <div className="kpi-footer-note">
            <span className="kpi-trend-pill neutral">
              <span>All-time</span>
            </span>
            <span style={{ color: '#64748B', fontSize: '11.5px', marginLeft: '6px' }}>
              Cumulative cashflow
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Rent & Outstanding */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Pending Rent Due</span>
            <div className="kpi-icon-wrap coral">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-coral)' }}>
            PKR {Number(rentDueAmount).toLocaleString()}
          </div>
          <div className="kpi-footer-note">
            <span className="kpi-trend-pill down">
              <span>{rentDueCount} Unpaid</span>
            </span>
            <span style={{ color: '#64748B', fontSize: '11.5px', marginLeft: '6px' }}>
              Requires collection
            </span>
          </div>
        </div>

        {/* KPI 4: Portfolio Occupancy Rate */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Occupancy Rate</span>
            <div className="kpi-icon-wrap amber">
              <Building2 size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {occupancyRate}
          </div>
          {/* Visual Occupancy Bar */}
          <div style={{ marginTop: '8px' }}>
            <div style={{
              width: '100%',
              height: '6px',
              background: '#E2E8F0',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${occupancyPercent}%`,
                height: '100%',
                background: occupancyPercent >= 70 ? 'var(--color-mint)' : 'var(--color-amber)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              <span>{occupiedFlatsCount} Occupied</span>
              <span>{vacantFlatsCount} Vacant</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. MAIN 2-COLUMN DESKTOP WORKSPACE LAYOUT
          ==================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* ==================================================================
            LEFT COLUMN (PRIMARY): PROPERTIES CATALOG & RECENT TRANSACTIONS
            ================================================================== */}
        <div>
          {/* A. PROPERTIES CATALOG SECTION */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--color-border)',
            padding: '22px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            {/* Catalog Header & Filter Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.3px' }}>
                  Property Portfolio
                </h2>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Manage units, monitor occupancy and initiate instant check-ins
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All Units (${allFlats.length})` },
                  { id: 'hot', label: `★ Top Rented (${mostRentedFlats.length})` },
                  { id: 'cold', label: `Low Demand (${leastRentedFlats.length})` },
                  { id: 'vacant', label: `Vacant (${vacantFlats.length})` },
                  { id: 'occupied', label: `Occupied (${occupiedFlats.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPropertyFilter(tab.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: propertyFilter === tab.id ? '1px solid var(--color-blue)' : '0.5px solid var(--color-border)',
                      background: propertyFilter === tab.id ? 'var(--color-blue-light)' : '#ffffff',
                      color: propertyFilter === tab.id ? 'var(--color-blue)' : 'var(--color-navy)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Property Grid (3 across on desktop) */}
            {displayedFlats.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                No flats found for this filter.
              </div>
            ) : (
              <div className="property-catalog-grid">
                {displayedFlats.map((flat) => {
                  let photos = [];
                  try {
                    photos = JSON.parse(flat.photos || '[]');
                  } catch (e) {
                    photos = [];
                  }
                  const thumb = photos[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';
                  const isRented = flat.status === 'Rented' || flat.status === 'Booked';

                  return (
                    <div key={flat.id} className="property-web-card">
                      {/* Image Hero with Badges */}
                      <div className="property-img-hero">
                        <img src={thumb} alt={flat.flat_number} />
                        <div className="card-gradient-overlay" />

                        {/* Floating Status Pill */}
                        <div className="property-badge-floating">
                          <div className={`card-status-pill ${isRented ? 'status-rented' : 'status-vacant'}`}>
                            <span className="status-indicator-dot" />
                            <span>{isRented ? 'Occupied' : 'Vacant'}</span>
                          </div>
                        </div>

                        {/* High Demand Star Tag */}
                        {(flat.demand_category === 'High Demand' || (flat.times_rented && flat.times_rented > 0)) && (
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            background: 'rgba(14, 27, 60, 0.85)',
                            backdropFilter: 'blur(8px)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#FBBF24',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 3
                          }}>
                            <Star size={11} fill="#FBBF24" />
                            <span>{flat.times_rented ? `Rented ${flat.times_rented}x` : 'Top Rented'}</span>
                          </div>
                        )}
                      </div>

                      {/* Property Body */}
                      <div className="property-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 className="property-title">{flat.flat_number}</h3>
                            <div className="property-location">
                              <MapPin size={11} />
                              <span>{flat.building_name || 'Gulberg Heights'} • Fl {flat.floor || 1}</span>
                            </div>
                          </div>
                        </div>

                        {/* Specs Strip */}
                        <div className="property-specs-strip">
                          <span className="spec-item">{flat.bedrooms} BHK</span>
                          <span>•</span>
                          <span className="spec-item">{flat.size || '1,200 sqft'}</span>
                        </div>

                        {/* Active Tenant / Availability Indicator */}
                        <div style={{
                          padding: '7px 10px',
                          background: isRented ? 'var(--color-ice-subtle)' : 'var(--color-mint-light)',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                          border: isRented ? '0.5px solid rgba(14, 27, 60, 0.06)' : '0.5px solid var(--color-mint-border)'
                        }}>
                          {isRented ? (
                            <span style={{ color: 'var(--color-navy)', fontWeight: '600' }}>
                              Tenant: {flat.tenant_name || 'Active Tenant'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-mint)', fontWeight: '700' }}>
                              ✓ Ready for Check-in
                            </span>
                          )}
                        </div>

                        {/* Price & Actions Row */}
                        <div className="property-action-bar">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                              <span className="property-rent-val">
                                PKR {Number(flat.daily_rate || Math.round(Number(flat.monthly_rent || 0) / 30)).toLocaleString()}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>/day</span>
                            </div>
                            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: '500' }}>
                              PKR {Number(flat.monthly_rent).toLocaleString()} /mo
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isRented ? (
                              <Link
                                href={`/flats/${flat.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px', fontSize: '11.5px' }}
                              >
                                <span>Details</span>
                                <ArrowRight size={12} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setBookingModalFlat(flat);
                                }}
                                className="btn btn-mint btn-sm"
                                style={{ padding: '6px 10px', fontSize: '11.5px' }}
                              >
                                <Calendar size={12} />
                                <span>Book Days</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. RECENT COLLECTIONS & BILLING LEDGER TABLE */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--color-border)',
            padding: '22px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.3px' }}>
                  Recent Invoices & Rent Collections
                </h2>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Real-time rent ledger synchronized with tenant check-ins and payments
                </div>
              </div>

              <Link
                href="/payments"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                <span>Open Full Ledger</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {payments.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Tenant Name</th>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 6).map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <strong style={{ color: 'var(--color-navy)', fontWeight: '700' }}>
                            {payment.flat_number}
                          </strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--color-navy)' }}>
                            {payment.tenant_name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {payment.tenant_phone || ''}
                          </div>
                        </td>
                        <td>{payment.month_year}</td>
                        <td>
                          <span style={{ fontSize: '12px', color: payment.status === 'Pending' ? 'var(--color-coral)' : '#64748b' }}>
                            {payment.due_date}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                            PKR {Number(payment.amount).toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <StatusBadge status={payment.status} size="sm" />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenReceipt(payment.id)}
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <FileText size={12} />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================
            RIGHT COLUMN (SIDEBAR): ACTION CENTER, QUICK EXPENSE & STATS
            ================================================================== */}
        <div>
          {/* 1. VACANT UNITS ATTENTION CARD */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--color-border)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: vacantFlats.length > 0 ? 'var(--color-coral-light)' : 'var(--color-mint-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: vacantFlats.length > 0 ? 'var(--color-coral)' : 'var(--color-mint)'
              }}>
                <AlertCircle size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--color-navy)' }}>
                  Vacant Units ({vacantFlats.length})
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  {vacantFlats.length > 0 ? 'Ready for new tenants' : 'All units occupied!'}
                </span>
              </div>
            </div>

            {vacantFlats.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {vacantFlats.map((vf) => (
                  <div
                    key={vf.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--color-ice-subtle)',
                      borderRadius: '8px',
                      border: '0.5px solid rgba(14, 27, 60, 0.06)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--color-navy)', display: 'block' }}>
                        {vf.flat_number}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        PKR {Number(vf.monthly_rent).toLocaleString()} /mo
                      </span>
                    </div>
                    <Link
                      href={`/check-in?flat_id=${vf.id}`}
                      className="btn btn-mint btn-sm"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      <span>Check-in</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px', background: 'var(--color-mint-light)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-mint)' }}>
                Excellent! All registered properties are currently rented and generating monthly revenue.
              </div>
            )}
          </div>

          {/* 2. QUICK MAINTENANCE EXPENSE RECORDER */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--color-border)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'var(--color-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-blue)'
              }}>
                <Wrench size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--color-navy)' }}>
                  Quick Expense Log
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Record repairs, plumbing or bills
                </span>
              </div>
            </div>

            <form onSubmit={handleQuickExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11.5px' }}>Expense Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Geyser Repair, Hallway bulb"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  style={{ height: '36px', fontSize: '12.5px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Amount (PKR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="2500"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    style={{ height: '36px', fontSize: '12.5px' }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Flat (Optional)</label>
                  <select
                    className="form-select"
                    value={expenseFlatId}
                    onChange={(e) => setExpenseFlatId(e.target.value)}
                    style={{ height: '36px', fontSize: '12px' }}
                  >
                    <option value="">General</option>
                    {allFlats.map(f => (
                      <option key={f.id} value={f.id}>{f.flat_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11.5px' }}>Category</label>
                <select
                  className="form-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{ height: '36px', fontSize: '12px' }}
                >
                  <option value="Repairs & Plumber">Repairs & Plumber</option>
                  <option value="Electrician & Wiring">Electrician & Wiring</option>
                  <option value="Painting & Polish">Painting & Polish</option>
                  <option value="Utilities & Bills">Utilities & Bills</option>
                  <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoggingExpense}
                className="btn btn-navy"
                style={{ width: '100%', padding: '8px', fontSize: '12.5px', marginTop: '4px' }}
              >
                {isLoggingExpense ? 'Saving...' : 'Deduct & Save Expense'}
              </button>
            </form>
          </div>

          {/* 3. SYSTEM REPOSITORY & SYNC DIAGNOSTIC */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--color-border)',
            padding: '18px',
            fontSize: '12px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--color-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-pulse-dot" />
              <span>Full-Stack Synchronization</span>
            </div>
            <div style={{ color: '#64748b', lineHeight: '1.5' }}>
              Every action taken on this desktop portal (check-ins, payments, flat edits) immediately updates the shared SQLite database and reflects across both mobile apps.
            </div>
          </div>
        </div>
      </div>

      <QuickDaysBookingModal
        isOpen={!!bookingModalFlat}
        flat={bookingModalFlat}
        onClose={() => setBookingModalFlat(null)}
      />
    </div>
  );
}
