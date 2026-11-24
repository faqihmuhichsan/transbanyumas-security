/**
 * Audit Log Routes
 * Super Admin & Admin access
 */
const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(authenticate);
router.use(requireRole('super_admin', 'admin'));

router.get('/', (req, res) => {
  const { page = 1, limit = 50, user_id, action, tanggal_mulai, tanggal_selesai } = req.query;
  const result = AuditLog.findAll({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    user_id: user_id ? parseInt(user_id, 10) : undefined,
    action,
    tanggal_mulai,
    tanggal_selesai,
  });

  res.json({ success: true, ...result });
});

module.exports = router;
