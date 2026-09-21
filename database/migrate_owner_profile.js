const { db } = require('./db');

console.log('Running owner profile columns migration on nest.sqlite...');

try {
  const tableInfo = db.prepare('PRAGMA table_info(owners)').all();
  const columnNames = tableInfo.map(c => c.name);

  if (!columnNames.includes('profile_image')) {
    db.exec('ALTER TABLE owners ADD COLUMN profile_image TEXT DEFAULT NULL;');
    console.log('✅ Added profile_image column to owners table.');
  } else {
    console.log('ℹ️ profile_image column already exists.');
  }

  if (!columnNames.includes('address')) {
    db.exec('ALTER TABLE owners ADD COLUMN address TEXT DEFAULT NULL;');
    console.log('✅ Added address column to owners table.');
  } else {
    console.log('ℹ️ address column already exists.');
  }

  const updatedInfo = db.prepare('PRAGMA table_info(owners)').all();
  console.log('Current owners columns:', updatedInfo.map(c => c.name));
  console.log('🎉 Migration successful!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
}
