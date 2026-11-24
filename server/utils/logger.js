/**
 * Audit log utility - writes entries to audit_log table
 */
const db = require('../config/database');

/**
 * Write an audit log entry
 * @param {object} opts
 * @param {number} opts.userId - ID of the acting user
 * @param {string} opts.action - e.g. 'LOGIN', 'CREATE_LAPORAN'
 * @param {string} [opts.targetTable] - affected table
 * @param {number} [opts.targetId] - affected row id
 * @param {object|string} [opts.detail] - extra detail (will be JSON-stringified)
 * @param {string} [opts.ipAddress] - request IP
 */
function auditLog({ userId, action, targetTable, targetId, detail, ipAddress }) {
  try {
    const detailStr = detail && typeof detail === 'object' ? JSON.stringify(detail) : detail || null;
    db.prepare(`
      INSERT INTO audit_log (user_id, action, target_table, target_id, detail, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, targetTable || null, targetId || null, detailStr, ipAddress || null);
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}

module.exports = { auditLog };
