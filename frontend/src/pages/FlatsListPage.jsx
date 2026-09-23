import React, { useState } from 'react';
import { Plus, Search, Trash2, ArrowUpDown, Clock, DollarSign, ArrowDownAZ, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getSafeImageUrl, handleImageError } from '../utils/imageHelper';

export default function FlatsListPage({
  flats,
  sortOption,
  onSortChange,
  searchQuery,
  onSearchChange,
  onOpenFlat,
  onAddFlatClick,
  onDeleteFlatClick
}) {
  const sortButtons = [
    { id: 'date', label: 'Date Added', icon: Clock },
    { id: 'rent_desc', label: 'Rent (High-Low)', icon: DollarSign },
    { id: 'name_asc', label: 'Name (A-Z)', icon: ArrowDownAZ },
    { id: 'status', label: 'Status (Vacant)', icon: CheckCircle },
  ];

  return (
    <div>
      {/* Top Controls & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)' }}>
            Flats Portfolio
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {flats.length} total properties registered
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onAddFlatClick}
          style={{ padding: '8px 14px', fontSize: '12.5px' }}
        >
          <Plus size={16} />
          <span>Add Flat</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search by flat #, building, address..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
        />
      </div>

      {/* Sorting Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px',
        scrollbarWidth: 'none'
      }}>
        {sortButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = sortOption === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => onSortChange(btn.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '600',
                border: isActive ? '1px solid var(--color-blue)' : '0.5px solid var(--color-border)',
                background: isActive ? 'var(--color-blue-light)' : '#ffffff',
                color: isActive ? 'var(--color-blue)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={12} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Flats List */}
      {flats.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '0.5px solid var(--color-border)'
        }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>No flats found matching your query.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddFlatClick}
            style={{ marginTop: '12px' }}
          >
            <Plus size={16} />
            <span>Add Your First Flat</span>
          </button>
        </div>
      ) : (
        flats.map((flat) => {
          let photos = [];
          try {
            photos = JSON.parse(flat.photos || '[]');
          } catch (e) {
            photos = [];
          }
          const thumb = getSafeImageUrl(photos[0]);

          return (
            <div
              key={flat.id}
              className="flat-card"
              onClick={() => onOpenFlat(flat.id)}
            >
              <div className="flat-card-img-row">
                <img
                  src={thumb}
                  alt={flat.flat_number}
                  className="flat-thumbnail"
                  onError={(e) => handleImageError(e)}
                />
                <div className="flat-card-info">
                  <div className="flat-card-title-row">
                    <span className="flat-number-title">{flat.flat_number}</span>
                    <StatusBadge status={flat.status} />
                  </div>
                  <div className="flat-address">{flat.address}</div>
                  <div className="flat-specs-row">
                    <span>{flat.bedrooms}</span>
                    <span>•</span>
                    <span>{flat.size}</span>
                  </div>
                  {flat.current_tenant_name && (
                    <div style={{ fontSize: '11.5px', color: 'var(--color-navy)', marginTop: '4px', fontWeight: '500' }}>
                      Tenant: <strong>{flat.current_tenant_name}</strong>
                      {flat.current_tenant_stays > 1 && (
                        <span style={{ marginLeft: '6px', color: 'var(--color-amber)', fontWeight: '700' }}>
                          (Repeat – {flat.current_tenant_stays}x)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flat-rent-row">
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Added: {flat.created_at ? flat.created_at.slice(0, 16) : 'N/A'}
                  </div>
                  <div className="flat-rent-amount" style={{ marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    PKR {Number(flat.daily_rate || Math.round(Number(flat.monthly_rent || 0) / 30)).toLocaleString()}
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>/day</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '400', marginLeft: '4px' }}>• PKR {Number(flat.monthly_rent).toLocaleString()}/mo</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFlatClick(flat);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-coral)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px'
                    }}
                    title="Delete Flat"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px' }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
