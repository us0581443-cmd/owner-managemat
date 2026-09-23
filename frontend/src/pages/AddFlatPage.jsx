import React, { useState } from 'react';
import { ArrowLeft, Building2, UploadCloud, Check, Image as ImageIcon } from 'lucide-react';
import { LOCAL_IMAGES, getSafeImageUrl, handleImageError } from '../utils/imageHelper';

const PRESET_PHOTOS = LOCAL_IMAGES;

export default function AddFlatPage({ onBack, onFlatAdded, showToast }) {
  const [formData, setFormData] = useState({
    flat_number: '',
    address: '',
    bedrooms: '2 Bed',
    size: '',
    monthly_rent: '',
    daily_rate: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_PHOTOS[0]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.flat_number || !formData.address || !formData.size || !formData.monthly_rent) {
      showToast('Please fill all required flat details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const photos = [customPhotoUrl.trim() || selectedPhoto];
      await onFlatAdded({
        ...formData,
        photos
      });
    } catch (err) {
      showToast(err.message || 'Failed to add flat', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy)', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-navy)' }}>
            Add New Flat
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Register property to start managing records
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ background: '#ffffff', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Flat Number / Unit ID *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Flat 301 or Penthouse B"
              value={formData.flat_number}
              onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Building / Street Address *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Al-Rehman Heights, Gulberg III, Lahore"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Bedrooms *</label>
              <select
                className="form-select"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              >
                <option value="Studio">Studio</option>
                <option value="1 Bed">1 Bed</option>
                <option value="2 Bed">2 Bed</option>
                <option value="3 Bed">3 Bed</option>
                <option value="4 Bed">4 Bed</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Size (sq ft / marla) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1,200 sq ft"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
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
              <label className="form-label">Daily Rate (PKR) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 2500"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Photo Selector */}
          <div className="form-group">
            <label className="form-label">Flat Photos / Showcase</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {PRESET_PHOTOS.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(url)}
                  style={{
                    position: 'relative',
                    height: '64px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedPhoto === url ? '1.5px solid var(--color-blue)' : '0.5px solid var(--color-border)'
                  }}
                >
                  <img
                    src={getSafeImageUrl(url)}
                    alt="Flat preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => handleImageError(e, idx)}
                  />
                  {selectedPhoto === url && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'var(--color-blue)',
                      borderRadius: '50%',
                      padding: '2px',
                      color: '#fff',
                      display: 'flex'
                    }}>
                      <Check size={12} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="url"
                className="form-input"
                placeholder="Or paste custom image URL..."
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ padding: '12px', marginTop: '10px' }}
          >
            {isSubmitting ? 'Saving Flat...' : 'Save Flat (Mark as Vacant)'}
          </button>
        </form>
      </div>
    </div>
  );
}
