import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard } from 'lucide-react';

export default function UpdatePaymentModal({ isOpen, payment, onClose, onUpdatePayment }) {
  if (!isOpen || !payment) return null;

  const totalAmount = Number(payment.amount || 0);
  const currentPaid = Number(payment.paid_amount || 0);
  const currentBalance = Math.max(0, totalAmount - currentPaid);

  const [mode, setMode] = useState('full'); // 'full', 'partial', 'pending'
  const [customAmount, setCustomAmount] = useState(currentBalance > 0 ? currentBalance.toString() : totalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState(payment.payment_method || 'Cash');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      const bal = Math.max(0, Number(payment.amount || 0) - Number(payment.paid_amount || 0));
      setCustomAmount(bal > 0 ? bal.toString() : Number(payment.amount || 0).toString());
      setMode(bal > 0 ? 'full' : 'partial');
    }
  }, [payment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let payload = {
        payment_method: paymentMethod,
        paid_date: paidDate
      };

      if (mode === 'full') {
        payload.status = 'Paid';
        payload.paid_amount = totalAmount;
      } else if (mode === 'pending') {
        payload.status = 'Pending';
        payload.paid_amount = 0;
      } else {
        // Custom partial amount
        const parsed = parseFloat(customAmount);
        const newPaid = isNaN(parsed) ? currentPaid : (currentPaid + parsed);
        payload.paid_amount = newPaid;
        payload.status = newPaid >= totalAmount ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Pending');
      }

      await onUpdatePayment(payment.id, payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-navy)' }}>
              Update Rent Payment
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {payment.flat_number} • {payment.tenant_name} ({payment.month_year})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ fontSize: '13px' }}>
          {/* Summary Balance Card */}
          <div style={{
            background: 'var(--color-ice-subtle)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '14px',
            border: '0.5px solid rgba(14, 27, 60, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: '#64748B' }}>
              <span>Total Rent:</span>
              <strong style={{ color: 'var(--color-navy)' }}>PKR {totalAmount.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#0B6947' }}>
              <span>Already Collected:</span>
              <strong>PKR {currentPaid.toLocaleString()}</strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '0.5px dashed rgba(14, 27, 60, 0.15)',
              fontSize: '13px',
              color: currentBalance > 0 ? '#B45309' : '#0B6947',
              fontWeight: '700'
            }}>
              <span>Remaining Balance Due:</span>
              <span>PKR {currentBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Selector Mode */}
          <label className="form-label" style={{ fontWeight: '700', marginBottom: '8px' }}>
            Choose Payment Action:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setMode('full')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: mode === 'full' ? '2px solid var(--color-mint)' : '1px solid var(--color-border)',
                background: mode === 'full' ? 'var(--color-mint-light)' : '#FFFFFF',
                color: mode === 'full' ? '#0B6947' : 'var(--color-navy)',
                fontWeight: '700',
                fontSize: '11.5px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              ✓ Full Paid
            </button>

            <button
              type="button"
              onClick={() => setMode('partial')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: mode === 'partial' ? '2px solid var(--color-amber)' : '1px solid var(--color-border)',
                background: mode === 'partial' ? 'var(--color-amber-light)' : '#FFFFFF',
                color: mode === 'partial' ? '#B45309' : 'var(--color-navy)',
                fontWeight: '700',
                fontSize: '11.5px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              ½ Add Partial
            </button>

            <button
              type="button"
              onClick={() => setMode('pending')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: mode === 'pending' ? '2px solid var(--color-coral)' : '1px solid var(--color-border)',
                background: mode === 'pending' ? 'var(--color-coral-light)' : '#FFFFFF',
                color: mode === 'pending' ? '#B91C1C' : 'var(--color-navy)',
                fontWeight: '700',
                fontSize: '11.5px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              ⏳ Reset Unpaid
            </button>
          </div>

          {/* Conditional inputs */}
          {mode === 'full' && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--color-mint-light)',
              border: '0.5px solid var(--color-mint-border)',
              color: '#065F46',
              fontSize: '12px',
              marginBottom: '14px'
            }}>
              Marking full remaining balance of <strong>PKR {currentBalance.toLocaleString()}</strong> as collected. Rent will become <strong>Paid (100%)</strong>.
            </div>
          )}

          {mode === 'partial' && (
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label">Additional Amount Received Now (PKR):</label>
              <input
                type="number"
                min="1"
                max={currentBalance}
                className="form-input"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                required
                style={{ fontSize: '14px', fontWeight: '700' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', display: 'block' }}>
                New remaining balance will be: PKR {Math.max(0, currentBalance - Number(customAmount || 0)).toLocaleString()}
              </span>
            </div>
          )}

          {mode === 'pending' && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--color-coral-light)',
              border: '0.5px solid var(--color-coral-border)',
              color: '#991B1B',
              fontSize: '12px',
              marginBottom: '14px'
            }}>
              This will reset the payment status to <strong>Pending</strong> with PKR {totalAmount.toLocaleString()} due.
            </div>
          )}

          {mode !== 'pending' && (
            <>
              <div className="form-grid-2" style={{ marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Collection Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 2 }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Updating...' : 'Save & Sync Everywhere'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
