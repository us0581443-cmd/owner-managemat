'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, UserPlus, X, Clock, CheckCircle2, DollarSign } from 'lucide-react';

export default function QuickDaysBookingModal({ isOpen, onClose, flat }) {
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState(3);
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen || !flat) return null;

  const flatDailyRate = flat.daily_rate && Number(flat.daily_rate) > 0
    ? Number(flat.daily_rate)
    : (flat.monthly_rent ? Math.round(Number(flat.monthly_rent) / 30) : 2500);

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

  const handleProceedBooking = () => {
    onClose();
    router.push(
      `/check-in?flat_id=${flat.id}&days=${selectedDays}&daily_rate=${flatDailyRate}&check_in=${checkInDate}&check_out=${computedCheckOutDate}&booking_type=daily`
    );
  };

  const handleMonthlyBooking = () => {
    onClose();
    router.push(`/check-in?flat_id=${flat.id}&booking_type=monthly`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: 'var(--radius-lg)', padding: 0, overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div style={{
          background: 'var(--color-navy)',
          color: '#ffffff',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '2px 7px',
                borderRadius: 'var(--radius-xs)',
                textTransform: 'uppercase'
              }}>
                ● Available Flat
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Short-Term / Daily Stay</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              {flat.flat_number} — Days-Wise Booking
            </h3>
            <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
              {flat.building_name || 'Executive Heights'} • Floor {flat.floor || 1} • {flat.bedrooms || '1 BHK'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#ffffff',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px' }}>
          {/* Rate Highlights */}
          <div style={{
            background: 'var(--color-ice-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '0.5px solid rgba(14, 27, 60, 0.08)'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Per-Day Charge</span>
              <strong style={{ fontSize: '18px', color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                PKR {flatDailyRate.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>/ day</span>
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Standard Monthly</span>
              <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>
                PKR {Number(flat.monthly_rent || 0).toLocaleString()} / mo
              </span>
            </div>
          </div>

          {/* Quick Preset Days Chips */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Choose Duration (Number of Days):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '6px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[10, 15, 30].map((num) => (
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

          {/* Stepper + Check-in Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Check-in Date
              </label>
              <input
                type="date"
                className="form-input"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                style={{ fontSize: '12.5px', padding: '7px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Custom Days
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDays((prev) => Math.max(1, prev - 1))}
                  style={{
                    width: '32px',
                    height: '35px',
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    borderRadius: 'var(--radius-xs) 0 0 var(--radius-xs)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '15px'
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
                    height: '35px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedDays((prev) => prev + 1)}
                  style={{
                    width: '32px',
                    height: '35px',
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '15px'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Breakdown Box */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            marginBottom: '18px'
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
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProceedBooking}
              style={{ width: '100%', padding: '12px', fontSize: '13.5px', justifyContent: 'center' }}
            >
              <UserPlus size={16} />
              <span>Proceed to Check-in ({selectedDays} Days • PKR {calculatedRent.toLocaleString()})</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleMonthlyBooking}
              style={{ width: '100%', padding: '9px', fontSize: '12px', justifyContent: 'center', color: '#64748B' }}
            >
              <span>Switch to Monthly Lease (PKR {Number(flat.monthly_rent || 0).toLocaleString()}/mo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
