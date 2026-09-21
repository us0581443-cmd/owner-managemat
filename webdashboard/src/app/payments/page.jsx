'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import ReceiptModal from '@/components/ReceiptModal';
import Toast from '@/components/Toast';
import UpdatePaymentModal from '@/components/UpdatePaymentModal';
import { downloadReceiptPdf } from '@/services/receiptPdf';
import {
  CheckCircle2,
  Printer,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Wrench,
  Clock,
  X,
  Search,
  MessageCircle,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  Edit3,
  Download
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedPaymentForUpdate, setSelectedPaymentForUpdate] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [expenseForm, setExpenseForm] = useState({
    flat_id: '',
    title: '',
    category: 'Repairs & Plumber',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, expRes] = await Promise.all([
        api.getPayments(activeTab === 'Expenses' || activeTab === 'All' ? '' : activeTab),
        api.getExpenses()
      ]);
      setPayments(payRes.data || []);
      setExpenses(expRes.data || []);
    } catch (err) {
      console.error('Failed to load payments/expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(() => loadData(), 10000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [activeTab]);

  const handleMarkPaid = async (paymentId) => {
    try {
      await api.markPaymentPaid(paymentId, 'Cash / Bank Transfer');
      setToastMessage('Payment marked as PAID! Synced with database.');
      loadData();
      // Automatically open receipt
      const rec = await api.getReceipt(paymentId);
      if (rec.data) {
        setSelectedReceipt(rec.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to mark payment paid');
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, payload) => {
    try {
      const res = await api.updatePaymentStatus(paymentId, payload);
      setToastMessage(res.message || 'Payment updated and saved live!');
      await loadData();
      if (res.data?.payment?.paid_amount > 0) {
        const rec = await api.getReceipt(paymentId);
        if (rec.data) {
          setSelectedReceipt(rec.data);
          setIsReceiptOpen(true);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment');
    }
  };

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.getReceipt(paymentId);
      if (res.data) {
        setSelectedReceipt(res.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch receipt');
    }
  };

  const handleDirectDownloadPdf = async (payment) => {
    try {
      const res = await api.getReceipt(payment.id);
      if (res.data) {
        downloadReceiptPdf(res.data, 'Rent_Receipt');
        setToastMessage('Rent receipt PDF downloaded successfully!');
      } else {
        downloadReceiptPdf(payment, 'Rent_Bill');
        setToastMessage('Rent bill PDF downloaded successfully!');
      }
    } catch (err) {
      try {
        downloadReceiptPdf(payment, 'Rent_Bill');
        setToastMessage('Rent bill PDF downloaded successfully!');
      } catch (e) {
        alert('Failed to download PDF: ' + (e.message || e));
      }
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      alert('Please fill expense title and amount');
      return;
    }

    try {
      await api.addExpense(expenseForm);
      setIsExpenseModalOpen(false);
      setExpenseForm({
        flat_id: '',
        title: '',
        category: 'Repairs & Plumber',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setToastMessage('Building expense recorded successfully!');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleWhatsApp = (phone, payment) => {
    if (!phone) {
      alert('No phone number attached to this tenant.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*RENT REMINDER - NEST Property Management*\n` +
      `Flat: ${payment.flat_number}\n` +
      `Tenant: ${payment.tenant_name}\n` +
      `Month: ${payment.month_year}\n` +
      `Total Rent: PKR ${Number(payment.amount).toLocaleString()}\n` +
      `Paid So Far: PKR ${Number(payment.paid_amount || 0).toLocaleString()}\n` +
      `Remaining Due: PKR ${Number(payment.balance_due !== undefined ? payment.balance_due : (payment.amount - (payment.paid_amount || 0))).toLocaleString()}\n` +
      `Due Date: ${payment.due_date}\n` +
      `Status: ${payment.status.toUpperCase()}\n\n` +
      `Please clear your outstanding rent balance at your earliest convenience. Thank you!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.paid_amount !== undefined ? p.paid_amount : (p.status === 'Paid' ? p.amount : 0)), 0);
  const pendingRent = payments.reduce((acc, p) => acc + Math.max(0, Number(p.amount || 0) - Number(p.paid_amount !== undefined ? p.paid_amount : (p.status === 'Paid' ? p.amount : 0))), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const netOperating = totalCollected - totalExpenses;

  // Filter items by search query
  const filteredPayments = payments.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.flat_number && p.flat_number.toLowerCase().includes(q)) ||
      (p.tenant_name && p.tenant_name.toLowerCase().includes(q)) ||
      (p.month_year && p.month_year.toLowerCase().includes(q))
    );
  });

  const filteredExpenses = expenses.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.flat_number && e.flat_number.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      <ReceiptModal
        isOpen={isReceiptOpen}
        receipt={selectedReceipt}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* ====================================================================
          1. TOP HEADER & PRIMARY ACTION
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
            Financial Accounting & Rent Ledger
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Rent collections, digital WhatsApp receipts & building maintenance expenses
          </p>
        </div>

        <button
          type="button"
          className="btn btn-navy"
          onClick={() => setIsExpenseModalOpen(true)}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          <Plus size={15} />
          <span>Log Building Expense</span>
        </button>
      </div>

      {/* ====================================================================
          2. 4-METRIC FINANCIAL OVERVIEW STRIP
          ==================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ArrowUpRight size={13} color="#10B981" />
            Total Collected
          </span>
          <strong style={{ fontSize: '20px', color: 'var(--color-mint)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            PKR {totalCollected.toLocaleString()}
          </strong>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            Verified rent cashflow
          </span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Clock size={13} color="#F59E0B" />
            Pending Due
          </span>
          <strong style={{ fontSize: '20px', color: 'var(--color-coral)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            PKR {pendingRent.toLocaleString()}
          </strong>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            Outstanding invoices
          </span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <TrendingDown size={13} color="#E5594E" />
            Total Expenses
          </span>
          <strong style={{ fontSize: '20px', color: 'var(--color-navy)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            PKR {totalExpenses.toLocaleString()}
          </strong>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            Repairs & maintenance
          </span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Layers size={13} color="var(--color-blue)" />
            Net Cashflow
          </span>
          <strong style={{ fontSize: '20px', color: netOperating >= 0 ? 'var(--color-blue)' : 'var(--color-coral)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            PKR {netOperating.toLocaleString()}
          </strong>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            Net operating income
          </span>
        </div>
      </div>

      {/* ====================================================================
          3. SEARCH & TABS TOOLBAR
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
            { id: 'Pending', label: 'Pending Rent Dues' },
            { id: 'Partial', label: 'Partial Dues' },
            { id: 'Paid', label: 'Paid Collections' },
            { id: 'All', label: 'All Rent Invoices' },
            { id: 'Expenses', label: `Expenses (${expenses.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: activeTab === tab.id ? '1px solid var(--color-blue)' : '0.5px solid var(--color-border)',
                background: activeTab === tab.id ? 'var(--color-blue-light)' : '#ffffff',
                color: activeTab === tab.id ? 'var(--color-blue)' : 'var(--color-navy)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search tenant, flat, or month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', height: '36px', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* ====================================================================
          4. ENTERPRISE DATA TABLE
          ==================================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '0.5px solid var(--color-border)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {activeTab !== 'Expenses' ? (
          filteredPayments.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
              No rent payment records found for this view.
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Tenant Details</th>
                    <th>Billing Period</th>
                    <th>Due Date</th>
                    <th>Paid Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const isPending = p.status === 'Pending';

                    return (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ color: 'var(--color-navy)', fontSize: '14px' }}>
                            {p.flat_number}
                          </strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94A3B8' }}>
                            {p.building_name || 'Executive Heights'}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--color-navy)', fontSize: '13px' }}>
                            {p.tenant_name || 'Registered Tenant'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {p.tenant_phone || ''}
                          </div>
                        </td>

                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--color-navy)' }}>
                            {p.month_year}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '12px', color: isPending ? 'var(--color-coral)' : '#64748B' }}>
                            {p.due_date}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            {p.paid_date || '—'}
                          </span>
                        </td>

                        <td>
                          <strong style={{ color: 'var(--color-navy)', fontSize: '14.5px', fontFamily: 'var(--font-heading)' }}>
                            PKR {Number(p.amount).toLocaleString()}
                          </strong>
                          {p.status === 'Partial' && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#B45309', fontWeight: '600', marginTop: '2px' }}>
                              Paid: PKR {Number(p.paid_amount || 0).toLocaleString()} • Due: PKR {Number(p.balance_due !== undefined ? p.balance_due : (p.amount - (p.paid_amount || 0))).toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td>
                          <StatusBadge status={p.status} size="sm" />
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {p.status === 'Paid' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleOpenReceipt(p.id)}
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  title="View Printable Receipt"
                                >
                                  <FileText size={13} />
                                  <span>Receipt</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-navy btn-sm"
                                  onClick={() => handleDirectDownloadPdf(p)}
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  title="Download Official PDF Receipt"
                                >
                                  <Download size={13} />
                                  <span>PDF</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleWhatsApp(p.tenant_phone, p)}
                                  style={{ padding: '5px 10px', fontSize: '12px', color: '#10B981' }}
                                  title="Send WhatsApp Message"
                                >
                                  <MessageCircle size={13} />
                                  <span>WhatsApp</span>
                                </button>
                              </>
                            ) : p.status === 'Partial' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-mint btn-sm"
                                  onClick={() => handleMarkPaid(p.id)}
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  title="Clear Remaining Balance"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Clear Due</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setSelectedPaymentForUpdate(p)}
                                  style={{ padding: '5px 10px', fontSize: '12px', borderColor: 'var(--color-amber-border)', color: '#B45309' }}
                                  title="Update Status or Record Partial Payment"
                                >
                                  <Edit3 size={13} />
                                  <span>Update</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-navy btn-sm"
                                  onClick={() => handleDirectDownloadPdf(p)}
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  title="Download Partial Payment PDF Receipt"
                                >
                                  <Download size={13} />
                                  <span>PDF</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-mint btn-sm"
                                  onClick={() => handleMarkPaid(p.id)}
                                  style={{ padding: '5px 12px', fontSize: '12px' }}
                                  title="Mark 100% Paid"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Mark Paid</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setSelectedPaymentForUpdate(p)}
                                  style={{ padding: '5px 10px', fontSize: '12px', borderColor: 'var(--color-amber-border)', color: '#B45309' }}
                                  title="Update Status or Record Partial Payment"
                                >
                                  <Edit3 size={13} />
                                  <span>Update</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleDirectDownloadPdf(p)}
                                  style={{ padding: '5px 8px', fontSize: '12px' }}
                                  title="Download Rent Bill / Invoice"
                                >
                                  <Download size={13} />
                                  <span>Bill</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Maintenance Expenses Table */
          filteredExpenses.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
              No maintenance expense records logged yet.
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Title</th>
                    <th>Category</th>
                    <th>Property / Unit</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.expense_date}</td>
                      <td>
                        <strong style={{ color: 'var(--color-navy)' }}>{exp.title}</strong>
                      </td>
                      <td>
                        <span style={{
                          background: 'var(--color-ice-subtle)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          color: 'var(--color-blue)',
                          fontWeight: '600'
                        }}>
                          {exp.category}
                        </span>
                      </td>
                      <td>
                        {exp.flat_number ? (
                          <strong style={{ color: 'var(--color-navy)' }}>{exp.flat_number}</strong>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>General Building</span>
                        )}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '12px' }}>
                        {exp.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: 'var(--color-coral)', fontFamily: 'var(--font-heading)' }}>
                          - PKR {Number(exp.amount).toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ====================================================================
          5. LOG EXPENSE MODAL
          ==================================================================== */}
      {isExpenseModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: 'var(--color-navy)' }}>
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

            <form onSubmit={handleCreateExpense}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Geyser repair, Plumber labor, Electricity bill"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Amount (PKR) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="3500"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Expense Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={expenseForm.expense_date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="Repairs & Plumber">Repairs & Plumber</option>
                    <option value="Electrician & Wiring">Electrician & Wiring</option>
                    <option value="Painting & Polish">Painting & Polish</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                    <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
                    <option value="Security & Guard">Security & Guard</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Notes & Remarks</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Additional context about this expenditure..."
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-navy btn-sm"
                >
                  Save Expense Record
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
        onUpdatePayment={handleUpdatePaymentStatus}
      />
    </div>
  );
}
