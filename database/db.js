const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'nest.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize database
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema if needed
if (fs.existsSync(SCHEMA_PATH)) {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
}

// Database helper functions
const query = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
};

const exec = (sql) => {
  return db.exec(sql);
};

module.exports = {
  db,
  query,
  get,
  run,
  exec,
  DB_PATH
};
