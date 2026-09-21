const express = require('express');
const router = express.Router();
const { query, get, run, db } = require('../../database/db');

// GET /api/tenants/check-cnic/:cnic - Helper to check repeat customer status in real-time
router.get('/check-cnic/:cnic', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { cnic } = req.params;
    const cleanCnic = cnic.trim();
    const customer = get('SELECT * FROM customers WHERE cnic = ? AND owner_id = ?', [cleanCnic, ownerId]);

    if (customer) {
      // Find their previous tenancies
      const pastStays = query(`
        SELECT t.*, f.flat_number
        FROM tenancies t
        JOIN flats f ON t.flat_id = f.id
        WHERE t.customer_id = ? AND t.owner_id = ?
        ORDER BY t.id DESC
      `, [customer.id, ownerId]);

      return res.json({
        success: true,
        exists: true,
        customer,
        pastStays,
        badge: `Repeat - ${customer.stays_count}x`
      });
    }

    res.json({
      success: true,
      exists: false,
      badge: 'New Customer'
    });
  } catch (error) {
    console.error('Error checking CNIC:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tenants/check-in - Flow B: Tenant Check-in and Booking
router.post('/check-in', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const {
      flat_id,
      // Section 1: Personal Details
      name,
      father_husband_name,
      dob,
      cnic,
      phone,
      email,
      // Section 2: Family & Occupation
      family_members,
      profession,
      company,
      monthly_income,
      // Section 3: Address
      permanent_address,
      previous_address,
      // Section 4: Emergency Contact
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      // Section 5: Lease & Stay Details
      booking_type = 'daily', // 'daily' or 'monthly'
      check_in_date,
      check_out_date,
      total_days,
      daily_rate,
      duration_months = 1,
      security_deposit = 0,
      monthly_rent,
      // Section 6: Documents
      cnic_doc,
      lease_doc,
      guarantor_doc,
      // Section 7: Initial Rent Payment
      payment_status = 'Pending', // 'Paid', 'Partial', 'Pending'
      paid_amount = 0,
      payment_method = 'Cash'
    } = req.body;

    if (!flat_id || !name || !cnic || !phone || !check_in_date) {
      return res.status(400).json({
        success: false,
        error: 'Flat, Name, CNIC, Phone, and Check-in Date are required.'
      });
    }

    const flat = get('SELECT * FROM flats WHERE id = ? AND owner_id = ?', [flat_id, ownerId]);
    if (!flat) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }

    if (flat.status === 'Booked') {
      return res.status(400).json({
        success: false,
        error: `Flat ${flat.flat_number} is already booked! Please checkout the current tenant first.`
      });
    }

    // Calculate stay duration and charges
    let stayDays = parseInt(total_days) || 1;
    let ratePerDay = parseFloat(daily_rate) || 0;
    let computedCheckOutDate = check_out_date || null;

    if (check_in_date && check_out_date) {
      const d1 = new Date(check_in_date);
      const d2 = new Date(check_out_date);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) stayDays = diffDays;
    } else if (check_in_date && stayDays > 0) {
      const d1 = new Date(check_in_date);
      d1.setDate(d1.getDate() + stayDays);
      computedCheckOutDate = d1.toISOString().split('T')[0];
    }

    if (!ratePerDay) {
      if (flat.daily_rate && flat.daily_rate > 0) {
        ratePerDay = flat.daily_rate;
      } else if (flat.monthly_rent && flat.monthly_rent > 0) {
        ratePerDay = Math.round(flat.monthly_rent / 30);
      } else {
        ratePerDay = 1000;
      }
    }

    let calculatedTotalRent = 0;
    let billingDescription = '';

    if (booking_type === 'daily') {
      calculatedTotalRent = stayDays * ratePerDay;
      billingDescription = `${stayDays} Days Stay (${check_in_date} to ${computedCheckOutDate || 'TBD'})`;
    } else {
      calculatedTotalRent = parseFloat(monthly_rent) || flat.monthly_rent || (stayDays * ratePerDay);
      billingDescription = new Date(check_in_date).toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    const cleanCnic = cnic.trim();
    let customerId;
    let isRepeat = false;
    let currentStays = 1;

    // Check if customer already exists in permanent directory by CNIC for this owner
    const existingCustomer = get('SELECT * FROM customers WHERE cnic = ? AND owner_id = ?', [cleanCnic, ownerId]);

    if (existingCustomer) {
      isRepeat = true;
      customerId = existingCustomer.id;
      currentStays = (existingCustomer.stays_count || 1) + 1;

      // Update existing customer's contact/work details and increment stays
      run(`
        UPDATE customers
        SET name = ?,
            father_husband_name = COALESCE(?, father_husband_name),
            dob = COALESCE(?, dob),
            phone = ?,
            email = COALESCE(?, email),
            family_members = ?,
            profession = COALESCE(?, profession),
            company = COALESCE(?, company),
            monthly_income = ?,
            permanent_address = COALESCE(?, permanent_address),
            previous_address = COALESCE(?, previous_address),
            emergency_contact_name = COALESCE(?, emergency_contact_name),
            emergency_contact_relation = COALESCE(?, emergency_contact_relation),
            emergency_contact_phone = COALESCE(?, emergency_contact_phone),
            cnic_doc = COALESCE(?, cnic_doc),
            lease_doc = COALESCE(?, lease_doc),
            guarantor_doc = COALESCE(?, guarantor_doc),
            stays_count = ?
        WHERE id = ? AND owner_id = ?
      `, [
        name.trim(),
        father_husband_name || null,
        dob || null,
        phone.trim(),
        email || null,
        parseInt(family_members) || 1,
        profession || null,
        company || null,
        parseFloat(monthly_income) || 0,
        permanent_address || null,
        previous_address || null,
        emergency_contact_name || null,
        emergency_contact_relation || null,
        emergency_contact_phone || null,
        cnic_doc || null,
        lease_doc || null,
        guarantor_doc || null,
        currentStays,
        customerId,
        ownerId
      ]);
    } else {
      // Create new customer record in permanent directory
      const insertCustomer = run(`
        INSERT INTO customers (
          owner_id, name, father_husband_name, dob, cnic, phone, email,
          family_members, profession, company, monthly_income,
          permanent_address, previous_address, emergency_contact_name,
          emergency_contact_relation, emergency_contact_phone,
          cnic_doc, lease_doc, guarantor_doc, stays_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', 'localtime'))
      `, [
        ownerId,
        name.trim(),
        father_husband_name || null,
        dob || null,
        cleanCnic,
        phone.trim(),
        email || null,
        parseInt(family_members) || 1,
        profession || null,
        company || null,
        parseFloat(monthly_income) || 0,
        permanent_address || null,
        previous_address || null,
        emergency_contact_name || null,
        emergency_contact_relation || null,
        emergency_contact_phone || null,
        cnic_doc || null,
        lease_doc || null,
        guarantor_doc || null
      ]);
      customerId = insertCustomer.lastInsertRowid;
      currentStays = 1;
    }

    // 2. Create Tenancy Record (with Days-wise parameters)
    const tenancyResult = run(`
      INSERT INTO tenancies (
        owner_id, flat_id, customer_id, booking_type, check_in_date, check_out_date,
        total_days, daily_rate, total_rent, duration_months,
        security_deposit, monthly_rent, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now', 'localtime'))
    `, [
      ownerId,
      flat_id,
      customerId,
      booking_type,
      check_in_date,
      computedCheckOutDate,
      stayDays,
      ratePerDay,
      calculatedTotalRent,
      parseInt(duration_months) || 1,
      parseFloat(security_deposit) || 0,
      calculatedTotalRent
    ]);

    // 3. Mark Flat as 'Booked' and link current tenant
    run(`
      UPDATE flats
      SET status = 'Booked',
          current_tenant_id = ?,
          monthly_rent = ?,
          daily_rate = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ? AND owner_id = ?
    `, [customerId, calculatedTotalRent, ratePerDay, flat_id, ownerId]);

    // 4. Generate first rent payment record with specified payment status
    const rentAmount = calculatedTotalRent;
    let resolvedStatus = 'Pending';
    let resolvedPaidAmount = 0;
    let resolvedPaidDate = null;
    let resolvedPaymentMethod = null;
    let receiptNumber = null;
    const today = new Date().toISOString().split('T')[0];

    if (payment_status === 'Paid') {
      resolvedStatus = 'Paid';
      resolvedPaidAmount = rentAmount;
      resolvedPaidDate = today;
      resolvedPaymentMethod = payment_method || 'Cash';
    } else if (payment_status === 'Partial') {
      const parsedPartial = parseFloat(paid_amount);
      resolvedPaidAmount = !isNaN(parsedPartial) && parsedPartial > 0 ? parsedPartial : (rentAmount / 2);
      if (resolvedPaidAmount >= rentAmount) {
        resolvedStatus = 'Paid';
        resolvedPaidAmount = rentAmount;
      } else if (resolvedPaidAmount > 0) {
        resolvedStatus = 'Partial';
      } else {
        resolvedStatus = 'Pending';
        resolvedPaidAmount = 0;
      }
      resolvedPaidDate = resolvedPaidAmount > 0 ? today : null;
      resolvedPaymentMethod = resolvedPaidAmount > 0 ? (payment_method || 'Cash') : null;
    } else {
      // Pending
      resolvedStatus = 'Pending';
      resolvedPaidAmount = 0;
      resolvedPaidDate = null;
      resolvedPaymentMethod = null;
    }

    const paymentInsert = run(`
      INSERT INTO payments (
        owner_id, flat_id, customer_id, month_year, booking_details, amount, paid_amount, due_date, status, paid_date, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `, [
      ownerId,
      flat_id,
      customerId,
      billingDescription,
      `${stayDays} Days @ PKR ${ratePerDay.toLocaleString()}/day`,
      rentAmount,
      resolvedPaidAmount,
      check_in_date,
      resolvedStatus,
      resolvedPaidDate,
      resolvedPaymentMethod
    ]);

    const paymentId = paymentInsert.lastInsertRowid;
    if (resolvedPaidAmount > 0) {
      receiptNumber = `REC-${new Date().getFullYear()}-${String(paymentId).padStart(4, '0')}`;
      run(`UPDATE payments SET receipt_number = ? WHERE id = ?`, [receiptNumber, paymentId]);
    }

    const badge = isRepeat ? `Repeat – ${currentStays}x` : 'New Customer';

    res.status(201).json({
      success: true,
      message: `Tenant registered and Flat ${flat.flat_number} is now Booked!`,
      data: {
        isRepeat,
        badge,
        customerId,
        tenancyId: tenancyResult.lastInsertRowid,
        flatId: flat_id,
        payment: {
          id: paymentId,
          status: resolvedStatus,
          amount: rentAmount,
          paid_amount: resolvedPaidAmount,
          receipt_number: receiptNumber
        }
      }
    });
  } catch (error) {
    console.error('Error during tenant check-in:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tenants/checkout/:flat_id - Flow D: Checkout Tenant
router.post('/checkout/:flat_id', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;
    const { flat_id } = req.params;

    const flat = get('SELECT * FROM flats WHERE id = ? AND owner_id = ?', [flat_id, ownerId]);
    if (!flat) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }

    if (flat.status !== 'Booked') {
      return res.status(400).json({
        success: false,
        error: `Flat ${flat.flat_number} is already Vacant.`
      });
    }

    // 1. Mark active tenancy as 'past' with checkout timestamp
    run(`
      UPDATE tenancies
      SET status = 'past',
          check_out_date = date('now', 'localtime')
      WHERE flat_id = ? AND owner_id = ? AND status = 'active'
    `, [flat_id, ownerId]);

    // 2. Mark flat as 'Vacant' and unlink tenant
    run(`
      UPDATE flats
      SET status = 'Vacant',
          current_tenant_id = NULL,
          updated_at = datetime('now', 'localtime')
      WHERE id = ? AND owner_id = ?
    `, [flat_id, ownerId]);

    res.json({
      success: true,
      message: `Flat ${flat.flat_number} checked out successfully. Status is now Vacant and customer history is preserved!`
    });
  } catch (error) {
    console.error('Error during tenant checkout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
