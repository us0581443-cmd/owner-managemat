'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, Building2, MapPin, UserCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';

export default function FlatCarouselRow({
  title,
  subtitle,
  iconType = 'hot',
  flats = [],
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
          const thumb = photos[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';
          const isRented = flat.status === 'Rented' || flat.status === 'Booked';

          return (
            <Link
              key={flat.id}
              href={`/flats/${flat.id}`}
              className="horizontal-card"
            >
              {/* Media Card Header with Frosted Glass Status Pill */}
              <div className="horizontal-card-media">
                <img src={thumb} alt={flat.flat_number} />
                <div className="card-gradient-overlay" />

                {/* Modern Frosted Glass Status Capsule with LED Pulsating Glow */}
                <div className={`card-status-pill ${isRented ? 'status-rented' : 'status-vacant'}`}>
                  <span className="status-indicator-dot" />
                  <span>{isRented ? 'Rented' : 'Vacant'}</span>
                </div>

                {/* Demand Level Glass Tag on Right */}
                {flat.demand_category === 'High Demand' && (
                  <div className="card-demand-glass hot">
                    <Star size={11} fill="#FBBF24" color="#FBBF24" />
                    <span>Top Rented</span>
                  </div>
                )}
                {flat.demand_category === 'Low Demand' && (
                  <div className="card-demand-glass cold">
                    <Clock size={11} />
                    <span>Vacant Long</span>
                  </div>
                )}

                {/* Bottom Media Title + BHK */}
                <div className="card-image-bottom-info">
                  <div className="card-flat-title">{flat.flat_number}</div>
                  <div className="card-bhk-tag">
                    {flat.bedrooms} BHK • {flat.size || '1,200 sqft'}
                  </div>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="horizontal-card-body">
                <div>
                  <div className="card-address-row">
                    <MapPin size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span>{flat.building_name || 'Executive Heights, Gulberg'}</span>
                  </div>

                  {/* Tenant Status or Available info */}
                  <div style={{ marginTop: '5px' }}>
                    {isRented ? (
                      <div className="card-tenant-row">
                        <UserCheck size={12} color="#1D4ED8" style={{ flexShrink: 0 }} />
                        <span>{flat.tenant_name || 'Active Tenant'}</span>
                      </div>
                    ) : (
                      <div className="card-available-row">
                        <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                        <span>Ready for Instant Check-in</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="card-footer-row">
                  <div>
                    <span className="card-price-val">
                      PKR {Number(flat.monthly_rent).toLocaleString()}
                    </span>
                    <span className="card-price-period">/mo</span>
                  </div>

                  <span className="card-view-btn">
                    <span>Manage</span>
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
