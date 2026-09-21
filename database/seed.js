const { db, query, get, run } = require('./db');

console.log('Seeding NEST property management database...');

// Clean existing data
db.exec(`
  DELETE FROM payments;
  DELETE FROM expenses;
  DELETE FROM tenancies;
  DELETE FROM flats;
  DELETE FROM customers;
`);

// 1. Insert Customers
const insertCustomer = db.prepare(`
  INSERT INTO customers (
    name, father_husband_name, dob, cnic, phone, email,
    family_members, profession, company, monthly_income,
    permanent_address, previous_address, emergency_contact_name,
    emergency_contact_relation, emergency_contact_phone,
    stays_count, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tariqRes = insertCustomer.run(
  'Tariq Mehmood',
  'Mehmood Ul Hassan',
  '1988-04-12',
  '35201-1234567-1',
  '03001234567',
  'tariq.mehmood@example.com',
  4,
  'Software Engineer',
  'Systems Ltd',
  240000,
  'House 42, St 5, F-8/2, Islamabad',
  'Flat 3, Al-Hafiz Plaza, Lahore',
  'Naveed Mehmood',
  'Brother',
  '03009876543',
  1,
  '2026-06-01 10:30:00'
);
const tariqId = tariqRes.lastInsertRowid;

const ayeshaRes = insertCustomer.run(
  'Ayesha Khan',
  'Sardar Muhammad Khan',
  '1992-09-21',
  '35202-9876543-2',
  '03217654321',
  'ayesha.khan@example.com',
  3,
  'Senior Marketing Manager',
  'Nestle Pakistan',
  290000,
  'Plot 118, Phase 6, DHA Lahore',
  'Flat 101, Al-Rehman Heights',
  'Bilal Khan',
  'Spouse',
  '03224445566',
  2, // Repeat customer!
  '2025-01-01 11:00:00'
);
const ayeshaId = ayeshaRes.lastInsertRowid;

const hamzaRes = insertCustomer.run(
  'Hamza Farooq',
  'Farooq Ahmed',
  '1995-11-05',
  '42101-5554321-7',
  '03334445556',
  'hamza.farooq@example.com',
  2,
  'Chartered Accountant',
  'KPMG Taseer Hadi & Co.',
  210000,
  'C-14, Block 4, Clifton, Karachi',
  'Apartment 12, Gulberg Green, Lahore',
  'Zubair Farooq',
  'Brother',
  '03339998877',
  1,
  '2025-06-01 09:15:00'
);
const hamzaId = hamzaRes.lastInsertRowid;

// 2. Insert Flats
const insertFlat = db.prepare(`
  INSERT INTO flats (
    flat_number, address, bedrooms, size, monthly_rent, status, photos, current_tenant_id, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const flat1Res = insertFlat.run(
  'Flat 101',
  'Al-Rehman Heights, Main Boulevard, Gulberg III, Lahore',
  '2 Bed',
  '1,150 sq ft',
  65000,
  'Booked',
  JSON.stringify([
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
  ]),
  tariqId,
  '2026-05-15 14:20:00'
);
const flat1Id = flat1Res.lastInsertRowid;

const flat2Res = insertFlat.run(
  'Flat 204',
  'Executive Residency, Sector Y, Phase 3, DHA Lahore',
  '3 Bed',
  '1,800 sq ft',
  95000,
  'Booked',
  JSON.stringify([
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80'
  ]),
  ayeshaId,
  '2026-07-10 16:45:00'
);
const flat2Id = flat2Res.lastInsertRowid;

const flat3Res = insertFlat.run(
  'Flat 302',
  'Green Avenue Towers, Block G, Johar Town, Lahore',
  '1 Bed',
  '650 sq ft',
  42000,
  'Vacant',
  JSON.stringify([
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80'
  ]),
  null,
  '2026-08-01 10:00:00'
);
const flat3Id = flat3Res.lastInsertRowid;

const flat4Res = insertFlat.run(
  'Penthouse 501',
  'Sky View Heights, MM Alam Road, Gulberg II, Lahore',
  '4 Bed',
  '2,600 sq ft',
  160000,
  'Vacant',
  JSON.stringify([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80'
  ]),
  null,
  '2026-09-01 11:30:00'
);
const flat4Id = flat4Res.lastInsertRowid;

// 3. Insert Tenancies (Historical and Current)
const insertTenancy = db.prepare(`
  INSERT INTO tenancies (
    flat_id, customer_id, check_in_date, duration_months,
    security_deposit, monthly_rent, status, check_out_date, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Active stay 1
insertTenancy.run(flat1Id, tariqId, '2026-06-01', 12, 130000, 65000, 'active', null, '2026-06-01 10:35:00');

// Active stay 2 (Ayesha current)
insertTenancy.run(flat2Id, ayeshaId, '2026-08-15', 11, 190000, 95000, 'active', null, '2026-08-15 12:00:00');

// Past stay (Ayesha previously stayed in Flat 101)
insertTenancy.run(flat1Id, ayeshaId, '2025-01-01', 12, 120000, 60000, 'past', '2025-12-31', '2025-01-01 11:05:00');

// Past stay (Hamza previously stayed in Flat 302)
insertTenancy.run(flat3Id, hamzaId, '2025-06-01', 12, 80000, 40000, 'past', '2026-05-31', '2025-06-01 09:20:00');

// 4. Insert Payments
const insertPayment = db.prepare(`
  INSERT INTO payments (
    flat_id, customer_id, month_year, amount, due_date, status, paid_date, payment_method, receipt_number, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Tariq paid for September
insertPayment.run(
  flat1Id,
  tariqId,
  'September 2026',
  65000,
  '2026-09-05',
  'Paid',
  '2026-09-03',
  'Bank Transfer',
  'REC-2026-0901',
  '2026-09-03 14:10:00'
);

// Ayesha pending for September
insertPayment.run(
  flat2Id,
  ayeshaId,
  'September 2026',
  95000,
  '2026-09-10',
  'Pending',
  null,
  null,
  null,
  '2026-09-01 00:00:00'
);

// Tariq paid for August
insertPayment.run(
  flat1Id,
  tariqId,
  'August 2026',
  65000,
  '2026-08-05',
  'Paid',
  '2026-08-04',
  'EasyPaisa',
  'REC-2026-0801',
  '2026-08-04 15:30:00'
);

// 5. Insert Expenses
const insertExpense = db.prepare(`
  INSERT INTO expenses (
    flat_id, title, category, amount, expense_date, notes, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertExpense.run(
  flat1Id,
  'Sanitary & Faucet Replacement',
  'Plumbing',
  8500,
  '2026-09-02',
  'Master bedroom washroom mixer tap replaced with new fittings',
  '2026-09-02 16:00:00'
);

insertExpense.run(
  null,
  'Water Tank Deep Cleaning & Pump Overhaul',
  'Maintenance',
  14000,
  '2026-09-09',
  'Main underground tank sanitized and main booster pump servicing completed',
  '2026-09-09 11:30:00'
);

console.log('Database seeded successfully!');
console.log({
  flats: query('SELECT COUNT(*) as count FROM flats')[0].count,
  customers: query('SELECT COUNT(*) as count FROM customers')[0].count,
  tenancies: query('SELECT COUNT(*) as count FROM tenancies')[0].count,
  payments: query('SELECT COUNT(*) as count FROM payments')[0].count,
  expenses: query('SELECT COUNT(*) as count FROM expenses')[0].count
});
