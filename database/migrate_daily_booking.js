const { db, query } = require('./db');

console.log('--- Running Migration for Days-Wise Booking ---');

// Helper to add column if not exists
const addColumn = (table, colName, colDef) => {
  const cols = query(`PRAGMA table_info(${table})`).map(c => c.name);
  if (!cols.includes(colName)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colDef};`);
    console.log(`✅ Added column ${colName} to ${table}`);
  } else {
    console.log(`ℹ️ Column ${colName} already exists in ${table}`);
  }
};

// 1. Flats: add daily_rate
addColumn('flats', 'daily_rate', 'REAL DEFAULT 0');

// Set default daily_rate for existing flats as round(monthly_rent / 30)
db.exec(`
  UPDATE flats 
  SET daily_rate = ROUND(monthly_rent / 30.0, 0)
  WHERE daily_rate IS NULL OR daily_rate = 0;
`);

// 2. Tenancies: add booking_type, total_days, daily_rate, total_rent
addColumn('tenancies', 'booking_type', "TEXT DEFAULT 'daily'");
addColumn('tenancies', 'total_days', 'INTEGER DEFAULT 1');
addColumn('tenancies', 'daily_rate', 'REAL DEFAULT 0');
addColumn('tenancies', 'total_rent', 'REAL DEFAULT 0');

// 3. Payments: add booking_details (optional string for days breakdown)
addColumn('payments', 'booking_details', 'TEXT DEFAULT NULL');

console.log('--- Migration Completed Successfully ---');
