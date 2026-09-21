'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { ArrowLeft, Save, Building2, MapPin } from 'lucide-react';

export default function EditFlatClient({ params }) {
  const router = useRouter();
  const flatId = params?.id;

  const [formData, setFormData] = useState({
    flat_number: '',
    building_name: '',
    floor: '1',
    bedrooms: '2',
    size: '',
    monthly_rent: '',
    daily_rate: '',
    status: 'Vacant',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!flatId) return;
      try {
        setLoading(true);
        const res = await api.getFlat(flatId);
        if (res.data) {
          setFormData({
            flat_number: res.data.flat_number || '',
            building_name: res.data.building_name || '',
            floor: res.data.floor || '1',
            bedrooms: res.data.bedrooms || '2',
            size: res.data.size || '',
            monthly_rent: res.data.monthly_rent || '',
            daily_rate: res.data.daily_rate || (res.data.monthly_rent ? Math.round(Number(res.data.monthly_rent) / 30) : ''),
            status: res.data.status || 'Vacant',
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load flat');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [flatId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      await api.updateFlat(flatId, {
        ...formData,
        address: formData.building_name || formData.address || 'Gulberg, Lahore'
      });
      router.push(`/flats/${flatId}`);
    } catch (err) {
      setError(err.message || 'Failed to update flat');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748B', fontSize: '14px' }}>Loading flat details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <Link
          href={`/flats/${flatId}`}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 12px' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Flat</span>
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
            Edit Property {formData.flat_number}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Modify specifications or adjust monthly rent • Updates will instantly sync across mobile & web
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-coral-light)',
          color: 'var(--color-coral)',
          padding: '12px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          border: '0.5px solid var(--color-coral-border)'
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#ffffff',
        border: '0.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Flat Number / Unit ID</label>
            <input
              type="text"
              className="form-input"
              value={formData.flat_number}
              onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Building / Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.building_name}
              onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Floor</label>
              <select
                className="form-select"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              >
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Floor {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bedrooms (BHK)</label>
              <select
                className="form-select"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              >
                <option value="1">1 BHK (Studio)</option>
                <option value="2">2 BHK (Standard)</option>
                <option value="3">3 BHK (Executive)</option>
                <option value="4">4 BHK (Penthouse)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Area / Size</label>
              <input
                type="text"
                className="form-input"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Rent (PKR)</label>
              <input
                type="number"
                className="form-input"
                value={formData.monthly_rent}
                onChange={(e) => {
                  const rent = e.target.value;
                  const calculatedDaily = rent ? Math.round(Number(rent) / 30) : '';
                  setFormData(prev => ({
                    ...prev,
                    monthly_rent: rent,
                    daily_rate: (!prev.daily_rate || prev.daily_rate === Math.round(Number(prev.monthly_rent || 0) / 30).toString()) ? calculatedDaily.toString() : prev.daily_rate
                  }));
                }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">Daily Rate / Per-Day Charge (PKR) *</label>
            <input
              type="number"
              className="form-input"
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
              required
            />
            <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
              Auto-calculated as Monthly ÷ 30, customizable for short-term stay bookings
            </span>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Link
              href={`/flats/${flatId}`}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 2, padding: '12px', justifyContent: 'center' }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save & Synchronize Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
