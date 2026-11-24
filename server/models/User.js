/**
 * User model - CRUD operations for users table
 */
const db = require('../config/database');

const User = {
  /**
   * Find a user by ID
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    return db.prepare(`
      SELECT id, username, nama_lengkap, role, no_hp, koridor_default, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id);
  },

  /**
   * Find a user by ID including password hash (for auth)
   * @param {number} id
   * @returns {object|undefined}
   */
  findByIdWithPassword(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  /**
   * Find a user by username (includes password_hash for login)
   * @param {string} username
   * @returns {object|undefined}
   */
  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  /**
   * Get all users with optional pagination and search
   * @param {object} opts
   * @param {number} opts.page
   * @param {number} opts.limit
   * @param {string} [opts.search]
   * @param {string} [opts.role]
   * @returns {{ data: object[], total: number }}
   */
  findAll({ page = 1, limit = 20, search, role } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (username LIKE ? OR nama_lengkap LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params).count;

    const data = db.prepare(`
      SELECT id, username, nama_lengkap, role, no_hp, koridor_default, is_active, created_at, updated_at
      FROM users ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Create a new user
   * @param {object} data
   * @returns {object} created user (without password)
   */
  create({ username, password_hash, nama_lengkap, role, no_hp, koridor_default }) {
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, nama_lengkap, role, no_hp, koridor_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, password_hash, nama_lengkap, role || 'security', no_hp || null, koridor_default || null);

    return this.findById(result.lastInsertRowid);
  },

  /**
   * Update user fields
   * @param {number} id
   * @param {object} data
   * @returns {object|undefined} updated user
   */
  update(id, { nama_lengkap, role, no_hp, koridor_default }) {
    db.prepare(`
      UPDATE users
      SET nama_lengkap = COALESCE(?, nama_lengkap),
          role = COALESCE(?, role),
          no_hp = COALESCE(?, no_hp),
          koridor_default = COALESCE(?, koridor_default),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nama_lengkap || null, role || null, no_hp || null, koridor_default || null, id);

    return this.findById(id);
  },

  /**
   * Update a user's password hash
   * @param {number} id
   * @param {string} passwordHash
   * @returns {boolean}
   */
  updatePassword(id, passwordHash) {
    const result = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(passwordHash, id);
    return result.changes > 0;
  },

  /**
   * Toggle user active status (soft delete / reactivate)
   * @param {number} id
   * @returns {object|undefined}
   */
  toggleActive(id) {
    db.prepare(`
      UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
    return this.findById(id);
  },

  /**
   * Soft-delete a user (deactivate)
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db.prepare(`
      UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
    return result.changes > 0;
  },
};

module.exports = User;
