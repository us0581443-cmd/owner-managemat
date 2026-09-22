'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import Toast from '@/components/Toast';
import UpdatePaymentModal from '@/components/UpdatePaymentModal';
import { downloadReceiptPdf } from '@/services/receiptPdf';
import {
  Search,
  Users,
  Phone,
  Briefcase,
  UserCheck,
  Building2,
  Calendar,
  Eye,
  MessageCircle,
  FileText,
  Star,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPaymentForUpdate, setSelectedPaymentForUpdate] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const handleUpdatePaymentStatus = async (paymentId, payload) => {
    try {
      const res = await api.updatePaymentStatus(paymentId, payload);
      setToastMessage(res.message || 'Payment updated and saved live!');
      await loadCustomers();
      if (selectedCustomer) {
        const refreshed = await api.getCustomer(selectedCustomer.id);
        setSelectedCustomer(refreshed.data);
      }
    } catch (err) {
      setToastMessage(err.message || 'Failed to update payment');
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers(searchQuery);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    const onFocus = () => loadCustomers();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(() => loadCustomers(), 10000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [searchQuery]);

  const currentlyLivingCount = customers.filter(c => c.stays && c.stays.some(s => s.status === 'active')).length;
  const repeatCount = customers.filter(c => c.stays_count > 1).length;
  const retentionRate = customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0;

  const filteredCustomers = customers.filter((c) => {
    if (filterType === 'All') return true;
    if (filterType === 'Living') return c.stays && c.stays.some(s => s.status === 'active');
    if (filterType === 'Repeat') return c.stays_count > 1;
    if (filterType === 'Past') return !c.stays || !c.stays.some(s => s.status === 'active');
    return true;
  });

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = cleanDigits.startsWith('0') ? '92' + cleanDigits.slice(1) : cleanDigits;
    const text = `Assalam-o-Alaikum ${name}, this is from NEST Property Management.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div>
      {/* ====================================================================
          1. HEADER
          ==================================================================== */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
          Customer Directory & Tenant CRM
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
          Permanent guest directory, historical stay records across all properties & repeat guest loyalty recognition
        </p>
      </div>

      {/* ====================================================================
          2. CRM STATS STRIP
          ==================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registered</span>
            <strong style={{ fontSize: '20px', color: 'var(--color-navy)', display: 'block', marginTop: '2px' }}>{customers.length} Tenants</strong>
          </div>
          <Users size={22} color="var(--color-blue)" />
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Currently Living</span>
            <strong style={{ fontSize: '20px', color: 'var(--color-mint)', display: 'block', marginTop: '2px' }}>{currentlyLivingCount} Active</strong>
          </div>
          <UserCheck size={22} color="var(--color-mint)" />
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repeat Tenants</span>
            <strong style={{ fontSize: '20px', color: 'var(--color-amber)', display: 'block', marginTop: '2px' }}>{repeatCount} Repeat</strong>
          </div>
          <Star size={22} color="var(--color-amber)" fill="var(--color-amber)" />
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repeat Rate</span>
            <strong style={{ fontSize: '20px', color: 'var(--color-blue)', display: 'block', marginTop: '2px' }}>{retentionRate}%</strong>
          </div>
          <ShieldCheck size={22} color="var(--color-blue)" />
        </div>
      </div>

      {/* ====================================================================
          3. SEARCH & FILTER TOOLBAR
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
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: `All (${customers.length})` },
            { id: 'Living', label: `Currently Living (${currentlyLivingCount})` },
            { id: 'Repeat', label: `★ Repeat Customers (${repeatCount})` },
            { id: 'Past', label: `Past Stays` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: filterType === tab.id ? '1px solid var(--color-blue)' : '0.5px solid var(--color-border)',
                background: filterType === tab.id ? 'var(--color-blue-light)' : '#ffffff',
                color: filterType === tab.id ? 'var(--color-blue)' : 'var(--color-navy)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search tenant, CNIC, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', height: '36px', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* ====================================================================
          4. ENTERPRISE CRM DATA TABLE
          ==================================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '0.5px solid var(--color-border)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
            <Users size={36} color="#CBD5E1" style={{ margin: '0 auto 8px auto' }} />
            <p>No customer records found matching your filters.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Customer / Tenant</th>
                  <th>CNIC Identity</th>
                  <th>Phone Contact</th>
                  <th>Current Flat Status</th>
                  <th>Rent & Payment Status</th>
                  <th>Total Stays</th>
                  <th>Profession & Company</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => {
                  const isRepeat = c.stays_count > 1;
                  const activeStay = c.stays ? c.stays.find(s => s.status === 'active') : null;
                  const latestPayment = c.payments && c.payments.length > 0 ? c.payments[0] : null;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isRepeat ? 'var(--color-amber-light)' : 'var(--color-blue-light)',
                            color: isRepeat ? 'var(--color-amber)' : 'var(--color-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '13px'
                          }}>
                            {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--color-navy)', fontSize: '13.5px' }}>
                              {c.name}
                            </div>
                            <div style={{ marginTop: '2px' }}>
                              <StatusBadge
                                status={isRepeat ? 'repeat' : 'new customer'}
                                text={c.badge}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--color-navy)', fontSize: '13px' }}>
                          {c.cnic}
                        </strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#10B981', fontWeight: '600' }}>
                          ✓ Verified
                        </span>
                      </td>

                      <td>
                        <div style={{ color: 'var(--color-navy)', fontSize: '13px', fontWeight: '500' }}>
                          {c.phone}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(c.phone, c.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#10B981',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <MessageCircle size={11} />
                          <span>WhatsApp</span>
                        </button>
                      </td>

                      <td>
                        {activeStay ? (
                          <div>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              background: 'var(--color-mint-light)',
                              color: 'var(--color-mint)',
                              border: '0.5px solid var(--color-mint-border)'
                            }}>
                              Living in {activeStay.flat_number}
                            </span>
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              Since {activeStay.check_in_date}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px' }}>
                            Vacated (Past Tenant)
                          </span>
                        )}
                      </td>

                      {/* Rent & Payment Status Column */}
                      <td>
                        {latestPayment ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <StatusBadge status={latestPayment.status} size="sm" />
                              {latestPayment.status !== 'Paid' && (
                                <button
                                  type="button"
                                  className="btn btn-mint btn-sm"
                                  onClick={() => setSelectedPaymentForUpdate(latestPayment)}
                                  style={{ padding: '2px 8px', fontSize: '10.5px' }}
                                >
                                  Pay / Update
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  try {
                                    downloadReceiptPdf(latestPayment, latestPayment.status === 'Paid' ? 'Rent_Receipt' : 'Rent_Bill');
                                    setToastMessage('PDF downloaded successfully!');
                                  } catch (err) {
                                    alert('Failed to download PDF: ' + (err.message || err));
                                  }
                                }}
                                style={{ padding: '2px 7px', fontSize: '10.5px' }}
                                title="Download PDF Bill / Receipt"
                              >
                                <Download size={11} />
                                <span>PDF</span>
                              </button>
                            </div>
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                              {latestPayment.status === 'Paid'
                                ? `PKR ${Number(latestPayment.paid_amount || latestPayment.amount).toLocaleString()} Paid`
                                : latestPayment.status === 'Partial'
                                ? `Paid PKR ${Number(latestPayment.paid_amount || 0).toLocaleString()} • Due PKR ${Number(latestPayment.balance_due !== undefined ? latestPayment.balance_due : (latestPayment.amount - (latestPayment.paid_amount || 0))).toLocaleString()}`
                                : `Due: PKR ${Number(latestPayment.amount).toLocaleString()}`}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px' }}>No payment records</span>
                        )}
                      </td>

                      <td>
                        <strong style={{ fontSize: '14px', fontFamily: 'var(--font-heading)', color: isRepeat ? 'var(--color-amber)' : 'var(--color-navy)' }}>
                          {c.stays_count} {c.stays_count === 1 ? 'Stay' : 'Stays'}
                        </strong>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--color-navy)', fontWeight: '500' }}>
                          {c.profession || 'Self Employed'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {c.company || '—'}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedCustomer(c)}
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                        >
                          <FileText size={13} />
                          <span>Full Bio-Data</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================================
          5. COMPLETE CUSTOMER PROFILE & STAY HISTORY MODAL
          ==================================================================== */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--color-navy)' }}>
                  {selectedCustomer.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  CNIC: {selectedCustomer.cnic} • {selectedCustomer.badge}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '13px' }}>
              {/* Bio Highlights */}
              <div style={{
                background: 'var(--color-ice-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px',
                border: '0.5px solid rgba(14, 27, 60, 0.08)'
              }}>
                <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                <div><strong>Profession:</strong> {selectedCustomer.profession || 'N/A'}</div>
                <div><strong>Company:</strong> {selectedCustomer.company || 'N/A'}</div>
                <div><strong>Monthly Income:</strong> PKR {selectedCustomer.monthly_income ? Number(selectedCustomer.monthly_income).toLocaleString() : 'N/A'}</div>
                <div><strong>Father/Husband:</strong> {selectedCustomer.father_husband_name || 'N/A'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Permanent Address:</strong> {selectedCustomer.permanent_address || 'N/A'}</div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Emergency:</strong> {selectedCustomer.emergency_contact_name} ({selectedCustomer.emergency_contact_relation}) - {selectedCustomer.emergency_contact_phone}
                </div>
              </div>

              {/* Complete Stays History */}
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Complete Tenancy History ({selectedCustomer.stays?.length || 0} Records)
                </h4>

                {selectedCustomer.stays && selectedCustomer.stays.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomer.stays.map((stay) => (
                      <div
                        key={stay.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: stay.status === 'active' ? 'var(--color-mint-light)' : '#ffffff',
                          border: stay.status === 'active' ? '0.5px solid var(--color-mint-border)' : '0.5px solid var(--color-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>
                            {stay.flat_number}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>
                            {stay.building_name || 'Executive Building'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {stay.check_in_date} {stay.check_out_date ? `to ${stay.check_out_date}` : 'to Present (Currently Residing)'}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: stay.status === 'active' ? 'var(--color-mint)' : '#E2E8F0',
                            color: stay.status === 'active' ? '#ffffff' : '#475569'
                          }}>
                            {stay.status === 'active' ? 'ACTIVE LEASE' : 'PAST STAY'}
                          </span>
                          {stay.rent_agreed && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-navy)', fontWeight: '600', marginTop: '4px' }}>
                              PKR {Number(stay.rent_agreed).toLocaleString()} /mo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>No stay records found.</div>
                )}
              </div>

              {/* Complete Rent & Financial Payments History */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rent Payment History & Financial Records ({selectedCustomer.payments?.length || 0})
                </h4>

                {selectedCustomer.payments && selectedCustomer.payments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomer.payments.map((p) => {
                      const isFullyPaid = p.status === 'Paid';
                      const isPartial = p.status === 'Partial';
                      const balDue = Number(p.balance_due !== undefined ? p.balance_due : (p.amount - (p.paid_amount || 0)));

                      return (
                        <div
                          key={p.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: isFullyPaid ? 'var(--color-mint-light)' : (isPartial ? 'var(--color-amber-light)' : '#FFFFFF'),
                            border: isFullyPaid ? '0.5px solid var(--color-mint-border)' : (isPartial ? '0.5px solid var(--color-amber-border)' : '0.5px solid var(--color-border)'),
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '13.5px', color: 'var(--color-navy)' }}>
                              {p.flat_number} • {p.month_year}
                            </strong>
                            <div style={{ fontSize: '12px', marginTop: '2px' }}>
                              {isFullyPaid && (
                                <span style={{ color: '#0B6947', fontWeight: '600' }}>
                                  Fully Paid: PKR {Number(p.paid_amount || p.amount).toLocaleString()} ({p.payment_method || 'Cash'}) on {p.paid_date}
                                </span>
                              )}
                              {isPartial && (
                                <span style={{ color: '#B45309', fontWeight: '600' }}>
                                  Paid: PKR {Number(p.paid_amount || 0).toLocaleString()} • Balance Due: PKR {balDue.toLocaleString()}
                                </span>
                              )}
                              {p.status === 'Pending' && (
                                <span style={{ color: '#B91C1C', fontWeight: '600' }}>
                                  Full Rent Due: PKR {Number(p.amount).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StatusBadge status={p.status} size="sm" />
                            {!isFullyPaid && (
                              <button
                                type="button"
                                className="btn btn-mint btn-sm"
                                onClick={() => setSelectedPaymentForUpdate(p)}
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                Update Payment
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                try {
                                  downloadReceiptPdf(p, isFullyPaid ? 'Rent_Receipt' : 'Rent_Bill');
                                  setToastMessage('PDF downloaded successfully!');
                                } catch (err) {
                                  alert('Failed to download PDF: ' + (err.message || err));
                                }
                              }}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Download PDF Document"
                            >
                              <Download size={12} />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>No payment records found.</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-navy btn-sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close Customer Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Payment Update Modal */}
      <UpdatePaymentModal
        isOpen={!!selectedPaymentForUpdate}
        payment={selectedPaymentForUpdate}
        onClose={() => setSelectedPaymentForUpdate(null)}
        onUpdatePayment={handleUpdatePaymentStatus}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
