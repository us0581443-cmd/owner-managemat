import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, UserPlus, LogOut, CheckCircle, FileText, Phone, Mail, MapPin, Calendar, Clock, DollarSign, ShieldAlert, CreditCard } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function FlatDetailPage({
  flat,
  onBack,
  onEditFlat,
  onDeleteFlat,
  onCheckInClick,
  onCheckoutClick,
  onMarkPaid,
  onViewCustomer
}) {
  const [showBioModal, setShowBioModal] = useState(false);

  const flatDailyRate = Number(flat?.daily_rate || (flat?.monthly_rent ? Math.round(Number(flat.monthly_rent) / 30) : 2500));
  const [selectedDays, setSelectedDays] = useState(3);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);

  const computedCheckOutDate = (() => {
    const d = new Date(checkInDate);
    d.setDate(d.getDate() + Number(selectedDays || 1));
    return d.toISOString().split('T')[0];
  })();

  const calculatedRent = Number(selectedDays || 1) * flatDailyRate;

  if (!flat) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Flat Details...</div>;

  let photos = [];
  try {
    photos = JSON.parse(flat.photos || '[]');
  } catch (e) {
    photos = [];
  }
  const mainPhoto = photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80';

  const isBooked = flat.status === 'Booked';
  const activeTenancy = flat.activeTenancy;

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={18} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Back to Flats</span>
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onEditFlat(flat)}
            title="Edit Flat Details"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="btn btn-coral btn-sm"
            onClick={() => onDeleteFlat(flat)}
            title="Delete Flat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Hero Photo & Badges */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        height: '200px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <img
          src={mainPhoto}
          alt={flat.flat_number}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          gap: '8px'
        }}>
          <StatusBadge status={flat.status} />
        </div>
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(transparent, rgba(14, 27, 60, 0.85))',
          padding: '16px',
          color: '#ffffff'
        }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {flat.flat_number}
          </h1>
          <div style={{ fontSize: '12.5px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} />
            <span>{flat.address}</span>
          </div>
        </div>
      </div>

      {/* Specs Overview Box */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        border: '1px solid #E2E8F0',
        marginBottom: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        textAlign: 'center'
      }}>
        <div>
          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Bedrooms</span>
          <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>{flat.bedrooms}</strong>
        </div>
        <div>
          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Size</span>
          <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>{flat.size}</strong>
        </div>
        <div>
          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Daily Rate</span>
          <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>
            PKR {Number(flat.daily_rate || Math.round(Number(flat.monthly_rent || 0) / 30)).toLocaleString()} /d
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Monthly Rent</span>
          <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>PKR {Number(flat.monthly_rent).toLocaleString()} /m</strong>
        </div>
      </div>

      {/* 2.4 Booking System & Status Block */}
      {isBooked ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #BBF7D0',
          padding: '18px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          {/* Booking Summary Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                CURRENT TENANCY & BOOKING
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-navy)', marginTop: '2px' }}>
                {flat.tenant_name || 'Active Tenant'}
              </h3>
            </div>
            {flat.tenant_stays_count > 1 ? (
              <StatusBadge status="repeat" text={`Repeat – ${flat.tenant_stays_count}x`} />
            ) : (
              <StatusBadge status="new customer" text="New Customer" />
            )}
          </div>

          {/* Booking Summary Details Grid */}
          <div style={{
            background: 'var(--color-ice-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '12.5px',
            marginBottom: '14px',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Check-in Date:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{activeTenancy ? activeTenancy.check_in_date : 'Active'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                {activeTenancy?.booking_type === 'daily' ? 'Stay Duration:' : 'Lease Duration:'}
              </span>
              <strong style={{ color: 'var(--color-navy)' }}>
                {activeTenancy?.booking_type === 'daily' 
                  ? `${activeTenancy.total_days || 1} Days`
                  : (activeTenancy ? `${activeTenancy.duration_months} Months` : 'N/A')}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                {activeTenancy?.booking_type === 'daily' ? 'Stay Rent (Total):' : 'Agreed Rent:'}
              </span>
              <strong style={{ color: 'var(--color-navy)' }}>
                PKR {activeTenancy ? Number(activeTenancy.total_rent || activeTenancy.monthly_rent || flat.monthly_rent).toLocaleString() : Number(flat.monthly_rent).toLocaleString()}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                {activeTenancy?.booking_type === 'daily' ? 'Rate Per Day:' : 'Security Deposit:'}
              </span>
              <strong style={{ color: 'var(--color-navy)' }}>
                {activeTenancy?.booking_type === 'daily'
                  ? `PKR ${Number(activeTenancy.daily_rate || flat.daily_rate || 3000).toLocaleString()}`
                  : `PKR ${activeTenancy ? Number(activeTenancy.security_deposit || 0).toLocaleString() : '0'}`}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Phone:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{flat.tenant_phone || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>CNIC:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{flat.tenant_cnic || 'N/A'}</strong>
            </div>
          </div>

          {/* Action Buttons for Booked Flat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowBioModal(true)}
            >
              <FileText size={14} />
              <span>Full Bio-Data</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onViewCustomer(flat.current_tenant_id)}
            >
              <span>Customer History</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-coral btn-block"
              style={{ padding: '10px' }}
              onClick={() => onCheckoutClick(flat)}
            >
              <LogOut size={16} />
              <span>Checkout Tenant</span>
            </button>
          </div>
        </div>
      ) : (
        /* If Vacant: Interactive Days-Wise Booking Selector & Price Calculator */
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #BBF7D0',
          padding: '18px 16px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          {/* Header Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#F0FDF4',
                color: '#166534',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid #BBF7D0'
              }}>
                ✓ AVAILABLE NOW
              </span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Per-Day Stay Booking</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>Daily Charge Rate</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                PKR {flatDailyRate.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>/day</span>
              </div>
            </div>
          </div>

          {/* Quick Days Selector Chips */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Select Number of Days to Book:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {[1, 2, 3, 5, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedDays(num)}
                  style={{
                    padding: '8px 4px',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
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

          {/* Stepper + Custom Days & Check-in Date */}
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

          {/* Real-time Calculation Summary Strip */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-xs)',
            padding: '10px 12px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#166534', marginBottom: '4px' }}>
              <span>Stay: {selectedDays} Days ({checkInDate} to {computedCheckOutDate})</span>
              <span>PKR {flatDailyRate.toLocaleString()} × {selectedDays}d</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #BBF7D0' }}>
              <strong style={{ fontSize: '12.5px', color: '#166534' }}>Total Rent Due:</strong>
              <strong style={{ fontSize: '17px', color: '#166534', fontFamily: 'var(--font-heading)' }}>
                PKR {calculatedRent.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ padding: '12px', fontSize: '13.5px', justifyContent: 'center' }}
            onClick={() => onCheckInClick(flat, {
              booking_type: 'daily',
              total_days: selectedDays,
              daily_rate: flatDailyRate,
              check_in_date: checkInDate,
              check_out_date: computedCheckOutDate,
              total_rent: calculatedRent
            })}
          >
            <UserPlus size={16} />
            <span>Book Flat for {selectedDays} Days (PKR {calculatedRent.toLocaleString()})</span>
          </button>
        </div>
      )}

      {/* Payment Records for this Flat */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        border: '0.5px solid var(--color-border)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)' }}>
            Rent Payment History
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {flat.payments ? flat.payments.length : 0} records
          </span>
        </div>

        {flat.payments && flat.payments.length > 0 ? (
          flat.payments.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '0.5px solid rgba(14, 27, 60, 0.06)'
              }}
            >
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-navy)' }}>
                  {p.month_year}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Due: {p.due_date} {p.paid_date && `• Paid: ${p.paid_date}`}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-navy)' }}>
                  PKR {Number(p.amount).toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '3px' }}>
                  <StatusBadge status={p.status} size="sm" />
                  {p.status === 'Pending' && (
                    <button
                      type="button"
                      className="btn btn-mint btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => onMarkPaid(p.id)}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
            No payment history recorded yet.
          </p>
        )}
      </div>

      {/* Full Tenant Bio-Data Modal */}
      {showBioModal && isBooked && (
        <div className="modal-backdrop" onClick={() => setShowBioModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)' }}>
                Tenant Bio-Data — {flat.tenant_name}
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
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '6px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  1. Personal Details
                </strong>
                <div>Name: <strong>{flat.tenant_name}</strong></div>
                <div>Father/Husband: {flat.father_husband_name || 'N/A'}</div>
                <div>CNIC: <strong>{flat.tenant_cnic}</strong></div>
                <div>Phone: <strong>{flat.tenant_phone}</strong></div>
                <div>Email: {flat.tenant_email || 'N/A'}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '6px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  2. Family & Occupation
                </strong>
                <div>Family Members: {flat.family_members || '1'}</div>
                <div>Profession: {flat.tenant_profession || 'N/A'}</div>
                <div>Company: {flat.tenant_company || 'N/A'}</div>
                <div>Monthly Income: PKR {flat.tenant_monthly_income ? Number(flat.tenant_monthly_income).toLocaleString() : 'N/A'}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '6px', borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)', paddingBottom: '4px' }}>
                  3. Emergency Contact
                </strong>
                <div>Name: {flat.emergency_contact_name || 'N/A'}</div>
                <div>Relationship: {flat.emergency_contact_relation || 'N/A'}</div>
                <div>Phone: {flat.emergency_contact_phone || 'N/A'}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-navy"
                onClick={() => setShowBioModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
