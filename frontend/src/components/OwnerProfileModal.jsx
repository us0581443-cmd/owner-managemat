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
import { api, setAuthOwner } from '../services/api';

const PRESET_AVATARS = [
  '/images/avatars/avatar-0.jpg',
  '/images/avatars/avatar-1.jpg',
  '/images/avatars/avatar-2.jpg',
  '/images/avatars/avatar-3.jpg',
  '/images/avatars/avatar-4.jpg',
  '/images/avatars/avatar-5.jpg'
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
        }, 1000);
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
        style={{
          maxWidth: '480px',
          borderRadius: '16px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
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
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-navy)', margin: 0 }}>
                Owner Profile Settings
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0' }}>
                Set your profile photo, phone number & business address
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#DC2626',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#059669',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="owner-profile-form">
            {/* Top Avatar Preview & Uploader Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              {/* Circular Avatar */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <div style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '28px',
                  fontWeight: '800',
                  overflow: 'hidden',
                  border: '3px solid #ffffff'
                }}>
                  {formData.profile_image ? (
                    <img
                      src={formData.profile_image}
                      alt="Profile Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload New Photo"
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--color-blue)',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Action Buttons for Avatar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--color-blue)',
                    background: 'var(--color-blue-light)',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <UploadCloud size={13} />
                  <span>Choose Photo</span>
                </button>

                {formData.profile_image && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#EF4444',
                      background: '#FEF2F2',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* Avatar Switcher Sub-tabs: Presets & URL */}
              <div style={{ width: '100%', marginTop: '4px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '10px'
                }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preset')}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: activeTab === 'preset' ? 'var(--color-blue)' : '#E2E8F0',
                      background: activeTab === 'preset' ? 'var(--color-blue-light)' : '#ffffff',
                      color: activeTab === 'preset' ? 'var(--color-blue)' : '#64748B'
                    }}
                  >
                    Preset Avatars
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: activeTab === 'url' ? 'var(--color-blue)' : '#E2E8F0',
                      background: activeTab === 'url' ? 'var(--color-blue-light)' : '#ffffff',
                      color: activeTab === 'url' ? 'var(--color-blue)' : '#64748B'
                    }}
                  >
                    Image URL
                  </button>
                </div>

                {activeTab === 'preset' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {PRESET_AVATARS.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPreset(url)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: formData.profile_image === url ? '2.5px solid var(--color-blue)' : '1.5px solid #CBD5E1',
                          boxShadow: formData.profile_image === url ? '0 0 0 2px rgba(62,123,250,0.3)' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <img src={url} alt="Preset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'url' && (
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Paste image URL (https://...)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      style={{ fontSize: '11.5px', padding: '6px 10px', height: '32px' }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="btn btn-primary"
                      style={{ padding: '0 12px', fontSize: '11px', whiteSpace: 'nowrap', height: '32px' }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Fields */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '5px' }}>
                <User size={14} color="var(--color-blue)" />
                <span>Full Name / Owner Name</span>
                <span style={{ color: 'var(--color-coral)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Malik Muhammad Naveed"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            {/* Phone Number Input */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '5px' }}>
                <Phone size={14} color="var(--color-blue)" />
                <span>Official Contact / Phone Number</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +92 300 1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            {/* Address Input */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '5px' }}>
                <MapPin size={14} color="var(--color-blue)" />
                <span>Office / Residence Address</span>
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="e.g. Suite 402, Executive Heights, F-10 Markaz, Islamabad"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ fontSize: '13px', padding: '8px 12px', resize: 'vertical' }}
              />
            </div>

            {/* Read-only Registered Email Badge */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#64748B" />
                <div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>
                    Login & Security Email
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-navy)', fontWeight: '600' }}>
                    {owner?.email || 'owner@gmail.com'}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '700',
                color: '#059669',
                background: '#ECFDF5',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <ShieldCheck size={12} />
                Verified
              </span>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="owner-profile-form"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} />
            <span>{isSubmitting ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
