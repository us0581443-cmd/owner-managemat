'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import QuickDaysBookingModal from '@/components/QuickDaysBookingModal';
import Toast from '@/components/Toast';
import {
  Plus,
  Search,
  Trash2,
  Clock,
  DollarSign,
  ArrowDownAZ,
  CheckCircle,
  MapPin,
  Building2,
  UserPlus,
  UserCheck,
  Star,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Calendar
} from 'lucide-react';

const getCachedFlats = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('nest_cached_flats');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

function FlatsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  // Initialize immediately from cache so render is 0ms
  const [flats, setFlats] = useState(() => getCachedFlats());
  const [loading, setLoading] = useState(() => getCachedFlats().length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortOption, setSortOption] = useState('date');
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [bookingModalFlat, setBookingModalFlat] = useState(null);

  const fetchFlats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      const res = await api.getFlats(sortOption, searchQuery);
      if (res?.data) {
        setFlats(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nest_cached_flats', JSON.stringify(res.data));
        }
      }
    } catch (err) {
      console.error('Failed to load flats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const hasCache = flats.length > 0;
    fetchFlats(hasCache);

    // Live auto-polling every 12s when visible so network is fast and smooth
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchFlats(true);
      }
    }, 12000);

    const onFocus = () => fetchFlats(true);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [sortOption, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteFlat(deleteCandidate.id);
      setToastMessage(`Flat ${deleteCandidate.flat_number} deleted successfully`);
      setDeleteCandidate(null);
      fetchFlats(true);
    } catch (err) {
      alert(err.message || 'Failed to delete flat');
    }
  };

  const filteredFlats = flats.filter((f) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Occupied') return f.status === 'Booked' || f.status === 'Rented';
    if (filterStatus === 'Vacant') return f.status === 'Vacant';
    if (filterStatus === 'High Demand') return f.demand_category === 'High Demand';
    return true;
  });

  const occupiedCount = flats.filter(f => f.status === 'Booked' || f.status === 'Rented').length;
  const vacantCount = flats.filter(f => f.status === 'Vacant').length;
  const highDemandCount = flats.filter(f => f.demand_category === 'High Demand').length;

  return (
    <div>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      <ConfirmModal
        isOpen={!!deleteCandidate}
        title="Delete Property Unit"
        message={`Are you sure you want to delete ${deleteCandidate?.flat_number}? Past financial records will remain intact in the database.`}
        confirmText="Delete Property"
        confirmVariant="coral"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCandidate(null)}
      />

      {/* ====================================================================
          1. HEADER & PRIMARY ACTIONS
          ==================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
            Flats & Properties Portfolio
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {flats.length} total units registered • Live mobile-sync enabled
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchFlats(false)}
            disabled={isRefreshing}
            style={{ padding: '8px 14px', fontSize: '13px' }}
            title="Instant Live Sync with Mobile & Backend"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <Link
            href="/flats/add"
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>Add New Property</span>
          </Link>
        </div>
      </div>

      {/* ====================================================================
          2. PORTFOLIO QUICK STATS STRIP
          ==================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Units</span>
            <strong style={{ fontSize: '18px', color: 'var(--color-navy)', display: 'block' }}>{flats.length} Flats</strong>
          </div>
          <Building2 size={20} color="var(--color-blue)" />
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupied / Rented</span>
            <strong style={{ fontSize: '18px', color: 'var(--color-mint)', display: 'block' }}>{occupiedCount} Units</strong>
          </div>
          <UserCheck size={20} color="var(--color-mint)" />
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vacant Units</span>
            <strong style={{ fontSize: '18px', color: 'var(--color-coral)', display: 'block' }}>{vacantCount} Units</strong>
          </div>
          <UserPlus size={20} color="var(--color-coral)" />
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Demand</span>
            <strong style={{ fontSize: '18px', color: 'var(--color-amber)', display: 'block' }}>{highDemandCount} Units</strong>
          </div>
          <Star size={20} color="var(--color-amber)" fill="var(--color-amber)" />
        </div>
      </div>

      {/* ====================================================================
          3. SEARCH & CONTROLS TOOLBAR
          ==================================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '0.5px solid var(--color-border)',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Box */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search flat number, building name, floor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: `All (${flats.length})` },
            { id: 'Occupied', label: `Occupied (${occupiedCount})` },
            { id: 'Vacant', label: `Vacant (${vacantCount})` },
            { id: 'High Demand', label: `★ Top Rented (${highDemandCount})` },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterStatus(st.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: filterStatus === st.id ? '1px solid var(--color-blue)' : '0.5px solid var(--color-border)',
                background: filterStatus === st.id ? 'var(--color-blue-light)' : '#ffffff',
                color: filterStatus === st.id ? 'var(--color-blue)' : 'var(--color-navy)',
                transition: 'all 0.15s ease'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={14} color="#64748B" />
          <select
            className="form-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{ height: '38px', fontSize: '12.5px', padding: '0 28px 0 10px' }}
          >
            <option value="date">Date Added (Newest)</option>
            <option value="rent_desc">Rent: High to Low</option>
            <option value="rent_asc">Rent: Low to High</option>
            <option value="name_asc">Flat Number (A-Z)</option>
            <option value="status">Status (Occupancy)</option>
          </select>
        </div>
      </div>

      {/* ====================================================================
          4. DESKTOP PROPERTY GRID (3 Columns across)
          ==================================================================== */}
      {loading && flats.length === 0 ? (
        <div className="property-catalog-grid">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              style={{
                height: '340px',
                background: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                opacity: 0.8
              }}
            />
          ))}
        </div>
      ) : filteredFlats.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '48px 20px',
          textAlign: 'center',
          border: '0.5px solid var(--color-border)'
        }}>
          <Building2 size={36} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '4px' }}>
            No matching properties found
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
            Try adjusting your search keywords or filter status.
          </p>
          <Link href="/flats/add" className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Add New Property</span>
          </Link>
        </div>
      ) : (
        <div className="property-catalog-grid">
          {filteredFlats.map((flat) => {
            let photos = [];
            try {
              photos = JSON.parse(flat.photos || '[]');
            } catch (e) {
              photos = [];
            }
            const thumb = photos[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';
            const isBooked = flat.status === 'Rented' || flat.status === 'Booked';

            return (
              <div key={flat.id} className="property-web-card" style={{ position: 'relative' }}>
                {/* Image Hero with Badges */}
                <div className="property-img-hero">
                  <img src={thumb} alt={flat.flat_number} />
                  <div className="card-gradient-overlay" />

                  {/* Floating Status Pill */}
                  <div className="property-badge-floating">
                    <div className={`card-status-pill ${isBooked ? 'status-rented' : 'status-vacant'}`}>
                      <span className="status-indicator-dot" />
                      <span>{isBooked ? 'Occupied' : 'Vacant'}</span>
                    </div>
                  </div>

                  {/* High Demand Tag */}
                  {flat.demand_category === 'High Demand' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(14, 27, 60, 0.82)',
                      backdropFilter: 'blur(8px)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#FBBF24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 3
                    }}>
                      <Star size={11} fill="#FBBF24" />
                      <span>Top Rented</span>
                    </div>
                  )}

                  {/* Quick Delete Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteCandidate(flat);
                    }}
                    title="Delete Flat"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(14, 27, 60, 0.65)',
                      backdropFilter: 'blur(4px)',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ffffff',
                      padding: '6px',
                      borderRadius: '8px',
                      zIndex: 4
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Property Body */}
                <div className="property-body">
                  <div>
                    <h3 className="property-title">{flat.flat_number}</h3>
                    <div className="property-location">
                      <MapPin size={11} />
                      <span>{flat.building_name || 'Gulberg Heights'} • Floor {flat.floor || 1}</span>
                    </div>
                  </div>

                  {/* Specs Strip */}
                  <div className="property-specs-strip">
                    <span className="spec-item">{flat.bedrooms} BHK</span>
                    <span>•</span>
                    <span className="spec-item">{flat.size || '1,200 sqft'}</span>
                    <span>•</span>
                    <span className="spec-item">{flat.furnishing_status || 'Unfurnished'}</span>
                  </div>

                  {/* Tenant / Availability Box */}
                  <div style={{
                    padding: '8px 10px',
                    background: isBooked ? 'var(--color-ice-subtle)' : 'var(--color-mint-light)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    border: isBooked ? '0.5px solid rgba(14, 27, 60, 0.06)' : '0.5px solid var(--color-mint-border)'
                  }}>
                    {isBooked ? (
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Active Tenant:</span>
                        <span style={{ color: 'var(--color-navy)', fontWeight: '700' }}>
                          {flat.tenant_name || 'Registered Tenant'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-mint)', fontWeight: '700' }}>
                        ✓ Ready for Move-in
                      </span>
                    )}

                    {isBooked && (
                      <span style={{ fontSize: '10.5px', background: 'var(--color-blue-light)', color: 'var(--color-blue)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                        Lease Active
                      </span>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="property-action-bar">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span className="property-rent-val">
                          PKR {Number(flat.daily_rate || Math.round(Number(flat.monthly_rent || 0) / 30)).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>/day</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: '500' }}>
                        PKR {Number(flat.monthly_rent).toLocaleString()} /mo
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        href={`/flats/${flat.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Eye size={13} />
                        <span>Manage</span>
                      </Link>

                      {!isBooked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setBookingModalFlat(flat);
                          }}
                          className="btn btn-mint btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Calendar size={13} />
                          <span>Book Days</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <QuickDaysBookingModal
        isOpen={!!bookingModalFlat}
        flat={bookingModalFlat}
        onClose={() => setBookingModalFlat(null)}
      />
    </div>
  );
}

export default function FlatsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>Loading properties...</div>}>
      <FlatsContent />
    </Suspense>
  );
}
