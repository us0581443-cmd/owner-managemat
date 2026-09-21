const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');

// GET /api/flats - List all flats for current owner with sorting
router.get('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { sort = 'date', search = '' } = req.query;

    let orderBy = 'f.id DESC'; // default newest first
    if (sort === 'date') {
      orderBy = 'f.created_at DESC, f.id DESC';
    } else if (sort === 'rent_desc') {
      orderBy = 'f.monthly_rent DESC';
    } else if (sort === 'name_asc') {
      orderBy = 'f.flat_number ASC';
    } else if (sort === 'status') {
      orderBy = "CASE WHEN f.status = 'Vacant' THEN 1 ELSE 2 END, f.id DESC";
    }

    let sql = `
      SELECT f.*,
             c.name as current_tenant_name,
             c.phone as current_tenant_phone,
             c.stays_count as current_tenant_stays,
             (SELECT COUNT(*) FROM tenancies t WHERE t.flat_id = f.id) as times_rented
      FROM flats f
      LEFT JOIN customers c ON f.current_tenant_id = c.id
      WHERE f.owner_id = ?
    `;

    const params = [ownerId];
    if (search.trim()) {
      sql += ' AND (f.flat_number LIKE ? OR f.address LIKE ?) ';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ` ORDER BY ${orderBy}`;

    const flats = query(sql, params);
    res.json({ success: true, data: flats });
  } catch (error) {
    console.error('Error fetching flats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/flats/:id - Flat detail with booking summary and history
router.get('/:id', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    const flat = get(`
      SELECT f.*,
             c.name as tenant_name,
             c.father_husband_name,
             c.cnic as tenant_cnic,
             c.phone as tenant_phone,
             c.email as tenant_email,
             c.profession as tenant_profession,
             c.company as tenant_company,
             c.monthly_income as tenant_monthly_income,
             c.stays_count as tenant_stays_count,
             c.emergency_contact_name,
             c.emergency_contact_relation,
             c.emergency_contact_phone
      FROM flats f
      LEFT JOIN customers c ON f.current_tenant_id = c.id
      WHERE f.id = ? AND f.owner_id = ?
    `, [id, ownerId]);

    if (!flat) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }

    // Active Tenancy details (if Booked)
    const activeTenancy = get(`
      SELECT * FROM tenancies
      WHERE flat_id = ? AND status = 'active' AND owner_id = ?
      ORDER BY id DESC LIMIT 1
    `, [id, ownerId]);

    // Payments for this flat
    const payments = query(`
      SELECT p.*, c.name as tenant_name
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.flat_id = ? AND p.owner_id = ?
      ORDER BY p.id DESC
    `, [id, ownerId]);

    // Expenses for this flat
    const expenses = query(`
      SELECT * FROM expenses
      WHERE flat_id = ? AND owner_id = ?
      ORDER BY id DESC
    `, [id, ownerId]);

    res.json({
      success: true,
      data: {
        ...flat,
        activeTenancy,
        payments,
        expenses
      }
    });
  } catch (error) {
    console.error('Error fetching flat details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/flats - Add new flat for current owner
router.post('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { flat_number, address, building_name, bedrooms, size, monthly_rent, photos } = req.body;
    const finalAddress = (address || building_name || '').trim();

    if (!flat_number || !finalAddress || !bedrooms || !size || !monthly_rent) {
      return res.status(400).json({
        success: false,
        error: 'Flat number, location/address, bedrooms, size, and monthly rent are required.'
      });
    }

    let photosJson;
    if (photos) {
      photosJson = typeof photos === 'string' ? photos : JSON.stringify(photos);
    } else {
      photosJson = JSON.stringify([
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
      ]);
    }

    const result = run(`
      INSERT INTO flats (owner_id, flat_number, address, bedrooms, size, monthly_rent, status, photos, current_tenant_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Vacant', ?, NULL, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `, [
      ownerId,
      flat_number.trim(),
      finalAddress,
      bedrooms.trim(),
      size.trim(),
      parseFloat(monthly_rent),
      photosJson
    ]);

    const newFlat = get('SELECT * FROM flats WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: 'Flat added successfully as Vacant',
      data: newFlat
    });
  } catch (error) {
    console.error('Error adding flat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/flats/:id - Edit flat details
router.put('/:id', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    const { flat_number, address, building_name, bedrooms, size, monthly_rent, photos } = req.body;

    const existing = get('SELECT * FROM flats WHERE id = ? AND owner_id = ?', [id, ownerId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }

    const finalAddress = (address || building_name || existing.address || '').trim();
    const photosJson = photos 
      ? (typeof photos === 'string' ? photos : JSON.stringify(photos))
      : existing.photos;

    run(`
      UPDATE flats
      SET flat_number = ?,
          address = ?,
          bedrooms = ?,
          size = ?,
          monthly_rent = ?,
          photos = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ? AND owner_id = ?
    `, [
      flat_number ? flat_number.trim() : existing.flat_number,
      finalAddress,
      bedrooms ? bedrooms.trim() : existing.bedrooms,
      size ? size.trim() : existing.size,
      monthly_rent ? parseFloat(monthly_rent) : existing.monthly_rent,
      photosJson,
      id,
      ownerId
    ]);

    const updated = get('SELECT * FROM flats WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Flat updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating flat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/flats/:id - Delete flat with confirmation
router.delete('/:id', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { id } = req.params;
    const existing = get('SELECT * FROM flats WHERE id = ? AND owner_id = ?', [id, ownerId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }

    run('DELETE FROM flats WHERE id = ? AND owner_id = ?', [id, ownerId]);
    res.json({
      success: true,
      message: `Flat ${existing.flat_number} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting flat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
