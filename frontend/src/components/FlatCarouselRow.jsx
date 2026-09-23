import React from 'react';
import {
  Star,
  Clock,
  Building2,
  ArrowUpRight,
  MapPin,
  UserCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { getSafeImageUrl, handleImageError } from '../utils/imageHelper';

export default function FlatCarouselRow({
  title,
  subtitle,
  iconType = 'all', // 'hot', 'cold', 'all'
  flats = [],
  onOpenFlat,
  badgeType = 'default' // 'hot', 'cold', 'default'
}) {
  if (!flats || flats.length === 0) return null;

  return (
    <div className="flats-section-container">
      {/* Section Header with Gradient Icon & Title */}
      <div className="flats-section-header">
        <div className="section-title-group">
          <div className={`section-icon-badge ${iconType}`}>
            {iconType === 'hot' && <Star size={18} fill="#F59E0B" color="#F59E0B" strokeWidth={1.35} />}
            {iconType === 'cold' && <Clock size={19} strokeWidth={1.35} />}
            {iconType === 'all' && <Building2 size={19} strokeWidth={1.35} />}
          </div>
          <div>
            <div className="section-title-text">{title}</div>
            <div className="section-subtitle-text">{subtitle}</div>
          </div>
        </div>
      </div>

      {/* Horizontal Sliding Track (Smooth Gesture Swipe, Scrollbar Hidden) */}
      <div className="horizontal-carousel-track">
        {flats.map((flat) => {
          let photos = [];
          try {
            photos = JSON.parse(flat.photos || '[]');
          } catch (e) {
            photos = [];
          }
          const thumb = getSafeImageUrl(photos[0]);
          const timesRented = flat.times_rented || 0;
          const statusLower = (flat.status || '').toLowerCase();
          const isRented = statusLower === 'booked' || statusLower === 'occupied' || Boolean(flat.tenant_name);

          return (
            <div
              key={flat.id}
              className="horizontal-card"
              onClick={() => onOpenFlat(flat.id)}
            >
              {/* Media Thumbnail with Floating Glassmorphic Badges */}
              <div className="horizontal-card-media">
                <img
                  src={thumb}
                  alt={flat.flat_number}
                  loading="lazy"
                  onError={(e) => handleImageError(e)}
                />
                <div className="card-gradient-overlay" />

                {/* Professional Glassmorphism Status Badge (Rented vs Vacant) */}
                <div className={`card-status-pill ${isRented ? 'status-rented' : 'status-vacant'}`}>
                  <span className="status-indicator-dot" />
                  <span>{isRented ? 'Rented' : 'Vacant'}</span>
                </div>

                {/* Demand Glass Tag top-right */}
                {badgeType === 'hot' && (
                  <span className="card-demand-glass hot">
                    <Star size={11} fill="#FBBF24" color="#FBBF24" />
                    <span>{timesRented > 1 ? `Rented ${timesRented}x` : 'Top Demand'}</span>
                  </span>
                )}
                {badgeType === 'cold' && (
                  <span className="card-demand-glass cold">
                    <Clock size={11} />
                    <span>{timesRented === 0 ? 'Vacant Now' : `${timesRented} Stay`}</span>
                  </span>
                )}
                {badgeType === 'default' && (
                  <span className="card-demand-glass default">
                    <span>{timesRented} Stays</span>
                  </span>
                )}

                {/* Bottom Image Caption */}
                <div className="card-image-bottom-info">
                  <div className="card-flat-title">{flat.flat_number}</div>
                  <span className="card-bhk-tag">{flat.bedrooms || 'Flat'}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="horizontal-card-body">
                {/* Location row */}
                <div className="card-address-row" title={flat.address}>
                  <MapPin size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {flat.address}
                  </span>
                </div>

                {/* Occupancy state row */}
                {isRented && flat.tenant_name ? (
                  <div className="card-tenant-row">
                    <UserCheck size={12} color="#1D4ED8" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {flat.tenant_name}
                    </span>
                  </div>
                ) : (
                  <div className="card-available-row">
                    <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>Available for Tenant</span>
                  </div>
                )}

                {/* Pricing & Manage Action */}
                <div className="card-footer-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <span className="card-price-val">PKR {Number(flat.daily_rate || Math.round(Number(flat.monthly_rent || 0) / 30)).toLocaleString()}</span>
                      <span className="card-price-period">/day</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: '500' }}>
                      PKR {Number(flat.monthly_rent).toLocaleString()} /mo
                    </span>
                  </div>

                  <span className="card-view-btn">
                    <span>Manage</span>
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
