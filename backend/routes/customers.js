const express = require('express');
const router = express.Router();
const { query, get } = require('../../database/db');

// GET /api/customers - List all permanent customer records for current owner
router.get('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { search = '' } = req.query;

    let sql = 'SELECT * FROM customers WHERE owner_id = ?';
    const params = [ownerId];

    if (search.trim()) {
      sql += ' AND (name LIKE ? OR cnic LIKE ? OR phone LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY id DESC';

    const customers = query(sql, params);

    // Attach tenancy history and payments to each customer
    const customersWithHistory = customers.map(customer => {
      const stays = query(`
        SELECT t.*, f.flat_number, f.address as flat_address
        FROM tenancies t
        JOIN flats f ON t.flat_id = f.id
        WHERE t.customer_id = ? AND t.owner_id = ?
        ORDER BY t.id DESC
      `, [customer.id, ownerId]);

      const payments = query(`
        SELECT p.*,
               (p.amount - COALESCE(p.paid_amount, 0)) as balance_due,
               f.flat_number
        FROM payments p
        JOIN flats f ON p.flat_id = f.id
        WHERE p.customer_id = ? AND p.owner_id = ?
        ORDER BY p.id DESC
      `, [customer.id, ownerId]);

      const badge = customer.stays_count > 1 ? `Repeat – ${customer.stays_count}x` : 'New Customer';

      return {
        ...customer,
        badge,
        stays,
        payments
      };
    });

    res.json({ success: true, data: customersWithHistory });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customers/:id - Single customer full profile for current owner
router.get('/:id', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    const customer = get('SELECT * FROM customers WHERE id = ? AND owner_id = ?', [id, ownerId]);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const stays = query(`
      SELECT t.*, f.flat_number, f.address as flat_address
      FROM tenancies t
      JOIN flats f ON t.flat_id = f.id
      WHERE t.customer_id = ? AND t.owner_id = ?
      ORDER BY t.id DESC
    `, [id, ownerId]);

    const payments = query(`
      SELECT p.*,
             (p.amount - COALESCE(p.paid_amount, 0)) as balance_due,
             f.flat_number
      FROM payments p
      JOIN flats f ON p.flat_id = f.id
      WHERE p.customer_id = ? AND p.owner_id = ?
      ORDER BY p.id DESC
    `, [id, ownerId]);

    const badge = customer.stays_count > 1 ? `Repeat – ${customer.stays_count}x` : 'New Customer';

    res.json({
      success: true,
      data: {
        ...customer,
        badge,
        stays,
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
