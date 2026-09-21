const { db, query, get, run, exec } = require('./db');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function migrateAuth() {
  console.log('🔄 Starting Auth & Multi-Owner Database Migration...');

  // 1. Create owners table
  db.exec(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      otp_code TEXT NULL,
      otp_expires_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 2. Create auth_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );
  `);

  // Helper to safely add column if not existing
  const addColumnIfNotExists = (table, column, colDef) => {
    const tableInfo = query(`PRAGMA table_info(${table})`);
    const exists = tableInfo.some(col => col.name === column);
    if (!exists) {
      console.log(`Adding ${column} column to ${table}...`);
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef};`);
    } else {
      console.log(`Column ${column} already exists in ${table}.`);
    }
  };

  // 3. Add owner_id to all relevant tables
  addColumnIfNotExists('flats', 'owner_id', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('customers', 'owner_id', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('tenancies', 'owner_id', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('payments', 'owner_id', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('expenses', 'owner_id', 'INTEGER DEFAULT 1');

  // 4. Seed or update Default Owner (owner@gmail.com / nest1234)
  const defaultEmail = 'owner@gmail.com';
  const defaultPassword = 'nest1234';
  const existingOwner = get('SELECT * FROM owners WHERE id = 1 OR email = ?', [defaultEmail]);

  if (!existingOwner) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(defaultPassword, salt);
    run(
      `INSERT INTO owners (id, name, email, phone, password_hash, salt, is_verified)
       VALUES (1, ?, ?, ?, ?, ?, 1)`,
      ['Primary Owner', defaultEmail, '+92 300 1234567', hash, salt]
    );
    console.log(`✅ Default Owner created: ${defaultEmail} / ${defaultPassword}`);
  } else {
    // Ensure default owner has is_verified = 1 and knows the default password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(defaultPassword, salt);
    run(
      `UPDATE owners 
       SET email = ?, password_hash = ?, salt = ?, is_verified = 1 
       WHERE id = ?`,
      [defaultEmail, hash, salt, existingOwner.id]
    );
    console.log(`✅ Default Owner updated: ${defaultEmail} / ${defaultPassword}`);
  }

  // 5. Ensure all existing data rows are assigned to default owner_id = 1
  run('UPDATE flats SET owner_id = 1 WHERE owner_id IS NULL OR owner_id = 0');
  run('UPDATE customers SET owner_id = 1 WHERE owner_id IS NULL OR owner_id = 0');
  run('UPDATE tenancies SET owner_id = 1 WHERE owner_id IS NULL OR owner_id = 0');
  run('UPDATE payments SET owner_id = 1 WHERE owner_id IS NULL OR owner_id = 0');
  run('UPDATE expenses SET owner_id = 1 WHERE owner_id IS NULL OR owner_id = 0');

  console.log('🎉 Migration completed successfully! All data assigned to Owner #1.');
}

if (require.main === module) {
  migrateAuth();
}

module.exports = { migrateAuth, hashPassword };
