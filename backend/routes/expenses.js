const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');

// GET /api/expenses - List all expenses for current owner
router.get('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { flat_id } = req.query;

    let sql = `
      SELECT e.*, f.flat_number
      FROM expenses e
      LEFT JOIN flats f ON e.flat_id = f.id
      WHERE e.owner_id = ?
    `;

    const params = [ownerId];
    if (flat_id) {
      sql += ' AND e.flat_id = ? ';
      params.push(flat_id);
    }

    sql += ' ORDER BY e.id DESC';

    const expenses = query(sql, params);
    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses - Add new expense for current owner
router.post('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { flat_id, title, category, amount, expense_date, notes } = req.body;

    if (!title || !category || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Title, category, and amount are required.'
      });
    }

    const today = expense_date || new Date().toISOString().split('T')[0];

    const result = run(`
      INSERT INTO expenses (owner_id, flat_id, title, category, amount, expense_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `, [
      ownerId,
      flat_id ? parseInt(flat_id) : null,
      title.trim(),
      category.trim(),
      parseFloat(amount),
      today,
      notes ? notes.trim() : null
    ]);

    const newExpense = get(`
      SELECT e.*, f.flat_number
      FROM expenses e
      LEFT JOIN flats f ON e.flat_id = f.id
      WHERE e.id = ? AND e.owner_id = ?
    `, [result.lastInsertRowid, ownerId]);

    res.status(201).json({
      success: true,
      message: 'Expense logged successfully',
      data: newExpense
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
