import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Send, Printer, Plus, Wrench, Edit3, Download } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import UpdatePaymentModal from '../components/UpdatePaymentModal';
import { downloadReceiptPdf } from '../services/receiptPdf';

export default function PaymentsPage({
  payments,
  statusFilter,
  onStatusFilterChange,
  onMarkPaid,
  onOpenReceipt,
  onLogExpense,
  expenses = [],
  onUpdatePaymentStatus
}) {
  const [activeSubTab, setActiveSubTab] = useState('rent'); // 'rent' or 'expenses'
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedPaymentForUpdate, setSelectedPaymentForUpdate] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Plumbing',
    amount: '',
    notes: '',
  });

  const filterTabs = ['All', 'Paid', 'Partial', 'Pending', 'Late'];

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;
    onLogExpense(expenseForm);
    setExpenseForm({ title: '', category: 'Plumbing', amount: '', notes: '' });
    setIsExpenseModalOpen(false);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)' }}>
            Financial Tracking
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Rent collections & property maintenance expenses
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIsExpenseModalOpen(true)}
        >
          <Plus size={14} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Sub Tabs: Rent Collections vs Maintenance Expenses */}
      <div style={{
        display: 'flex',
        background: '#e2e8f0',
        borderRadius: '10px',
        padding: '3px',
        marginBottom: '16px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('rent')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeSubTab === 'rent' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'rent' ? 'var(--color-navy)' : '#64748b',
            boxShadow: activeSubTab === 'rent' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          Rent Payments ({payments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeSubTab === 'expenses' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'expenses' ? 'var(--color-navy)' : '#64748b',
            boxShadow: activeSubTab === 'expenses' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          Maintenance Expenses ({expenses.length})
        </button>
      </div>

      {activeSubTab === 'rent' ? (
        <div>
          {/* Status Filter Tabs (2.6: Paid [Mint], Pending [Amber], Late [Coral]) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
            {filterTabs.map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusFilterChange(status)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-navy)' : '#ffffff',
                    color: isActive ? '#ffffff' : '#64748b',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.15s'
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* Payments List */}
          {payments.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '36px 16px',
              textAlign: 'center',
              border: '0.5px solid var(--color-border)'
            }}>
              <p style={{ color: '#64748b', fontSize: '13.5px' }}>No payments found for this filter.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '12px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                {/* Elegant Corner PDF Icon Button */}
                <button
                  type="button"
                  className="corner-pdf-btn"
                  onClick={() => {
                    try {
                      downloadReceiptPdf(payment, payment.status === 'Paid' ? 'Rent_Receipt' : 'Rent_Invoice');
                    } catch (e) {
                      alert('Error generating PDF: ' + (e.message || e));
                    }
                  }}
                  title="Download PDF"
                >
                  <Download size={13} />
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '36px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--color-navy)' }}>
                        {payment.flat_number}
                      </strong>
                      <span style={{
                        fontSize: '11px',
                        color: '#64748B',
                        background: '#F1F5F9',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-xs)'
                      }}>
                        {payment.building_name || 'Unit'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '3px', fontWeight: '500' }}>
                      Tenant: <strong>{payment.tenant_name}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                      Billing: {payment.month_year} • Due: {payment.due_date}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--color-navy)' }}>
                      PKR {Number(payment.amount).toLocaleString()}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <StatusBadge status={payment.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #F1F5F9',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {payment.status === 'Paid' ? (
                    <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: '500' }}>
                      Paid on: <strong>{payment.paid_date}</strong> via {payment.payment_method || 'Cash'}
                    </div>
                  ) : payment.status === 'Partial' ? (
                    <div style={{ fontSize: '11.5px', color: '#B45309', fontWeight: '600' }}>
                      Paid: PKR {Number(payment.paid_amount || 0).toLocaleString()} • Due: PKR {Number(payment.balance_due !== undefined ? payment.balance_due : (payment.amount - (payment.paid_amount || 0))).toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: '600' }}>
                      Rent collection pending
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {payment.status === 'Paid' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenReceipt(payment.id)}
                      >
                        <Printer size={13} />
                        <span>Receipt</span>
                      </button>
                    ) : payment.status === 'Partial' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-mint btn-sm"
                          onClick={() => onMarkPaid(payment.id)}
                        >
                          <CheckCircle2 size={13} />
                          <span>Clear Due</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPaymentForUpdate(payment)}
                          style={{ borderColor: 'var(--color-amber-border)', color: '#B45309' }}
                        >
                          <Edit3 size={13} />
                          <span>Update</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-mint btn-sm"
                          onClick={() => onMarkPaid(payment.id)}
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark Paid</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPaymentForUpdate(payment)}
                          style={{ borderColor: '#E2E8F0', color: 'var(--color-navy)' }}
                        >
                          <Edit3 size={13} />
                          <span>Update</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Expenses List */
        <div>
          {expenses.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '36px 16px',
              textAlign: 'center',
              border: '0.5px solid var(--color-border)'
            }}>
              <p style={{ color: '#64748b', fontSize: '13.5px' }}>No maintenance expenses logged yet.</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                style={{
                  background: '#ffffff',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>
                      {exp.title}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Category: {exp.category} {exp.flat_number ? `• Flat: ${exp.flat_number}` : '• General Building'}
                    </div>
                    {exp.notes && (
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                        "{exp.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-coral)' }}>
                      - PKR {Number(exp.amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {exp.expense_date}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Log Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)' }}>
                Log Maintenance Expense
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sanitary repair, Water pump overhaul"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Painting">Painting</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Tax/Govt">Tax / Govt</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (PKR) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 8500"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Repair details or mechanic name"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Payment Update Modal */}
      <UpdatePaymentModal
        isOpen={!!selectedPaymentForUpdate}
        payment={selectedPaymentForUpdate}
        onClose={() => setSelectedPaymentForUpdate(null)}
        onUpdatePayment={onUpdatePaymentStatus}
      />
    </div>
  );
}
