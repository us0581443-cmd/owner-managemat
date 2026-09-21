import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditFlatPage({ flat, onBack, onFlatUpdated, showToast }) {
  const [formData, setFormData] = useState({
    flat_number: flat.flat_number || '',
    address: flat.address || '',
    bedrooms: flat.bedrooms || '2 Bed',
    size: flat.size || '',
    monthly_rent: flat.monthly_rent || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onFlatUpdated(flat.id, formData);
    } catch (err) {
      showToast(err.message || 'Failed to update flat', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
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
            Edit Flat — {flat.flat_number}
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Modify specs or increase rent (syncs automatically across system)
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
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
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Bedrooms</label>
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
              <label className="form-label">Size</label>
              <input
                type="text"
                className="form-input"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Rent (PKR)</label>
            <input
              type="number"
              className="form-input"
              value={formData.monthly_rent}
              onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
              required
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
              Increasing rent will reflect on the next rent billing cycle.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ padding: '12px', marginTop: '12px' }}
          >
            <Save size={16} />
            <span>{isSubmitting ? 'Updating...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
