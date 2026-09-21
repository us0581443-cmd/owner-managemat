import React from 'react';
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Wallet,
  ArrowDownRight,
  UserPlus,
  Wrench
} from 'lucide-react';
import FlatCarouselRow from '../components/FlatCarouselRow';

export default function DashboardPage({ stats, onNavigate, onOpenFlat, onMarkPaidQuick }) {
  if (!stats) return <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>Loading Dashboard...</div>;

  const mostRented = stats.mostRentedFlats || [];
  const leastRented = stats.leastRentedFlats || [];
  const allFlats = stats.allFlats || [];

  return (
    <div>
      {/* ====================================================================
          1. COMPACT EXECUTIVE BALANCE CARD (Fintech Grade)
          ==================================================================== */}
      <div className="exec-card">
        <div className="exec-card-header">
          <span className="exec-card-caption">
            <TrendingUp size={12} color="#93c5fd" />
            <span>Net Monthly Profit</span>
          </span>
          <span className="exec-card-pill">
            <span style={{ fontSize: '8px' }}>●</span>
            <span>{stats.occupiedFlats}/{stats.totalFlats} Flats ({stats.occupancyRate}%)</span>
          </span>
        </div>

        <div className="exec-balance-amount">
          PKR {stats.netProfit.toLocaleString()}
        </div>

        <div className="exec-metrics-row">
          <div className="exec-metric-col">
            <span className="exec-metric-title">
              <ArrowUpRight size={10} color="#34d399" />
              <span>Income</span>
            </span>
            <span className="exec-metric-value" style={{ color: '#34d399' }}>
              PKR {stats.totalIncome.toLocaleString()}
            </span>
          </div>

          <div className="exec-metric-col">
            <span className="exec-metric-title">
              <ArrowDownRight size={10} color="#f87171" />
              <span>Expenses</span>
            </span>
            <span className="exec-metric-value" style={{ color: '#f87171' }}>
              PKR {stats.expenses.toLocaleString()}
            </span>
          </div>

          <div className="exec-metric-col">
            <span className="exec-metric-title">
              <AlertCircle size={10} color="#fbbf24" />
              <span>Rent Due</span>
            </span>
            <span className="exec-metric-value" style={{ color: stats.rentDueCount > 0 ? '#fbbf24' : '#94a3b8' }}>
              PKR {stats.rentDueAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. MINIMAL 4-ICON QUICK ACTIONS STRIP
          ==================================================================== */}
      <div className="quick-actions-strip">
        <button
          type="button"
          className="quick-action-card"
          onClick={() => onNavigate('add-flat')}
        >
          <div className="quick-action-icon add-flat">
            <Plus size={19} strokeWidth={1.35} />
          </div>
          <span className="quick-action-label">Add Flat</span>
        </button>

        <button
          type="button"
          className="quick-action-card"
          onClick={() => onNavigate('payments')}
        >
          <div className="quick-action-icon collect-rent">
            <Wallet size={19} strokeWidth={1.35} />
          </div>
          <span className="quick-action-label">Collect Rent</span>
        </button>

        <button
          type="button"
          className="quick-action-card"
          onClick={() => onNavigate('flats')}
        >
          <div className="quick-action-icon checkin">
            <UserPlus size={19} strokeWidth={1.35} />
          </div>
          <span className="quick-action-label">Check-in</span>
        </button>

        <button
          type="button"
          className="quick-action-card"
          onClick={() => onNavigate('payments')}
        >
          <div className="quick-action-icon expense">
            <Wrench size={19} strokeWidth={1.35} />
          </div>
          <span className="quick-action-label">Expense</span>
        </button>
      </div>

      {/* ====================================================================
          4. SECTION 1: MOST RENTED OUT FLATS (Sab Se Zyada Rent Out Huay)
          ==================================================================== */}
      <FlatCarouselRow
        title="Top Rented Properties"
        subtitle="Flats with highest rental demand & occupancy history"
        iconType="hot"
        badgeType="hot"
        flats={mostRented}
        onOpenFlat={onOpenFlat}
      />

      {/* ====================================================================
          5. SECTION 2: LEAST RENTED OUT FLATS (Kam Se Kam Rent Out Huay)
          ==================================================================== */}
      <FlatCarouselRow
        title="Low Demand & Vacant Attention"
        subtitle="Flats needing attention or with lowest rental frequency"
        iconType="cold"
        badgeType="cold"
        flats={leastRented}
        onOpenFlat={onOpenFlat}
      />

      {/* ====================================================================
          6. SECTION 3: ALL FLATS PORTFOLIO (Tamam Flats Complete Row)
          ==================================================================== */}
      <FlatCarouselRow
        title="All Flats Portfolio"
        subtitle="Complete inventory with specifications and status"
        iconType="all"
        badgeType="default"
        flats={allFlats}
        onOpenFlat={onOpenFlat}
      />
    </div>
  );
}
