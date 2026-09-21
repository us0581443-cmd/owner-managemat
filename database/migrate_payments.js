const { db, query } = require('./db');

console.log('--- Starting Payments Migration ---');
const columns = query("PRAGMA table_info(payments)");
console.log('Current payments columns:', columns.map(c => c.name));

const hasPaidAmount = columns.some(c => c.name === 'paid_amount');
if (!hasPaidAmount) {
  console.log('Adding paid_amount column to payments table...');
  db.exec('ALTER TABLE payments ADD COLUMN paid_amount REAL DEFAULT 0;');
  console.log('Column paid_amount added successfully.');
} else {
  console.log('Column paid_amount already exists.');
}

// Backfill existing rows
db.exec("UPDATE payments SET paid_amount = amount WHERE status = 'Paid' AND (paid_amount = 0 OR paid_amount IS NULL);");
db.exec("UPDATE payments SET paid_amount = 0 WHERE status IN ('Pending', 'Late') AND paid_amount IS NULL;");

const sample = query('SELECT id, amount, paid_amount, status FROM payments LIMIT 5');
console.log('Sample rows after migration:');
console.table(sample);
console.log('--- Migration Completed Successfully ---');
