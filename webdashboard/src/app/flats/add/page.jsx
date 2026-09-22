'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { ArrowLeft, Check, Plus, Building2, MapPin, CheckCircle2 } from 'lucide-react';

const PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80'
];

export default function AddFlatPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    flat_number: '',
    building_name: '',
    floor: '1',
    bedrooms: '2',
    size: '1,200 sqft',
    monthly_rent: '',
    daily_rate: '',
    furnishing_status: 'Unfurnished',
    status: 'Vacant',
  });
  const [selectedPhoto, setSelectedPhoto] = useState(PHOTO_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.flat_number || !formData.monthly_rent) {
      setError('Please fill in Flat Number and Monthly Rent.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await api.addFlat({
        ...formData,
        address: formData.building_name || formData.address || 'Gulberg, Lahore',
        photos: [selectedPhoto]
      });
      router.push('/flats');
    } catch (err) {
      setError(err.message || 'Failed to add flat');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <Link
          href="/flats"
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 12px' }}
        >
          <ArrowLeft size={15} />
          <span>All Flats</span>
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
            Add New Property
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Register a new rental unit in your shared portfolio • Immediate sync with mobile app
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

      {/* 2-Column Desktop View: Form on Left, Live Preview Card on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(340px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left: Form */}
        <div style={{
          background: '#ffffff',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Flat Number / Unit ID *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Flat 301, Penthouse A"
                value={formData.flat_number}
                onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Building / Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Executive Heights, Gulberg III"
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
                  placeholder="e.g. 1,450 sqft"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Furnishing Status</label>
                <select
                  className="form-select"
                  value={formData.furnishing_status || 'Unfurnished'}
                  onChange={(e) => setFormData({ ...formData, furnishing_status: e.target.value })}
                >
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Monthly Rent (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 75000"
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

              <div className="form-group">
                <label className="form-label">Daily Rate / Per-Day Charge (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  required
                />
                <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                  Auto-calculated as Monthly ÷ 30, customizable for short stays
                </span>
              </div>
            </div>

            {/* Photo Selector */}
            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">Select Property Showcase Photo</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {PHOTO_PRESETS.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(url)}
                    style={{
                      position: 'relative',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedPhoto === url ? '2px solid var(--color-blue)' : '0.5px solid var(--color-border)'
                    }}
                  >
                    <img src={url} alt="Flat preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {selectedPhoto === url && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'var(--color-blue)',
                        borderRadius: '50%',
                        padding: '3px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', padding: '13px', fontSize: '14px', justifyContent: 'center' }}
              >
                <Plus size={16} />
                <span>{isSubmitting ? 'Registering Property...' : 'Save & Publish Property Unit'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Preview Card */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--color-border)',
            padding: '20px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Live Desktop Card Preview
            </h4>

            <div className="property-web-card" style={{ margin: 0 }}>
              <div className="property-img-hero">
                <img src={selectedPhoto} alt="Preview" />
                <div className="card-gradient-overlay" />
                <div className="property-badge-floating">
                  <div className="card-status-pill status-vacant">
                    <span className="status-indicator-dot" />
                    <span>Vacant</span>
                  </div>
                </div>
              </div>

              <div className="property-body">
                <div>
                  <h3 className="property-title">{formData.flat_number || 'Flat Number'}</h3>
                  <div className="property-location">
                    <MapPin size={11} />
                    <span>{formData.building_name || 'Building Address'} • Floor {formData.floor}</span>
                  </div>
                </div>

                <div className="property-specs-strip">
                  <span className="spec-item">{formData.bedrooms} BHK</span>
                  <span>•</span>
                  <span className="spec-item">{formData.size || '1,200 sqft'}</span>
                </div>

                <div className="property-action-bar" style={{ marginTop: '14px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Monthly Rent</span>
                    <span className="property-rent-val">
                      PKR {formData.monthly_rent ? Number(formData.monthly_rent).toLocaleString() : '0'}
                      <span style={{ fontSize: '11px', fontWeight: '400', color: '#94A3B8' }}>/mo</span>
                    </span>
                  </div>

                  <span style={{ fontSize: '11.5px', color: 'var(--color-mint)', fontWeight: '700' }}>
                    ✓ Ready for Tenants
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
