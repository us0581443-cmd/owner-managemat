import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Printer, Send, Download, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { downloadReceiptPdf } from '../services/receiptPdf';

export default function ReceiptModal({ isOpen, receipt, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !receipt) return null;

  const totalAmount = Number(receipt.amount || receipt.total_amount || 0);
  const paidAmount = Number(
    receipt.paid_amount !== undefined 
      ? receipt.paid_amount 
      : (receipt.amount_paid !== undefined ? receipt.amount_paid : (receipt.status === 'Paid' ? totalAmount : 0))
  );
  const balanceDue = Number(
    receipt.balance_due !== undefined 
      ? receipt.balance_due 
      : Math.max(0, totalAmount - paidAmount)
  );
  const status = receipt.status || (balanceDue === 0 && paidAmount > 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending'));
  const receiptNum = receipt.receipt_number || receipt.receiptNumber || 'REC-CONFIRMED';
  const paymentDate = receipt.paid_date || receipt.payment_date || receipt.due_date || new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadReceiptPdf(receipt, 'Rent_Receipt');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF: ' + (err.message || err));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    const text = `*RENT RECEIPT - NEST PROPERTIES*\n\n` +
      `Receipt No: #${receiptNum}\n` +
      `Date: ${paymentDate}\n` +
      `Flat: ${receipt.flat_number}\n` +
      `Tenant: ${receipt.tenant_name}\n` +
      `Month: ${receipt.month_year}\n` +
      `Total Rent: PKR ${totalAmount.toLocaleString()}\n` +
      `Amount Paid: PKR ${paidAmount.toLocaleString()}\n` +
      (balanceDue > 0 ? `Remaining Due: PKR ${balanceDue.toLocaleString()}\n` : '') +
      `Method: ${receipt.payment_method || 'Cash / Bank'}\n` +
      `Status: ${status.toUpperCase()} (Verified)\n\n` +
      `Thank you for choosing NEST Properties!`;

    const phone = (receipt.tenant_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: status === 'Paid' ? 'var(--color-mint-light)' : (status === 'Partial' ? '#FEF3C7' : '#FEE2E2'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: status === 'Paid' ? 'var(--color-mint)' : (status === 'Partial' ? '#D97706' : '#DC2626')
            }}>
              {status === 'Paid' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </div>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>
                Rent Payment Receipt / Bill
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Receipt #{receiptNum}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="corner-pdf-btn"
              style={{ position: 'static' }}
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              title="Download Official PDF Receipt"
            >
              <Download size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Printable Receipt Slip Card */}
          <div className="digital-receipt">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
                  NEST
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Executive Property Management
                </div>
              </div>
              <div className="receipt-stamp" style={
                status === 'Partial'
                  ? { borderColor: '#D97706', color: '#D97706' }
                  : (status !== 'Paid' ? { borderColor: '#DC2626', color: '#DC2626' } : {})
              }>
                {status === 'Paid' ? 'PAID' : (status === 'Partial' ? 'PARTIAL' : 'PENDING')}
              </div>
            </div>

            <div style={{ borderTop: '0.5px dashed var(--color-border)', margin: '12px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '14px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>Tenant Name:</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receipt.tenant_name || 'Resident'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>Flat / Unit:</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receipt.flat_number || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>Billing Month:</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receipt.month_year || 'Current Month'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>Payment Date:</span>
                <strong style={{ color: 'var(--color-navy)' }}>{paymentDate}</strong>
              </div>
            </div>

            <div style={{
              background: status === 'Paid' ? 'var(--color-ice)' : (status === 'Partial' ? '#FFFBEB' : '#FEF2F2'),
              padding: '14px',
              borderRadius: '8px',
              marginBottom: '14px',
              border: `1px solid ${status === 'Paid' ? '#c8deff' : (status === 'Partial' ? '#FDE68A' : '#FECACA')}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-navy)' }}>
                  Total Contract Rent:
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-navy)' }}>
                  PKR {totalAmount.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: status === 'Paid' ? 'var(--color-mint)' : '#B45309' }}>
                  Amount Received:
                </span>
                <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: status === 'Paid' ? 'var(--color-blue)' : '#B45309' }}>
                  PKR {paidAmount.toLocaleString()}
                </span>
              </div>

              {balanceDue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px dashed #CBD5E1', paddingTop: '4px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#DC2626' }}>
                    Remaining Balance Due:
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#DC2626' }}>
                    PKR {balanceDue.toLocaleString()}
                  </span>
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                Paid via: <strong>{receipt.payment_method || 'Cash / Bank'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94A3B8' }}>
              <span>Status: <StatusBadge status={status} size="sm" /></span>
              <span>Authorized System Seal: NEST</span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-mint btn-sm"
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: '600' }}
            onClick={handleWhatsApp}
            title="Share receipt directly on WhatsApp"
          >
            <Send size={14} />
            <span>Share WhatsApp</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: '600' }}
            onClick={handlePrint}
            title="Print or Save via Browser"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
