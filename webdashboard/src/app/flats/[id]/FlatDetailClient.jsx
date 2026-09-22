'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import ReceiptModal from '@/components/ReceiptModal';
import Toast from '@/components/Toast';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  FileText,
  LogOut,
  UserPlus,
  Clock,
  Printer,
  Phone,
  MessageCircle,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function FlatDetailClient({ params }) {
  const router = useRouter();
  const flatId = params?.id;

  const [flat, setFlat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState(3);
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadFlat = async () => {
    if (!flatId) return;
    try {
      setLoading(true);
      const res = await api.getFlat(flatId);
      setFlat(res.data);
    } catch (err) {
      console.error('Failed to load flat details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlat();
  }, [flatId]);

  const handleCheckoutConfirm = async () => {
    try {
      await api.checkoutTenant(flatId);
      setShowCheckoutModal(false);
      setToastMessage('Tenant checked out successfully! Flat is now Vacant.');
      loadFlat();
    } catch (err) {
      alert(err.message || 'Checkout failed');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.deleteFlat(flatId);
      router.push('/flats');
    } catch (err) {
      alert(err.message || 'Failed to delete flat');
    }
  };

  const handleOpenReceipt = async (paymentId) => {
    try {
      const rec = await api.getReceipt(paymentId);
      if (rec.data) {
        setSelectedReceipt(rec.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert('Failed to load receipt');
    }
  };

  if (loading || !flat) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748B', fontSize: '14px' }}>Loading flat information...</p>
      </div>
    );
  }

  let photos = [];
  try {
    photos = JSON.parse(flat.photos || '[]');
  } catch (e) {
    photos = [];
  }
  const heroPhoto = photos[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80';
  const isBooked = flat.status === 'Rented' || flat.status === 'Booked';
  const activeTenancy = flat.currentTenancy;

  const flatDailyRate = flat?.daily_rate && Number(flat.daily_rate) > 0
    ? Number(flat.daily_rate)
    : (flat?.monthly_rent ? Math.round(Number(flat.monthly_rent) / 30) : 2500);

  const calculatedRent = selectedDays * flatDailyRate;

  const computedCheckOutDate = (() => {
    try {
      const d = new Date(checkInDate);
      d.setDate(d.getDate() + Number(selectedDays || 1));
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  })();

  const handleWhatsAppTenant = () => {
    if (!flat.tenant_phone) return;
    const phone = flat.tenant_phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const text = `Assalam-o-Alaikum ${flat.tenant_name || 'Tenant'}, this is regarding your tenancy at ${flat.flat_number}, ${flat.building_name || 'Executive Building'}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      <ReceiptModal
        isOpen={isReceiptOpen}
        receipt={selectedReceipt}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Checkout Modal */}
      <ConfirmModal
        isOpen={showCheckoutModal}
        title="Confirm Tenant Checkout"
        message={`Are you sure you want to check out ${flat.tenant_name || 'the tenant'} from ${flat.flat_number}? Their tenancy record will be preserved in the Customer Directory and this flat will immediately become Vacant.`}
        confirmText="Confirm Checkout"
        confirmVariant="coral"
        onConfirm={handleCheckoutConfirm}
        onCancel={() => setShowCheckoutModal(false)}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Property Unit"
        message={`Are you sure you want to permanently remove ${flat.flat_number} from your property portfolio?`}
        confirmText="Delete Unit"
        confirmVariant="coral"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* ====================================================================
          1. TOP BREADCRUMB & ACTION BAR
          ==================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/flats"
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px' }}
          >
            <ArrowLeft size={15} />
            <span>All Flats</span>
          </Link>
          <span style={{ color: '#94A3B8' }}>/</span>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)' }}>
            {flat.flat_number}
          </span>
          <StatusBadge status={flat.status} size="sm" />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href={`/flats/edit/${flat.id}`}
            className="btn btn-secondary btn-sm"
          >
            <Edit size={14} />
            <span>Edit Property Specs</span>
          </Link>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowDeleteModal(true)}
            style={{ color: 'var(--color-coral)' }}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. TWO-COLUMN DESKTOP MASTER LAYOUT (60% / 40%)
          ==================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* ==================================================================
            LEFT COLUMN: MEDIA, SPECIFICATIONS & RENT PAYMENT LEDGER
            ================================================================== */}
        <div>
          {/* Media Hero Showcase */}
          <div style={{
            position: 'relative',
            height: '200px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <img
              src={heroPhoto}
              alt={flat.flat_number}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="card-gradient-overlay" />

            <div className={`card-status-pill ${isBooked ? 'status-rented' : 'status-vacant'}`} style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <span className="status-indicator-dot" />
              <span>{isBooked ? 'Occupied / Active Lease' : 'Vacant Unit'}</span>
            </div>

            <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', zIndex: 2 }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
                {flat.flat_number}
              </h1>
              <div style={{ fontSize: '12.5px', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <MapPin size={13} />
                <span>{flat.building_name || 'Executive Heights, Gulberg'} • Floor {flat.floor || 1}</span>
              </div>
            </div>
          </div>

          {/* Unit Specifications Grid */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '0.5px solid var(--color-border)',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '14px' }}>
              Unit Specifications & Features
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ background: 'var(--color-ice-subtle)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Bedrooms</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-navy)' }}>{flat.bedrooms} BHK</strong>
              </div>

              <div style={{ background: 'var(--color-ice-subtle)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Floor Size</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-navy)' }}>{flat.size || '1,200 sqft'}</strong>
              </div>

              <div style={{ background: 'var(--color-ice-subtle)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Furnishing</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-navy)' }}>{flat.furnishing_status || 'Semi-Furnished'}</strong>
              </div>

              <div style={{ background: 'var(--color-ice-subtle)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Daily Rate</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-navy)' }}>
                  PKR {Number(flat.daily_rate || Math.round(Number(flat.monthly_rent || 0) / 30)).toLocaleString()} /d
                </strong>
              </div>

              <div style={{ background: 'var(--color-ice-subtle)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Monthly Rent</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-navy)' }}>PKR {Number(flat.monthly_rent).toLocaleString()} /m</strong>
              </div>
            </div>
          </div>

          {/* Payment Ledger Table for this Flat */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '22px',
            border: '0.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)' }}>
                  Rent Collection Ledger
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {flat.payments ? flat.payments.length : 0} invoice records for this property
                </span>
              </div>
            </div>

            {flat.payments && flat.payments.length > 0 ? (
              <div className="table-responsive-wrapper">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Paid Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flat.payments.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ color: 'var(--color-navy)' }}>{p.month_year}</strong>
                        </td>
                        <td>{p.due_date}</td>
                        <td>{p.paid_date || '—'}</td>
                        <td>
                          <strong style={{ color: 'var(--color-navy)' }}>
                            PKR {Number(p.amount).toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <StatusBadge status={p.status} size="sm" />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenReceipt(p.id)}
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <FileText size={12} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No rent payment records found for this flat yet.
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================
            RIGHT COLUMN: STICKY TENANCY CARD OR VACANT MOVE-IN ACTION
            ================================================================== */}
        <div style={{ position: 'sticky', top: '80px' }}>
          {isBooked ? (
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-mint-border)',
              padding: '22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-mint)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    ACTIVE LEASE & TENANT
                  </span>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '2px' }}>
                    {flat.tenant_name || 'Active Tenant'}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    CNIC: <strong style={{ color: 'var(--color-navy)' }}>{flat.tenant_cnic || 'Verified'}</strong>
                  </div>
                </div>

                {flat.tenant_stays_count > 1 ? (
                  <StatusBadge status="repeat" text={`Repeat – ${flat.tenant_stays_count}x`} />
                ) : (
                  <StatusBadge status="new customer" text="New Customer" />
                )}
              </div>

              {/* Quick Contact Strip */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={handleWhatsAppTenant}
                  className="btn btn-mint btn-sm"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>

                <a
                  href={`tel:${flat.tenant_phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px', textDecoration: 'none', justifyContent: 'center' }}
                >
                  <Phone size={14} />
                  <span>Call Tenant</span>
                </a>
              </div>

              {/* Lease Breakdown Box */}
              <div style={{
                background: 'var(--color-ice-subtle)',
                borderRadius: '10px',
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '12.5px',
                marginBottom: '16px',
                border: '0.5px solid rgba(14, 27, 60, 0.08)'
              }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Check-in Date</span>
                  <strong style={{ color: 'var(--color-navy)' }}>{activeTenancy ? activeTenancy.check_in_date : 'Active'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                    {activeTenancy?.booking_type === 'daily' ? 'Stay Duration' : 'Duration'}
                  </span>
                  <strong style={{ color: 'var(--color-navy)' }}>
                    {activeTenancy?.booking_type === 'daily' 
                      ? `${activeTenancy.total_days || 1} Days`
                      : (activeTenancy ? `${activeTenancy.duration_months} Months` : '11 Months')}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                    {activeTenancy?.booking_type === 'daily' ? 'Stay Rent (Total)' : 'Monthly Rent'}
                  </span>
                  <strong style={{ color: 'var(--color-navy)' }}>
                    PKR {activeTenancy ? Number(activeTenancy.total_rent || activeTenancy.rent_agreed).toLocaleString() : Number(flat.monthly_rent).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                    {activeTenancy?.booking_type === 'daily' ? 'Rate / Day' : 'Security Deposit'}
                  </span>
                  <strong style={{ color: 'var(--color-navy)' }}>
                    {activeTenancy?.booking_type === 'daily'
                      ? `PKR ${Number(activeTenancy.daily_rate || flat.daily_rate || 3000).toLocaleString()}`
                      : (activeTenancy ? `PKR ${Number(activeTenancy.deposit_amount || 0).toLocaleString()}` : 'N/A')}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '13px', padding: '9px' }}
                  onClick={() => setShowBioModal(true)}
                >
                  <FileText size={15} />
                  <span>View Tenant Bio-Data</span>
                </button>

                <button
                  type="button"
                  className="btn btn-coral"
                  style={{ width: '100%', fontSize: '13px', padding: '9px' }}
                  onClick={() => setShowCheckoutModal(true)}
                >
                  <LogOut size={15} />
                  <span>Checkout Tenant</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-mint-border)',
              padding: '22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--color-mint)',
                  background: 'var(--color-mint-light)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ● Available for Booking
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Per-Day / Short Stay
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-navy)', marginBottom: '4px' }}>
                Days-Wise Booking Calculator
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                Select duration to dynamically calculate stay rent based on per-day rate.
              </p>

              {/* Rate Highlight Strip */}
              <div style={{
                background: 'var(--color-ice-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '16px',
                border: '0.5px solid rgba(14, 27, 60, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Per-Day Rate</span>
                  <strong style={{ fontSize: '16px', color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                    PKR {flatDailyRate.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>/ day</span>
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Standard Monthly</span>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                    PKR {Number(flat.monthly_rent || 0).toLocaleString()} / mo
                  </span>
                </div>
              </div>

              {/* Quick Select Days Chips */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Select Days to Book:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '6px' }}>
                  {[1, 2, 3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedDays(num)}
                      style={{
                        padding: '7px 4px',
                        borderRadius: 'var(--radius-xs)',
                        border: selectedDays === num ? '1.5px solid var(--color-navy)' : '1px solid #E2E8F0',
                        background: selectedDays === num ? 'var(--color-navy)' : '#F8FAFC',
                        color: selectedDays === num ? '#FFFFFF' : 'var(--color-navy)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {num} {num === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[10, 15, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedDays(num)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: 'var(--radius-xs)',
                        border: selectedDays === num ? '1.5px solid var(--color-navy)' : '1px solid #E2E8F0',
                        background: selectedDays === num ? 'var(--color-navy)' : '#F8FAFC',
                        color: selectedDays === num ? '#FFFFFF' : 'var(--color-navy)',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {num} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Check-in Date & Custom Days Stepper */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Check-in Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Custom Days</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDays(prev => Math.max(1, prev - 1))}
                      style={{
                        width: '30px',
                        height: '32px',
                        border: '1px solid #E2E8F0',
                        background: '#F1F5F9',
                        borderRadius: 'var(--radius-xs) 0 0 var(--radius-xs)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '14px'
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={selectedDays}
                      onChange={(e) => setSelectedDays(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        borderRadius: 0,
                        textAlign: 'center',
                        padding: '4px',
                        fontSize: '13px',
                        fontWeight: '700',
                        height: '32px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedDays(prev => prev + 1)}
                      style={{
                        width: '30px',
                        height: '32px',
                        border: '1px solid #E2E8F0',
                        background: '#F1F5F9',
                        borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '14px'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-xs)',
                padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                  <span>Stay: {selectedDays} Days ({checkInDate} to {computedCheckOutDate})</span>
                  <span>PKR {flatDailyRate.toLocaleString()} × {selectedDays}d</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #BBF7D0' }}>
                  <strong style={{ fontSize: '13px', color: '#166534' }}>Total Rent Due:</strong>
                  <strong style={{ fontSize: '18px', color: '#166534', fontFamily: 'var(--font-heading)' }}>
                    PKR {calculatedRent.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link
                  href={`/check-in?flat_id=${flat.id}&days=${selectedDays}&daily_rate=${flatDailyRate}&check_in=${checkInDate}&check_out=${computedCheckOutDate}&booking_type=daily`}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '13.5px', justifyContent: 'center' }}
                >
                  <UserPlus size={16} />
                  <span>Book for {selectedDays} Days (PKR {calculatedRent.toLocaleString()})</span>
                </Link>

                <Link
                  href={`/check-in?flat_id=${flat.id}&booking_type=monthly`}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', justifyContent: 'center', color: '#64748B' }}
                >
                  <span>Switch to Monthly Lease (PKR {Number(flat.monthly_rent || 0).toLocaleString()}/mo)</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          3. FULL 6-SECTION TENANT BIO-DATA MODAL
          ==================================================================== */}
      {showBioModal && (
        <div className="modal-backdrop" onClick={() => setShowBioModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: 'var(--color-navy)' }}>
                Complete Tenant Bio-Data
              </h3>
              <button
                type="button"
                onClick={() => setShowBioModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '13px' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '8px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  1. Personal & Identity
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>Name: <strong>{flat.tenant_name}</strong></div>
                  <div>Father/Husband: {flat.father_husband_name || 'N/A'}</div>
                  <div>CNIC: <strong>{flat.tenant_cnic}</strong></div>
                  <div>Phone: <strong>{flat.tenant_phone}</strong></div>
                  <div>Email: {flat.tenant_email || 'N/A'}</div>
                  <div>Date of Birth: {flat.tenant_dob || 'N/A'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '8px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  2. Family & Profession
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>Family Members: {flat.family_members || '1'}</div>
                  <div>Profession: {flat.tenant_profession || 'N/A'}</div>
                  <div>Company: {flat.tenant_company || 'N/A'}</div>
                  <div>Monthly Income: PKR {flat.tenant_monthly_income ? Number(flat.tenant_monthly_income).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '8px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  3. Permanent & Previous Address
                </strong>
                <div>Permanent: {flat.tenant_permanent_address || 'N/A'}</div>
                <div>Previous: {flat.tenant_previous_address || 'N/A'}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '8px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  4. Emergency Contact
                </strong>
                <div>Contact Person: <strong>{flat.emergency_contact_name || 'N/A'}</strong> ({flat.emergency_contact_relation || 'Relation'})</div>
                <div>Emergency Phone: <strong>{flat.emergency_contact_phone || 'N/A'}</strong></div>
              </div>

              <div>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '8px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  5. Attached Documents & Verification
                </strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--color-ice)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--color-blue)', fontWeight: '600' }}>
                    ✓ CNIC Scanned Copy
                  </span>
                  <span style={{ background: 'var(--color-ice)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--color-blue)', fontWeight: '600' }}>
                    ✓ Signed Tenancy Agreement
                  </span>
                  <span style={{ background: 'var(--color-ice)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--color-blue)', fontWeight: '600' }}>
                    ✓ Guarantor Information
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-navy btn-sm"
                onClick={() => setShowBioModal(false)}
              >
                Close Bio-Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
