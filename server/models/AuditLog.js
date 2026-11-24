/**
 * AuditLog model - read operations for audit_log table
 */
const db = require('../config/database');

const AuditLog = {
  /**
   * Write audit log entry (alias for utils/logger)
   */
  create({ userId, action, targetTable, targetId, detail, ipAddress }) {
    const detailStr = detail && typeof detail === 'object' ? JSON.stringify(detail) : detail || null;
    const result = db.prepare(`
      INSERT INTO audit_log (user_id, action, target_table, target_id, detail, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, targetTable || null, targetId || null, detailStr, ipAddress || null);
    return result.lastInsertRowid;
  },

  /**
   * List audit logs with filters and pagination
   * @param {object} opts
   * @returns {{ data: object[], total: number, page: number, limit: number, totalPages: number }}
   */
  findAll({ page = 1, limit = 50, user_id, action, tanggal_mulai, tanggal_selesai } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (user_id) {
      where += ' AND a.user_id = ?';
      params.push(user_id);
    }
    if (action) {
      where += ' AND a.action = ?';
      params.push(action);
    }
    if (tanggal_mulai) {
      where += ' AND DATE(a.created_at) >= ?';
      params.push(tanggal_mulai);
    }
    if (tanggal_selesai) {
      where += ' AND DATE(a.created_at) <= ?';
      params.push(tanggal_selesai);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM audit_log a ${where}`).get(...params).count;

    const data = db.prepare(`
      SELECT a.*, u.username, u.nama_lengkap
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};

module.exports = AuditLog;
