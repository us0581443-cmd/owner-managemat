import React, { useState } from 'react';
import { Search, Users, Phone, Mail, MapPin, Calendar, Clock, ShieldCheck, ChevronRight, Briefcase, Download } from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
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
          const isExpanded = expandedId === c.id;
          const isRepeat = c.stays_count > 1;

          return (
            <div
              key={c.id}
              style={{
                background: '#ffffff',
                border: '0.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '14px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {/* Customer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)' }}>
                      {c.name}
                    </h3>
                    <StatusBadge
                      status={isRepeat ? 'repeat' : 'new customer'}
                      text={c.badge}
                      size="sm"
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    CNIC: <strong style={{ color: 'var(--color-navy)' }}>{c.cnic}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Stays</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: isRepeat ? 'var(--color-amber)' : 'var(--color-blue)' }}>
                    {c.stays_count}x
                  </span>
                </div>
              </div>

              {/* Bio Highlights */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px',
                padding: '10px 12px',
                background: 'var(--color-ice-subtle)',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '0.5px solid rgba(14, 27, 60, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} color="var(--color-blue)" />
                  <span>{c.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={13} color="var(--color-blue)" />
                  <span>{c.profession || 'Self Employed'}</span>
                </div>
              </div>

              {/* Flow E: Below each customer's card, their complete history is visible — which flat, from when to when */}
              <div style={{ borderTop: '0.5px dashed rgba(14, 27, 60, 0.12)', paddingTop: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: 'var(--color-navy)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <span>Tenancy History ({c.stays?.length || 0} Records)</span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(c.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                  >
                    {isExpanded ? 'Show Less' : 'Full Bio-Data'}
                  </button>
                </div>

                {c.stays && c.stays.length > 0 ? (
                  c.stays.map((stay) => (
                    <div
                      key={stay.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: stay.status === 'active' ? 'var(--color-mint-light)' : '#f8fafc',
                        marginBottom: '4px',
                        border: stay.status === 'active' ? '0.5px solid var(--color-mint-border)' : '0.5px solid rgba(14, 27, 60, 0.06)'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--color-navy)' }}>{stay.flat_number}</strong>
                        <span style={{ color: '#64748b', marginLeft: '6px' }}>
                          {stay.check_in_date} {stay.check_out_date ? `to ${stay.check_out_date}` : 'to Present (Living)'}
                        </span>
                      </div>
                      <div>
                        {stay.status === 'active' ? (
                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#0b6947' }}>CURRENT</span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>PAST STAY</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>No recorded stays.</div>
                )}
              </div>

              {/* Rent & Financial Payments Section */}
              <div style={{ borderTop: '0.5px dashed rgba(14, 27, 60, 0.12)', paddingTop: '10px', marginTop: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: 'var(--color-navy)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <span>Rent & Payment Records ({c.payments?.length || 0})</span>
                </div>

                {c.payments && c.payments.length > 0 ? (
                  c.payments.slice(0, 3).map((p) => {
                    const isFullyPaid = p.status === 'Paid';
                    const isPartial = p.status === 'Partial';
                    const balDue = Number(p.balance_due !== undefined ? p.balance_due : (p.amount - (p.paid_amount || 0)));

                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: isFullyPaid ? 'var(--color-mint-light)' : (isPartial ? 'var(--color-amber-light)' : 'var(--color-ice-subtle)'),
                          border: isFullyPaid ? '0.5px solid var(--color-mint-border)' : (isPartial ? '0.5px solid var(--color-amber-border)' : '0.5px solid rgba(14, 27, 60, 0.08)'),
                          marginBottom: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-navy)' }}>
                            {p.flat_number} • {p.month_year}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
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
                                Full Rent Due: PKR {Number(p.amount).toLocaleString()}
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
                                padding: '4px 8px',
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
                                  padding: '4px 8px',
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
                              background: '#F1F5F9',
                              color: 'var(--color-navy)',
                              border: '0.5px solid #CBD5E1',
                              borderRadius: '6px',
                              padding: '4px 7px',
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
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>No payment records found.</div>
                )}
              </div>

              {/* Expandable Extended Bio-Data */}
              {isExpanded && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: '0.5px solid rgba(14, 27, 60, 0.08)'
                }}>
                  <div style={{ marginBottom: '6px' }}><strong>Father/Husband:</strong> {c.father_husband_name || 'N/A'}</div>
                  <div style={{ marginBottom: '6px' }}><strong>Company:</strong> {c.company || 'N/A'}</div>
                  <div style={{ marginBottom: '6px' }}><strong>Monthly Income:</strong> PKR {c.monthly_income ? Number(c.monthly_income).toLocaleString() : 'N/A'}</div>
                  <div style={{ marginBottom: '6px' }}><strong>Permanent Address:</strong> {c.permanent_address || 'N/A'}</div>
                  <div style={{ marginBottom: '6px' }}><strong>Emergency Contact:</strong> {c.emergency_contact_name} ({c.emergency_contact_relation}) - {c.emergency_contact_phone}</div>
                </div>
              )}
            </div>
          );
        })
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
