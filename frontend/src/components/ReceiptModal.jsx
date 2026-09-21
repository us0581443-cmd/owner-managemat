import React, { useState } from 'react';
import { X, Send, Printer, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { downloadReceiptPdf } from '../services/receiptPdf';

export default function ReceiptModal({ isOpen, receiptData, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !receiptData) return null;

  const totalAmount = Number(receiptData.amount || 0);
  const paidAmount = Number(
    receiptData.paid_amount !== undefined 
      ? receiptData.paid_amount 
      : (receiptData.amount_paid !== undefined ? receiptData.amount_paid : (receiptData.status === 'Paid' ? totalAmount : 0))
  );
  const balanceDue = Number(
    receiptData.balance_due !== undefined 
      ? receiptData.balance_due 
      : Math.max(0, totalAmount - paidAmount)
  );
  const status = receiptData.status || (balanceDue === 0 && paidAmount > 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending'));

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadReceiptPdf(receiptData, 'Rent_Receipt');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF: ' + (err.message || err));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    if (receiptData.waLink) {
      window.open(receiptData.waLink, '_blank');
      return;
    }

    const text = encodeURIComponent(
      `*RENT RECEIPT - NEST PROPERTIES*\n\n` +
      `Receipt No: #${receiptData.receipt_number || receiptData.receiptNumber || 'REC-CONFIRMED'}\n` +
      `Tenant: ${receiptData.tenant_name || receiptData.name || 'Tenant'}\n` +
      `Flat: ${receiptData.flat_number || 'N/A'}\n` +
      `Month: ${receiptData.month_year || 'Current Month'}\n` +
      `Total Rent: PKR ${totalAmount.toLocaleString()}\n` +
      `Amount Paid: PKR ${paidAmount.toLocaleString()}\n` +
      (balanceDue > 0 ? `Remaining Due: PKR ${balanceDue.toLocaleString()}\n` : '') +
      `Status: ${status.toUpperCase()}\n` +
      `Date: ${receiptData.paid_date || receiptData.payment_date || new Date().toISOString().split('T')[0]}\n\n` +
      `Thank you for choosing NEST Properties!`
    );

    const phone = (receiptData.tenant_phone || receiptData.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
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
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>
                Digital Rent Receipt / Bill
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {receiptData.receipt_number || receiptData.receiptNumber || 'Official Invoice'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px' }}>
          <div className="digital-receipt" id="printable-receipt">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: 'var(--color-blue)',
                    borderRadius: '6px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '13px'
                  }}>N</div>
                  <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--color-navy)', letterSpacing: '0.5px' }}>NEST</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Executive Property Management</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`receipt-stamp ${status === 'Partial' ? 'stamp-partial' : (status !== 'Paid' ? 'stamp-pending' : '')}`} style={
                  status === 'Partial'
                    ? { borderColor: '#D97706', color: '#D97706' }
                    : (status !== 'Paid' ? { borderColor: '#DC2626', color: '#DC2626' } : {})
                }>
                  {status === 'Paid' ? 'PAID' : (status === 'Partial' ? 'PARTIAL' : 'PENDING')}
                </span>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
                  {receiptData.receipt_number || receiptData.receiptNumber || 'REC-CONFIRMED'}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '14px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>TENANT</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receiptData.tenant_name || receiptData.name || 'Tenant'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>FLAT / UNIT</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receiptData.flat_number || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>BILLING MONTH</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receiptData.month_year || 'Current Month'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>PAYMENT METHOD</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receiptData.payment_method || 'Cash / Online'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>DATE ISSUED</span>
                <strong style={{ color: 'var(--color-navy)' }}>{receiptData.paid_date || receiptData.payment_date || new Date().toISOString().split('T')[0]}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>STATUS</span>
                <StatusBadge status={status} size="sm" />
              </div>
            </div>

            {/* Amount Box */}
            <div style={{
              background: status === 'Paid' ? 'var(--color-ice)' : (status === 'Partial' ? '#FFFBEB' : '#FEF2F2'),
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
              border: `1px solid ${status === 'Paid' ? '#c8deff' : (status === 'Partial' ? '#FDE68A' : '#FECACA')}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Rent</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)' }}>
                    PKR {totalAmount.toLocaleString()}
                  </div>
                </div>

                <div style={{ width: '1px', height: '32px', background: '#CBD5E1' }} />

                <div>
                  <div style={{ fontSize: '10.5px', color: status === 'Paid' ? 'var(--color-mint)' : '#B45309', fontWeight: '700', textTransform: 'uppercase' }}>
                    Amount Paid
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: status === 'Paid' ? 'var(--color-mint)' : '#B45309', fontFamily: 'var(--font-heading)' }}>
                    PKR {paidAmount.toLocaleString()}
                  </div>
                </div>

                {balanceDue > 0 && (
                  <>
                    <div style={{ width: '1px', height: '32px', background: '#CBD5E1' }} />
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#DC2626', fontWeight: '700', textTransform: 'uppercase' }}>Balance Due</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#DC2626' }}>
                        PKR {balanceDue.toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              Official digital receipt verified by NEST PMS. PDF export available below.
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-navy"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
            title="Download clean high-resolution PDF document"
          >
            <Download size={15} />
            <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            className="btn btn-mint"
            onClick={handleWhatsApp}
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
            title="Share receipt directly on WhatsApp"
          >
            <Send size={15} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ width: '100%', padding: '9px 10px', fontSize: '13px' }}
            title="Print or Save via Browser"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
