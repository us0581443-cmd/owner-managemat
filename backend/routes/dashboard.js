const express = require('express');
const router = express.Router();
const { query, get } = require('../../database/db');

router.get('/', (req, res) => {
  try {
    const ownerId = req.ownerId || 1;

    // 1. Total Flats
    const totalFlatsRow = get('SELECT COUNT(*) as count FROM flats WHERE owner_id = ?', [ownerId]);
    const totalFlats = totalFlatsRow ? totalFlatsRow.count : 0;

    // 2. Booked Flats vs Vacant Flats
    const bookedFlatsRow = get("SELECT COUNT(*) as count FROM flats WHERE status = 'Booked' AND owner_id = ?", [ownerId]);
    const occupiedFlats = bookedFlatsRow ? bookedFlatsRow.count : 0;
    const vacantFlats = Math.max(0, totalFlats - occupiedFlats);

    // 3. Occupancy %
    const occupancyRate = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

    // 4. Current Tenants Count
    const tenantsRow = get("SELECT COUNT(DISTINCT customer_id) as count FROM tenancies WHERE status = 'active' AND owner_id = ?", [ownerId]);
    const tenantsCount = tenantsRow ? tenantsRow.count : 0;

    // 5. Total Income (sum of paid amounts across all collections: full & partial)
    const incomeRow = get("SELECT COALESCE(SUM(paid_amount), 0) as total FROM payments WHERE owner_id = ?", [ownerId]);
    const totalIncome = incomeRow ? incomeRow.total : 0;

    // 6. Expenses (maintenance / repairs)
    const expensesRow = get('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE owner_id = ?', [ownerId]);
    const expenses = expensesRow ? expensesRow.total : 0;

    // 7. Net Profit
    const netProfit = totalIncome - expenses;

    // 8. Rent Due (pending or remaining unpaid balances)
    const rentDueRow = get("SELECT COUNT(*) as count, COALESCE(SUM(amount - paid_amount), 0) as total FROM payments WHERE (amount - paid_amount) > 0 AND owner_id = ?", [ownerId]);
    const rentDueCount = rentDueRow ? rentDueRow.count : 0;
    const rentDueAmount = rentDueRow ? rentDueRow.total : 0;

    // 9. Recent activities (recent 5 payments and bookings)
    const recentPayments = query(`
      SELECT p.id, p.month_year, p.amount, p.paid_amount, (p.amount - COALESCE(p.paid_amount, 0)) as balance_due,
             p.status, p.paid_date, p.created_at,
             f.flat_number, c.name as tenant_name
      FROM payments p
      JOIN flats f ON p.flat_id = f.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.owner_id = ?
      ORDER BY p.id DESC
      LIMIT 5
    `, [ownerId]);

    // 10. All Flats with Rental Frequency & Revenue Analytics
    const allFlatsWithStats = query(`
      SELECT f.*,
             c.name as tenant_name,
             c.phone as tenant_phone,
             (SELECT COUNT(*) FROM tenancies t WHERE t.flat_id = f.id) as times_rented,
             (SELECT COALESCE(SUM(p.paid_amount), 0) FROM payments p WHERE p.flat_id = f.id) as total_revenue_generated
      FROM flats f
      LEFT JOIN customers c ON f.current_tenant_id = c.id
      WHERE f.owner_id = ?
      ORDER BY f.id DESC
    `, [ownerId]);

    // Most Rented Flats (Top rental demand / highest frequency)
    const mostRentedFlats = [...allFlatsWithStats].sort((a, b) => {
      if (b.times_rented !== a.times_rented) {
        return b.times_rented - a.times_rented;
      }
      return b.total_revenue_generated - a.total_revenue_generated;
    });

    // Least Rented Flats (Flats needing attention / low rental history / vacant)
    const leastRentedFlats = [...allFlatsWithStats].sort((a, b) => {
      if (a.times_rented !== b.times_rented) {
        return a.times_rented - b.times_rented;
      }
      return a.id - b.id;
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        expenses,
        netProfit,
        occupancyRate,
        totalFlats,
        tenantsCount,
        rentDueCount,
        rentDueAmount,
        vacantFlats,
        occupiedFlats,
        recentPayments,
        allFlats: allFlatsWithStats,
        mostRentedFlats,
        leastRentedFlats
      }
    });
  } catch (error) {
    console.error('Error in dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
