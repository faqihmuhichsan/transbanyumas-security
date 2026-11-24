/**
 * Database configuration - SQLite via better-sqlite3
 * Auto-creates database file and runs schema on first start.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'security.db');
const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');

// Ensure the database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open (or create) the SQLite database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run schema migration on startup
try {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('[DB] Schema loaded successfully.');

  // Auto-seed initial users if table is empty
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount === 0) {
    console.log('[DB] Users table kosong, menjalankan auto-seed...');
    const runSeed = require('../database/seed');
    runSeed();
  }
} catch (err) {
  console.error('[DB] Failed to load schema:', err.message);
  process.exit(1);
}

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

module.exports = db;
