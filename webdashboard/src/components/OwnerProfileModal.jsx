'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Mail,
  Camera,
  CheckCircle2,
  UploadCloud,
  ShieldCheck,
  Save,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { api, setAuthOwner } from '@/services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'
];

export default function OwnerProfileModal({ isOpen, owner, onClose, onProfileUpdated }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    profile_image: ''
  });
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [customUrl, setCustomUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name || '',
        phone: owner.phone || '',
        address: owner.address || '',
        profile_image: owner.profile_image || ''
      });
      setCustomUrl(owner.profile_image || '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [owner, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Image file size should be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setFormData(prev => ({ ...prev, profile_image: base64 }));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url) => {
    setFormData(prev => ({ ...prev, profile_image: url }));
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      setFormData(prev => ({ ...prev, profile_image: customUrl.trim() }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, profile_image: '' }));
    setCustomUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.updateProfile(formData);
      if (res?.success && res?.owner) {
        setAuthOwner(res.owner);
        setSuccessMsg('Profile updated successfully!');
        if (onProfileUpdated) {
          onProfileUpdated(res.owner);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(res?.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = formData.name ? formData.name.slice(0, 2).toUpperCase() : 'OP';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: '16px' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--color-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-blue)'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>
                Owner Profile Settings
              </h3>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                Set your profile photo, phone number, and official address
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 22px' }}>
          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '0.5px solid #FCA5A5',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#F0FDF4',
              border: '0.5px solid #86EFAC',
              color: '#15803D',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Photo Avatar Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            background: 'var(--color-ice-subtle)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '18px',
            border: '0.5px solid rgba(14, 27, 60, 0.08)'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: formData.profile_image ? '#ffffff' : 'var(--color-blue)',
                border: '3px solid #ffffff',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: '800'
              }}>
                {formData.profile_image ? (
                  <img
                    src={formData.profile_image}
                    alt="Owner Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Photo"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--color-navy)',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-navy)' }}>
                Profile Avatar
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', marginBottom: '8px' }}>
                Upload photo, choose a preset, or enter image link
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <UploadCloud size={13} />
                  <span>Upload File</span>
                </button>

                {formData.profile_image && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: 'none',
                      border: '0.5px solid #FCA5A5',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#DC2626',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Options Tabs */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('preset')}
                style={{
                  background: activeTab === 'preset' ? 'var(--color-blue-light)' : '#F1F5F9',
                  color: activeTab === 'preset' ? 'var(--color-blue)' : '#64748B',
                  border: activeTab === 'preset' ? '1px solid var(--color-blue)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Choose Preset Avatar
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                style={{
                  background: activeTab === 'url' ? 'var(--color-blue-light)' : '#F1F5F9',
                  color: activeTab === 'url' ? 'var(--color-blue)' : '#64748B',
                  border: activeTab === 'url' ? '1px solid var(--color-blue)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Paste Image URL
              </button>
            </div>

            {activeTab === 'preset' && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0' }}>
                {PRESET_AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    onClick={() => handleSelectPreset(url)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: formData.profile_image === url ? '3px solid var(--color-blue)' : '2px solid #E2E8F0',
                      transition: 'transform 0.15s',
                      transform: formData.profile_image === url ? 'scale(1.08)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'url' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/my-photo.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  style={{ height: '36px', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleApplyCustomUrl}
                  style={{ height: '36px' }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                Owner Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Muhammad Ali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ paddingLeft: '32px', height: '38px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                Contact Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="0300 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ paddingLeft: '32px', height: '38px', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
              Official Office / Residency Address
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94A3B8' }} />
              <textarea
                rows={2}
                className="form-input"
                placeholder="e.g. Suite 401, Executive Tower, Main Shahrah-e-Faisal, Karachi"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ paddingLeft: '32px', fontSize: '13px', paddingTop: '8px', minHeight: '60px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '6px' }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
              Account Email (Verified)
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="email"
                disabled
                className="form-input"
                value={owner?.email || ''}
                style={{ paddingLeft: '32px', height: '38px', fontSize: '13px', background: '#F1F5F9', color: '#64748B' }}
              />
              <span style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: 'var(--color-mint)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={13} />
                <span>Verified</span>
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            <Save size={14} />
            <span>{isSubmitting ? 'Saving Profile...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
