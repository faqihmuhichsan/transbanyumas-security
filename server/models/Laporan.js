/**
 * Laporan (Patrol Report) model - CRUD and stats
 */
const db = require('../config/database');

const Laporan = {
  /**
   * Find a single laporan by ID, including photos and user info
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const laporan = db.prepare(`
      SELECT l.*, u.nama_lengkap, u.username
      FROM laporan l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(id);

    if (laporan) {
      laporan.fotos = db.prepare('SELECT * FROM foto_laporan WHERE laporan_id = ?').all(id);
    }
    return laporan;
  },

  /**
   * List laporan with filters and pagination
   * @param {object} opts
   * @returns {{ data: object[], total: number, page: number, limit: number, totalPages: number }}
   */
  findAll({ page = 1, limit = 20, koridor, shift, status, tanggal_mulai, tanggal_selesai, user_id, search } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (koridor) {
      where += ' AND l.koridor = ?';
      params.push(koridor);
    }
    if (shift) {
      where += ' AND l.shift = ?';
      params.push(shift);
    }
    if (status) {
      where += ' AND l.status = ?';
      params.push(status);
    }
    if (user_id) {
      where += ' AND l.user_id = ?';
      params.push(user_id);
    }
    if (tanggal_mulai) {
      where += ' AND DATE(l.waktu_patroli) >= ?';
      params.push(tanggal_mulai);
    }
    if (tanggal_selesai) {
      where += ' AND DATE(l.waktu_patroli) <= ?';
      params.push(tanggal_selesai);
    }
    if (search) {
      where += ' AND (l.titik LIKE ? OR l.catatan LIKE ? OR u.nama_lengkap LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM laporan l
      JOIN users u ON l.user_id = u.id
      ${where}
    `).get(...params).count;

    const data = db.prepare(`
      SELECT l.*, u.nama_lengkap, u.username
      FROM laporan l
      JOIN users u ON l.user_id = u.id
      ${where}
      ORDER BY l.waktu_patroli DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // Attach photos for each laporan
    const stmtFotos = db.prepare('SELECT file_path, original_name FROM foto_laporan WHERE laporan_id = ?');
    data.forEach(row => {
      row.fotos = stmtFotos.all(row.id);
      row.jumlah_foto = row.fotos.length;
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Find all laporan by a specific user
   * @param {number} userId
   * @param {object} opts - pagination
   * @returns {{ data: object[], total: number }}
   */
  findByUserId(userId, { page = 1, limit = 20 } = {}) {
    return this.findAll({ page, limit, user_id: userId });
  },

  /**
   * Create a new laporan and optionally attach photos
   * @param {object} data
   * @param {Array<{file_path: string, original_name: string, file_size: number}>} [fotos]
   * @returns {object} created laporan
   */
  create(data, fotos = []) {
    const insertLaporan = db.prepare(`
      INSERT INTO laporan (user_id, koridor, shift, jam_shift, titik, items_cek, status, kondisi, prioritas, catatan, gps_lat, gps_lng, gps_akurasi, gps_dilewati, waktu_patroli)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `);

    const insertFoto = db.prepare(`
      INSERT INTO foto_laporan (laporan_id, file_path, original_name, file_size)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((reportData, photos) => {
      const result = insertLaporan.run(
        reportData.user_id,
        reportData.koridor,
        reportData.shift,
        reportData.jam_shift || null,
        reportData.titik,
        reportData.items_cek ? (typeof reportData.items_cek === 'string' ? reportData.items_cek : JSON.stringify(reportData.items_cek)) : null,
        reportData.status || 'aman',
        reportData.kondisi || 'Baik',
        reportData.prioritas || 'Sedang',
        reportData.catatan || null,
        reportData.gps_lat || null,
        reportData.gps_lng || null,
        reportData.gps_akurasi || null,
        reportData.gps_dilewati || 0,
        reportData.waktu_patroli || null
      );

      const laporanId = result.lastInsertRowid;

      for (const foto of photos) {
        const filePath = typeof foto === 'string' ? foto : (foto.file_path || foto.path || '');
        const originalName = typeof foto === 'object' ? (foto.original_name || foto.originalName || null) : null;
        const fileSize = typeof foto === 'object' ? (foto.file_size || foto.size || null) : null;
        if (filePath) {
          insertFoto.run(laporanId, filePath, originalName, fileSize);
        }
      }

      return laporanId;
    });

    const laporanId = transaction(data, fotos);
    return this.findById(laporanId);
  },

  /**
   * Delete a laporan and its photos
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    // Photos are cascade-deleted via FK constraint
    const result = db.prepare('DELETE FROM laporan WHERE id = ?').run(id);
    return result.changes > 0;
  },

  /**
   * Get today's statistics
   * @param {object} [filters] - optional koridor filter
   * @returns {object}
   */
  getStats({ koridor, tanggal } = {}) {
    const dateFilter = tanggal || new Date().toISOString().slice(0, 10);
    let where = 'WHERE DATE(l.waktu_patroli) = ?';
    const params = [dateFilter];

    if (koridor) {
      where += ' AND l.koridor = ?';
      params.push(koridor);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM laporan l ${where}`).get(...params).count;
    const aman = db.prepare(`SELECT COUNT(*) as count FROM laporan l ${where} AND l.status = 'aman'`).get(...params).count;
    const temuan = db.prepare(`SELECT COUNT(*) as count FROM laporan l ${where} AND l.status = 'temuan'`).get(...params).count;

    // Breakdown by koridor
    const byKoridor = db.prepare(`
      SELECT l.koridor, COUNT(*) as total,
        SUM(CASE WHEN l.status = 'aman' THEN 1 ELSE 0 END) as aman,
        SUM(CASE WHEN l.status = 'temuan' THEN 1 ELSE 0 END) as temuan
      FROM laporan l ${where}
      GROUP BY l.koridor
      ORDER BY l.koridor
    `).all(...params);

    // Breakdown by shift
    const byShift = db.prepare(`
      SELECT l.shift, COUNT(*) as total
      FROM laporan l ${where}
      GROUP BY l.shift
      ORDER BY l.shift
    `).all(...params);

    return { tanggal: dateFilter, total, aman, temuan, byKoridor, byShift };
  },

  /**
   * Get monthly recap
   * @param {object} opts
   * @param {number} opts.bulan - month (1-12)
   * @param {number} opts.tahun - year
   * @param {string} [opts.koridor]
   * @returns {object}
   */
  getRekapBulanan({ bulan, tahun, koridor } = {}) {
    const now = new Date();
    const month = bulan || (now.getMonth() + 1);
    const year = tahun || now.getFullYear();
    const monthStr = String(month).padStart(2, '0');

    let where = "WHERE strftime('%Y-%m', l.waktu_patroli) = ?";
    const params = [`${year}-${monthStr}`];

    if (koridor) {
      where += ' AND l.koridor = ?';
      params.push(koridor);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM laporan l ${where}`).get(...params).count;
    const aman = db.prepare(`SELECT COUNT(*) as count FROM laporan l ${where} AND l.status = 'aman'`).get(...params).count;
    const temuan = db.prepare(`SELECT COUNT(*) as count FROM laporan l ${where} AND l.status = 'temuan'`).get(...params).count;

    // Daily breakdown
    const daily = db.prepare(`
      SELECT DATE(l.waktu_patroli) as tanggal, COUNT(*) as total,
        SUM(CASE WHEN l.status = 'aman' THEN 1 ELSE 0 END) as aman,
        SUM(CASE WHEN l.status = 'temuan' THEN 1 ELSE 0 END) as temuan
      FROM laporan l ${where}
      GROUP BY DATE(l.waktu_patroli)
      ORDER BY tanggal
    `).all(...params);

    // By koridor
    const byKoridor = db.prepare(`
      SELECT l.koridor, COUNT(*) as total,
        SUM(CASE WHEN l.status = 'aman' THEN 1 ELSE 0 END) as aman,
        SUM(CASE WHEN l.status = 'temuan' THEN 1 ELSE 0 END) as temuan
      FROM laporan l ${where}
      GROUP BY l.koridor
      ORDER BY l.koridor
    `).all(...params);

    // By user
    const byUser = db.prepare(`
      SELECT u.nama_lengkap, COUNT(*) as total,
        SUM(CASE WHEN l.status = 'aman' THEN 1 ELSE 0 END) as aman,
        SUM(CASE WHEN l.status = 'temuan' THEN 1 ELSE 0 END) as temuan
      FROM laporan l
      JOIN users u ON l.user_id = u.id
      ${where}
      GROUP BY l.user_id
      ORDER BY total DESC
    `).all(...params);

    return { bulan: month, tahun: year, total, aman, temuan, daily, byKoridor, byUser };
  },
};

module.exports = Laporan;
