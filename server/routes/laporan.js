/**
 * Laporan (Patrol Report) routes
 */
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

const Laporan = require('../models/Laporan');
const { auditLog } = require('../utils/logger');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { createLaporanRules } = require('../middleware/validator');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/laporan/stats/today
 * Today's statistics - must be defined BEFORE /:id to avoid route conflict
 */
router.get('/stats/today', (req, res) => {
  const { koridor, tanggal } = req.query;
  const stats = Laporan.getStats({ koridor, tanggal });

  res.json({ success: true, data: stats });
});

/**
 * GET /api/laporan/stats/monthly
 * Monthly statistics
 */
router.get('/stats/monthly', (req, res) => {
  const { bulan, tahun, koridor } = req.query;
  const stats = Laporan.getRekapBulanan({
    bulan: bulan ? parseInt(bulan, 10) : undefined,
    tahun: tahun ? parseInt(tahun, 10) : undefined,
    koridor,
  });

  res.json({ success: true, data: stats });
});

/**
 * GET /api/laporan/export/csv
 * Export laporan to CSV
 */
router.get('/export/csv', requireRole('super_admin', 'admin'), (req, res) => {
  const { koridor, shift, status, tanggal_mulai, tanggal_selesai, user_id } = req.query;

  // Fetch all matching records (no pagination for export)
  const result = Laporan.findAll({
    page: 1,
    limit: 100000,
    koridor,
    shift,
    status,
    tanggal_mulai,
    tanggal_selesai,
    user_id: user_id ? parseInt(user_id, 10) : undefined,
  });

  // Build CSV
  const headers = [
    'ID', 'Petugas', 'Koridor', 'Shift', 'Jam Shift', 'Titik',
    'Status', 'Kondisi', 'Prioritas', 'Catatan',
    'GPS Lat', 'GPS Lng', 'Waktu Patroli',
  ];

  const rows = result.data.map(r => [
    r.id,
    `"${(r.nama_lengkap || '').replace(/"/g, '""')}"`,
    `"${(r.koridor || '').replace(/"/g, '""')}"`,
    `"${(r.shift || '').replace(/"/g, '""')}"`,
    `"${(r.jam_shift || '').replace(/"/g, '""')}"`,
    `"${(r.titik || '').replace(/"/g, '""')}"`,
    r.status,
    `"${(r.kondisi || '').replace(/"/g, '""')}"`,
    r.prioritas,
    `"${(r.catatan || '').replace(/"/g, '""')}"`,
    r.gps_lat || '',
    r.gps_lng || '',
    r.waktu_patroli,
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=laporan-patroli-${new Date().toISOString().slice(0, 10)}.csv`);
  // Add BOM for Excel UTF-8 compatibility
  res.send('\uFEFF' + csv);
});

/**
 * GET /api/laporan
 * List laporan with filters and pagination
 */
router.get('/', (req, res) => {
  const { page = 1, limit = 20, koridor, shift, status, tanggal_mulai, tanggal_selesai, user_id, search } = req.query;

  // Security officers can only see their own reports
  let filteredUserId = user_id ? parseInt(user_id, 10) : undefined;
  if (req.user.role === 'security') {
    filteredUserId = req.user.id;
  }

  const result = Laporan.findAll({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    koridor,
    shift,
    status,
    tanggal_mulai,
    tanggal_selesai,
    user_id: filteredUserId,
    search,
  });

  res.json({ success: true, ...result });
});

/**
 * GET /api/laporan/:id
 * Get laporan detail with photos
 */
router.get('/:id', (req, res) => {
  const laporan = Laporan.findById(parseInt(req.params.id, 10));

  if (!laporan) {
    return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
  }

  // Security can only see their own reports
  if (req.user.role === 'security' && laporan.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  res.json({ success: true, data: laporan });
});

/**
 * POST /api/laporan
 * Create new patrol report
 */
router.post('/', createLaporanRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validasi gagal.', errors: errors.array() });
  }

  const {
    koridor, shift, jam_shift, titik, items_cek,
    status, kondisi, prioritas, catatan,
    gps_lat, gps_lng, gps_akurasi, gps_dilewati,
    waktu_patroli, fotos,
  } = req.body;

  const data = {
    user_id: req.user.id,
    koridor, shift, jam_shift, titik, items_cek,
    status, kondisi, prioritas, catatan,
    gps_lat, gps_lng, gps_akurasi, gps_dilewati,
    waktu_patroli,
  };

  const laporan = Laporan.create(data, fotos || []);

  auditLog({
    userId: req.user.id,
    action: 'CREATE_LAPORAN',
    targetTable: 'laporan',
    targetId: laporan.id,
    detail: { koridor, shift, titik, status: status || 'aman' },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Laporan berhasil dibuat.',
    data: laporan,
  });
});

/**
 * DELETE /api/laporan/:id
 * Delete laporan (admin/super_admin only)
 */
router.delete('/:id', requireRole('super_admin', 'admin'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const laporan = Laporan.findById(id);

  if (!laporan) {
    return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
  }

  Laporan.delete(id);

  auditLog({
    userId: req.user.id,
    action: 'DELETE_LAPORAN',
    targetTable: 'laporan',
    targetId: id,
    detail: { koridor: laporan.koridor, titik: laporan.titik },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: 'Laporan berhasil dihapus.',
  });
});

module.exports = router;
