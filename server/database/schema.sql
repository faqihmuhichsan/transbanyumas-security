-- =============================================
-- Security Patrol System - Database Schema
-- Trans Banyumas
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin', 'security')) DEFAULT 'security',
  no_hp TEXT,
  koridor_default TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Laporan (patrol report) table
CREATE TABLE IF NOT EXISTS laporan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  koridor TEXT NOT NULL,
  shift TEXT NOT NULL,
  jam_shift TEXT,
  titik TEXT NOT NULL,
  items_cek TEXT, -- JSON array of checked items
  status TEXT NOT NULL CHECK(status IN ('aman', 'temuan')) DEFAULT 'aman',
  kondisi TEXT DEFAULT 'Baik',
  prioritas TEXT DEFAULT 'Sedang',
  catatan TEXT,
  gps_lat REAL,
  gps_lng REAL,
  gps_akurasi INTEGER,
  gps_dilewati INTEGER DEFAULT 0,
  waktu_patroli DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Foto (photo) for laporan
CREATE TABLE IF NOT EXISTS foto_laporan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  laporan_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (laporan_id) REFERENCES laporan(id) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id INTEGER,
  detail TEXT, -- JSON
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_laporan_user_id ON laporan(user_id);
CREATE INDEX IF NOT EXISTS idx_laporan_koridor ON laporan(koridor);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan(status);
CREATE INDEX IF NOT EXISTS idx_laporan_waktu ON laporan(waktu_patroli);
CREATE INDEX IF NOT EXISTS idx_laporan_created ON laporan(created_at);
CREATE INDEX IF NOT EXISTS idx_foto_laporan_id ON foto_laporan(laporan_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
