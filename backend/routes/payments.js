const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');

// GET /api/payments - List payments with filters for current owner
router.get('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { status, flat_id } = req.query;

    let sql = `
      SELECT p.*,
             (p.amount - COALESCE(p.paid_amount, 0)) as balance_due,
             f.flat_number,
             f.address as flat_address,
             c.name as tenant_name,
             c.phone as tenant_phone,
             c.cnic as tenant_cnic
      FROM payments p
      JOIN flats f ON p.flat_id = f.id
      JOIN customers c ON p.customer_id = c.id
    `;

    const conditions = ['p.owner_id = ?'];
    const params = [ownerId];

    if (status && status !== 'All') {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (flat_id) {
      conditions.push('p.flat_id = ?');
      params.push(flat_id);
    }

    sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY p.id DESC';

    const payments = query(sql, params);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/payments/:id/update-status - Update Payment Status / Record Payment
router.post('/:id/update-status', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    let { status, paid_amount, additional_amount, payment_method = 'Cash', paid_date } = req.body;

    const payment = get('SELECT * FROM payments WHERE id = ? AND owner_id = ?', [id, ownerId]);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    const today = paid_date || new Date().toISOString().split('T')[0];
    let newPaidAmount = payment.paid_amount || 0;

    if (additional_amount !== undefined && !isNaN(parseFloat(additional_amount))) {
      newPaidAmount += parseFloat(additional_amount);
    } else if (paid_amount !== undefined && !isNaN(parseFloat(paid_amount))) {
      newPaidAmount = parseFloat(paid_amount);
    } else if (status === 'Paid') {
      newPaidAmount = payment.amount;
    } else if (status === 'Pending') {
      newPaidAmount = 0;
    }

    // Resolve final status based on newPaidAmount
    let newStatus = status;
    if (newPaidAmount >= payment.amount) {
      newStatus = 'Paid';
      newPaidAmount = payment.amount;
    } else if (newPaidAmount > 0) {
      newStatus = 'Partial';
    } else {
      newStatus = 'Pending';
      newPaidAmount = 0;
    }

    let receiptNumber = payment.receipt_number;
    if (newPaidAmount > 0 && !receiptNumber) {
      receiptNumber = `REC-${new Date().getFullYear()}-${String(payment.id).padStart(4, '0')}`;
    }

    run(`
      UPDATE payments
      SET status = ?,
          paid_amount = ?,
          paid_date = ?,
          payment_method = ?,
          receipt_number = ?
      WHERE id = ? AND owner_id = ?
    `, [
      newStatus,
      newPaidAmount,
      newPaidAmount > 0 ? today : null,
      newPaidAmount > 0 ? payment_method : null,
      newPaidAmount > 0 ? receiptNumber : null,
      id,
      ownerId
    ]);

    const updatedPayment = get(`
      SELECT p.*,
             (p.amount - COALESCE(p.paid_amount, 0)) as balance_due,
             f.flat_number,
             f.address as flat_address,
             c.name as tenant_name,
             c.phone as tenant_phone,
             c.cnic as tenant_cnic
      FROM payments p
      JOIN flats f ON p.flat_id = f.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ? AND p.owner_id = ?
    `, [id, ownerId]);

    // WhatsApp text
    const balanceText = updatedPayment.balance_due > 0
      ? `\nRemaining Balance Due: PKR ${updatedPayment.balance_due.toLocaleString()}`
      : '';
    const waText = encodeURIComponent(
      `*RENT RECEIPT - NEST Property Management*\n` +
      `Receipt #: ${receiptNumber || 'N/A'}\n` +
      `Flat: ${updatedPayment.flat_number}\n` +
      `Tenant: ${updatedPayment.tenant_name}\n` +
      `Month: ${updatedPayment.month_year}\n` +
      `Total Rent: PKR ${updatedPayment.amount.toLocaleString()}\n` +
      `Amount Paid: PKR ${updatedPayment.paid_amount.toLocaleString()}${balanceText}\n` +
      `Payment Date: ${today}\n` +
      `Method: ${updatedPayment.payment_method || payment_method}\n` +
      `Status: ${newStatus.toUpperCase()}\n\n` +
      `Thank you!`
    );

    const waLink = updatedPayment.tenant_phone
      ? `https://wa.me/${updatedPayment.tenant_phone.replace(/[^0-9]/g, '')}?text=${waText}`
      : `https://wa.me/?text=${waText}`;

    res.json({
      success: true,
      message: `Payment updated to ${newStatus}! (Paid: PKR ${newPaidAmount.toLocaleString()})`,
      data: {
        payment: updatedPayment,
        receiptNumber,
        waLink,
        receiptDate: today
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/payments/:id/mark-paid - Mark Rent as Paid
router.post('/:id/mark-paid', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    const { payment_method = 'Cash' } = req.body;

    const payment = get('SELECT * FROM payments WHERE id = ? AND owner_id = ?', [id, ownerId]);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${String(payment.id).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    run(`
      UPDATE payments
      SET status = 'Paid',
          paid_amount = amount,
          paid_date = ?,
          payment_method = ?,
          receipt_number = ?
      WHERE id = ? AND owner_id = ?
    `, [today, payment_method, receiptNumber, id, ownerId]);

    const updatedPayment = get(`
      SELECT p.*,
             (p.amount - COALESCE(p.paid_amount, 0)) as balance_due,
             f.flat_number,
             f.address as flat_address,
             c.name as tenant_name,
             c.phone as tenant_phone,
             c.cnic as tenant_cnic
      FROM payments p
      JOIN flats f ON p.flat_id = f.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ? AND p.owner_id = ?
    `, [id, ownerId]);

    // Build prefilled WhatsApp share text
    const waText = encodeURIComponent(
      `*RENT RECEIPT - NEST Property Management*\n` +
      `Receipt #: ${receiptNumber}\n` +
      `Flat: ${updatedPayment.flat_number}\n` +
      `Tenant: ${updatedPayment.tenant_name}\n` +
      `Month: ${updatedPayment.month_year}\n` +
      `Amount Paid: PKR ${updatedPayment.amount.toLocaleString()}\n` +
      `Payment Date: ${today}\n` +
      `Method: ${payment_method}\n` +
      `Status: PAID (Confirmed)\n\n` +
      `Thank you for your timely payment!`
    );

    const waLink = updatedPayment.tenant_phone
      ? `https://wa.me/${updatedPayment.tenant_phone.replace(/[^0-9]/g, '')}?text=${waText}`
      : `https://wa.me/?text=${waText}`;

    res.json({
      success: true,
      message: 'Rent marked as Paid! Receipt generated.',
      data: {
        payment: updatedPayment,
        receiptNumber,
        waLink,
        receiptDate: today
      }
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/payments/:id/receipt - Get digital receipt data
router.get('/:id/receipt', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    const payment = get(`
      SELECT p.*,
             f.flat_number,
             f.address as flat_address,
             c.name as tenant_name,
             c.phone as tenant_phone,
             c.cnic as tenant_cnic
      FROM payments p
      JOIN flats f ON p.flat_id = f.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ? AND p.owner_id = ?
    `, [id, ownerId]);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const receiptNumber = payment.receipt_number || `REC-${new Date().getFullYear()}-${String(payment.id).padStart(4, '0')}`;
    const waText = encodeURIComponent(
      `*RENT RECEIPT - NEST Property Management*\n` +
      `Receipt #: ${receiptNumber}\n` +
      `Flat: ${payment.flat_number}\n` +
      `Tenant: ${payment.tenant_name}\n` +
      `Month: ${payment.month_year}\n` +
      `Amount: PKR ${payment.amount.toLocaleString()}\n` +
      `Status: ${payment.status.toUpperCase()}\n` +
      `Method: ${payment.payment_method || 'N/A'}\n` +
      `Date: ${payment.paid_date || payment.due_date}`
    );

    const waLink = payment.tenant_phone
      ? `https://wa.me/${payment.tenant_phone.replace(/[^0-9]/g, '')}?text=${waText}`
      : `https://wa.me/?text=${waText}`;

    res.json({
      success: true,
      data: {
        ...payment,
        receiptNumber,
        waLink
      }
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
