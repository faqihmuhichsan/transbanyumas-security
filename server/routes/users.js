/**
 * User management routes - super_admin only
 */
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const { hashPassword } = require('../utils/hash');
const { auditLog } = require('../utils/logger');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { createUserRules, updateUserRules } = require('../middleware/validator');

// All routes require authentication + super_admin role
router.use(authenticate);
router.use(requireRole('super_admin'));

/**
 * GET /api/users
 * List all users with pagination and search
 */
router.get('/', (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const result = User.findAll({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    search,
    role,
  });

  res.json({ success: true, ...result });
});

/**
 * GET /api/users/:id
 * Get user detail
 */
router.get('/:id', (req, res) => {
  const user = User.findById(parseInt(req.params.id, 10));

  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  res.json({ success: true, data: user });
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', createUserRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validasi gagal.', errors: errors.array() });
  }

  const { username, password, nama_lengkap, role, no_hp, koridor_default } = req.body;

  // Check duplicate username
  const existing = User.findByUsername(username);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Username sudah digunakan.' });
  }

  const password_hash = hashPassword(password);
  const user = User.create({ username, password_hash, nama_lengkap, role, no_hp, koridor_default });

  auditLog({
    userId: req.user.id,
    action: 'CREATE_USER',
    targetTable: 'users',
    targetId: user.id,
    detail: { username, role: role || 'security' },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'User berhasil dibuat.',
    data: user,
  });
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', updateUserRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validasi gagal.', errors: errors.array() });
  }

  const id = parseInt(req.params.id, 10);
  const existing = User.findById(id);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  const { nama_lengkap, role, no_hp, koridor_default } = req.body;
  const updated = User.update(id, { nama_lengkap, role, no_hp, koridor_default });

  auditLog({
    userId: req.user.id,
    action: 'UPDATE_USER',
    targetTable: 'users',
    targetId: id,
    detail: { nama_lengkap, role, no_hp, koridor_default },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: 'User berhasil diperbarui.',
    data: updated,
  });
});

/**
 * DELETE /api/users/:id
 * Soft delete (deactivate) user
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = User.findById(id);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  // Prevent deleting yourself
  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Tidak dapat menonaktifkan akun sendiri.' });
  }

  User.delete(id);

  auditLog({
    userId: req.user.id,
    action: 'DELETE_USER',
    targetTable: 'users',
    targetId: id,
    detail: { username: existing.username },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: 'User berhasil dinonaktifkan.',
  });
});

/**
 * PUT /api/users/:id/reset-password
 * Reset user password
 */
router.put('/:id/reset-password', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = User.findById(id);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  const { password_baru } = req.body;
  if (!password_baru || password_baru.length < 8) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
  }

  const newHash = hashPassword(password_baru);
  User.updatePassword(id, newHash);

  auditLog({
    userId: req.user.id,
    action: 'RESET_PASSWORD',
    targetTable: 'users',
    targetId: id,
    detail: { username: existing.username },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: 'Password berhasil direset.',
  });
});

/**
 * PUT /api/users/:id/toggle-active
 * Activate or deactivate a user
 */
router.put('/:id/toggle-active', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = User.findById(id);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Tidak dapat mengubah status akun sendiri.' });
  }

  const updated = User.toggleActive(id);

  auditLog({
    userId: req.user.id,
    action: updated.is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    targetTable: 'users',
    targetId: id,
    detail: { username: existing.username, is_active: updated.is_active },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: updated.is_active ? 'User berhasil diaktifkan.' : 'User berhasil dinonaktifkan.',
    data: updated,
  });
});

module.exports = router;
