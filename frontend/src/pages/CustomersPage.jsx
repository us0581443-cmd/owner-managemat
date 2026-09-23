import React, { useState } from 'react';
import {
  Search,
  Users,
  Phone,
  Briefcase,
  ShieldCheck,
  Eye,
  X,
  MessageCircle,
  Home,
  Download
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import UpdatePaymentModal from '../components/UpdatePaymentModal';
import { downloadReceiptPdf } from '../services/receiptPdf';

export default function CustomersPage({
  customers,
  searchQuery,
  onSearchChange,
  onSelectCustomer,
  onUpdatePaymentStatus,
  onOpenReceipt
}) {
  const [detailCustomerId, setDetailCustomerId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const activeCustomer = customers.find(c => c.id === detailCustomerId);

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = cleanDigits.startsWith('0') ? '92' + cleanDigits.slice(1) : cleanDigits;
    const text = `Assalam-o-Alaikum ${name}, this is from Property Management regarding your customer records.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)' }}>
            Customer Directory
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Permanent database of all tenants (current & past)
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search by customer name, CNIC, or phone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: '36px', height: '42px', fontSize: '13px' }}
        />
      </div>

      {/* Customer Cards List */}
      {customers.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 16px',
          textAlign: 'center',
          border: '0.5px solid var(--color-border)'
        }}>
          <Users size={32} color="#94A3B8" style={{ margin: '0 auto 8px auto' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>No customer records found.</p>
        </div>
      ) : (
        customers.map((c) => {
          const isRepeat = c.stays_count > 1;
          const activeStay = c.stays?.find(s => s.status === 'active');
          const lastStay = c.stays && c.stays.length > 0 ? c.stays[0] : null;
          const initials = c.name
            ? c.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
            : 'CU';

          return (
            <div
              key={c.id}
              style={{
                background: '#ffffff',
                border: '0.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Customer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0E1B3C 0%, #1E3A8A 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>
                        {c.name}
                      </h3>
                      <StatusBadge
                        status={isRepeat ? 'repeat' : 'new customer'}
                        text={c.badge}
                        size="sm"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      {activeStay ? (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          color: '#0B6947',
                          background: 'var(--color-mint-light)',
                          border: '0.5px solid var(--color-mint-border)',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }}></span>
                          Living in Flat {activeStay.flat_number}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '600',
                          color: '#64748B',
                          background: '#F1F5F9',
                          border: '0.5px solid #E2E8F0',
                          padding: '1px 7px',
                          borderRadius: '10px'
                        }}>
                          Past Guest
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                    Total Stays
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: isRepeat ? 'var(--color-amber)' : 'var(--color-blue)' }}>
                    {c.stays_count || (c.stays?.length || 0)}x
                  </span>
                </div>
              </div>

              {/* Essential Bio & Flat Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px',
                padding: '10px 12px',
                background: 'var(--color-ice-subtle)',
                borderRadius: '8px',
                marginTop: '12px',
                marginBottom: '12px',
                border: '0.5px solid rgba(14, 27, 60, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <Phone size={13} color="var(--color-blue)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: '600', color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.phone}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <ShieldCheck size={13} color="var(--color-blue)" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#475569', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    CNIC: <strong style={{ color: 'var(--color-navy)' }}>{c.cnic}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <Home size={13} color="var(--color-blue)" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#475569', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeStay ? (
                      <span style={{ color: '#0B6947', fontWeight: '700' }}>Flat {activeStay.flat_number}</span>
                    ) : lastStay ? (
                      <span>Last: Flat {lastStay.flat_number}</span>
                    ) : (
                      <span>No flat record</span>
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <Briefcase size={13} color="var(--color-blue)" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#475569', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.profession || 'Self Employed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: View Details + Call + WhatsApp */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDetailCustomerId(c.id)}
                  style={{
                    flex: 1,
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'transparent',
                    color: '#2563EB',
                    border: '1px solid #93C5FD',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Eye size={14} color="#2563EB" />
                  <span>View Details</span>
                </button>

                <a
                  href={`tel:${c.phone}`}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: '#ffffff',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-navy)',
                    fontSize: '12px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                  title="Call Customer"
                >
                  <Phone size={13} color="var(--color-blue)" />
                  <span>Call</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleWhatsApp(c.phone, c.name)}
                  style={{
                    height: '38px',
                    width: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#25D36615',
                    border: '0.5px solid #25D36640',
                    borderRadius: '8px',
                    color: '#25D366',
                    cursor: 'pointer'
                  }}
                  title="WhatsApp"
                >
                  <MessageCircle size={15} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Customer Full Detail Modal */}
      {activeCustomer && (
        <div
          className="modal-backdrop"
          onClick={() => setDetailCustomerId(null)}
          style={{ zIndex: 90 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                padding: '16px 20px',
                borderBottom: '0.5px solid var(--color-border)',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0E1B3C 0%, #1E3A8A 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {activeCustomer.name ? activeCustomer.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() : 'CU'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--color-navy)', margin: 0 }}>
                      {activeCustomer.name}
                    </h3>
                    <StatusBadge
                      status={activeCustomer.stays_count > 1 ? 'repeat' : 'new customer'}
                      text={activeCustomer.badge}
                      size="sm"
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    CNIC: <strong style={{ color: 'var(--color-navy)' }}>{activeCustomer.cnic}</strong> • Total Stays: <strong>{activeCustomer.stays_count || activeCustomer.stays?.length || 0}x</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailCustomerId(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div
              className="modal-body"
              style={{
                padding: '18px 20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {/* Quick Contact Box */}
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '12px',
                background: 'var(--color-ice-subtle)',
                borderRadius: '10px',
                border: '0.5px solid rgba(14, 27, 60, 0.08)',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                    Primary Contact Phone
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-navy)' }}>
                    {activeCustomer.phone}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`tel:${activeCustomer.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      background: '#ffffff',
                      border: '0.5px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-navy)',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={13} color="var(--color-blue)" />
                    Call
                  </a>
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(activeCustomer.phone, activeCustomer.name)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      background: '#25D366',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={13} />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Bio-Data & Employment */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'var(--color-navy)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  Bio-Data & Employment Details
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 14px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Father / Husband</span>
                    <strong style={{ color: 'var(--color-navy)' }}>{activeCustomer.father_husband_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Profession</span>
                    <strong style={{ color: 'var(--color-navy)' }}>{activeCustomer.profession || 'Self Employed'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Company / Employer</span>
                    <strong style={{ color: 'var(--color-navy)' }}>{activeCustomer.company || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Monthly Income</span>
                    <strong style={{ color: '#0B6947' }}>
                      {activeCustomer.monthly_income ? `PKR ${Number(activeCustomer.monthly_income).toLocaleString()}` : 'N/A'}
                    </strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', borderTop: '0.5px dashed rgba(14, 27, 60, 0.1)', paddingTop: '8px' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Permanent Address</span>
                    <span style={{ color: 'var(--color-navy)', fontWeight: '500' }}>{activeCustomer.permanent_address || 'N/A'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2', borderTop: '0.5px dashed rgba(14, 27, 60, 0.1)', paddingTop: '8px' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Emergency Contact</span>
                    <span style={{ color: 'var(--color-navy)', fontWeight: '600' }}>
                      {activeCustomer.emergency_contact_name
                        ? `${activeCustomer.emergency_contact_name} (${activeCustomer.emergency_contact_relation || 'Relation'}) — ${activeCustomer.emergency_contact_phone || 'No phone'}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete Tenancy History */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'var(--color-navy)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Tenancy Stay History</span>
                  <span style={{ color: '#64748B', fontWeight: '600' }}>
                    {activeCustomer.stays?.length || 0} Records
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeCustomer.stays && activeCustomer.stays.length > 0 ? (
                    activeCustomer.stays.map((stay) => (
                      <div
                        key={stay.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: stay.status === 'active' ? 'var(--color-mint-light)' : '#F8FAFC',
                          border: stay.status === 'active' ? '0.5px solid var(--color-mint-border)' : '0.5px solid rgba(14, 27, 60, 0.08)'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--color-navy)', fontSize: '12.5px' }}>{stay.flat_number}</strong>
                          <div style={{ color: '#64748B', fontSize: '11px', marginTop: '1px' }}>
                            {stay.check_in_date} {stay.check_out_date ? `to ${stay.check_out_date}` : 'to Present (Living)'}
                          </div>
                        </div>
                        <div>
                          {stay.status === 'active' ? (
                            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#0B6947', background: '#ffffff', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid var(--color-mint-border)' }}>
                              CURRENT LIVING
                            </span>
                          ) : (
                            <span style={{ fontSize: '10.5px', color: '#64748B', background: '#E2E8F0', padding: '3px 8px', borderRadius: '6px' }}>
                              PAST STAY
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94A3B8', padding: '10px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px' }}>
                      No recorded stays.
                    </div>
                  )}
                </div>
              </div>

              {/* Rent & Payment Records */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'var(--color-navy)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Rent & Payment Records</span>
                  <span style={{ color: '#64748B', fontWeight: '600' }}>
                    {activeCustomer.payments?.length || 0} Records
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeCustomer.payments && activeCustomer.payments.length > 0 ? (
                    activeCustomer.payments.map((p) => {
                      const isFullyPaid = p.status === 'Paid';
                      const isPartial = p.status === 'Partial';
                      const balDue = Number(p.balance_due !== undefined ? p.balance_due : (p.amount - (p.paid_amount || 0)));

                      return (
                        <div
                          key={p.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: isFullyPaid ? 'var(--color-mint-light)' : (isPartial ? 'var(--color-amber-light)' : 'var(--color-ice-subtle)'),
                            border: isFullyPaid ? '0.5px solid var(--color-mint-border)' : (isPartial ? '0.5px solid var(--color-amber-border)' : '0.5px solid rgba(14, 27, 60, 0.08)'),
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--color-navy)' }}>
                              {p.flat_number} • {p.month_year}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                              {isFullyPaid && (
                                <span style={{ color: '#0B6947', fontWeight: '600' }}>
                                  Fully Paid: PKR {Number(p.paid_amount || p.amount).toLocaleString()}
                                </span>
                              )}
                              {isPartial && (
                                <span style={{ color: '#B45309', fontWeight: '600' }}>
                                  Paid: PKR {Number(p.paid_amount || 0).toLocaleString()} • Due: PKR {balDue.toLocaleString()}
                                </span>
                              )}
                              {p.status === 'Pending' && (
                                <span style={{ color: '#B91C1C', fontWeight: '600' }}>
                                  Rent Due: PKR {Number(p.amount).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <StatusBadge status={p.status} size="sm" />
                            {!isFullyPaid ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPayment(p)}
                                style={{
                                  background: 'var(--color-blue)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Update Status
                              </button>
                            ) : (
                              onOpenReceipt && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReceipt(p.id)}
                                  style={{
                                    background: '#FFFFFF',
                                    color: 'var(--color-navy)',
                                    border: '0.5px solid rgba(14, 27, 60, 0.15)',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Receipt
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  downloadReceiptPdf(p, p.status === 'Paid' ? 'Rent_Receipt' : 'Rent_Bill');
                                } catch (e) {
                                  alert('Error generating PDF: ' + (e.message || e));
                                }
                              }}
                              title="Download PDF Document"
                              style={{
                                background: '#FFFFFF',
                                color: 'var(--color-navy)',
                                border: '0.5px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Download size={11} />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94A3B8', padding: '10px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px' }}>
                      No payment records found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                padding: '12px 20px',
                borderTop: '0.5px solid var(--color-border)',
                background: '#F8FAFC'
              }}
            >
              <button
                type="button"
                onClick={() => setDetailCustomerId(null)}
                style={{
                  padding: '8px 18px',
                  background: 'var(--color-navy)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Payment Update Modal */}
      <UpdatePaymentModal
        isOpen={!!selectedPayment}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onUpdatePayment={onUpdatePaymentStatus}
      />
    </div>
  );
}

