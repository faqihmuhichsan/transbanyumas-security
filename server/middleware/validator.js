/**
 * Input validation rules using express-validator
 */
const { body } = require('express-validator');

// Login validation
const loginRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username wajib diisi.')
    .isLength({ min: 3, max: 50 }).withMessage('Username harus 3-50 karakter.'),
  body('password')
    .notEmpty().withMessage('Password wajib diisi.'),
];

// Create user validation
const createUserRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username wajib diisi.')
    .isLength({ min: 3, max: 50 }).withMessage('Username harus 3-50 karakter.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, dan underscore.'),
  body('password')
    .notEmpty().withMessage('Password wajib diisi.')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
  body('nama_lengkap')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi.')
    .isLength({ min: 2, max: 100 }).withMessage('Nama lengkap harus 2-100 karakter.'),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'security']).withMessage('Role tidak valid.'),
  body('no_hp')
    .optional({ values: 'falsy' })
    .trim()
    .isMobilePhone('id-ID').withMessage('Nomor HP tidak valid.'),
  body('koridor_default')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Koridor maksimal 100 karakter.'),
];

// Update user validation
const updateUserRules = [
  body('nama_lengkap')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nama lengkap harus 2-100 karakter.'),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'security']).withMessage('Role tidak valid.'),
  body('no_hp')
    .optional({ values: 'falsy' })
    .trim(),
  body('koridor_default')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Koridor maksimal 100 karakter.'),
];

// Create laporan validation
const createLaporanRules = [
  body('koridor')
    .trim()
    .notEmpty().withMessage('Koridor wajib diisi.'),
  body('shift')
    .trim()
    .notEmpty().withMessage('Shift wajib diisi.'),
  body('titik')
    .trim()
    .notEmpty().withMessage('Titik patroli wajib diisi.'),
  body('status')
    .optional()
    .isIn(['aman', 'temuan']).withMessage('Status harus aman atau temuan.'),
  body('kondisi')
    .optional()
    .trim(),
  body('prioritas')
    .optional()
    .isIn(['Rendah', 'Sedang', 'Tinggi', 'Kritis']).withMessage('Prioritas tidak valid.'),
  body('catatan')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 }).withMessage('Catatan maksimal 2000 karakter.'),
  body('gps_lat')
    .optional({ values: 'falsy' })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude tidak valid.'),
  body('gps_lng')
    .optional({ values: 'falsy' })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude tidak valid.'),
  body('gps_akurasi')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 }).withMessage('Akurasi GPS tidak valid.'),
  body('items_cek')
    .optional(),
  body('fotos')
    .optional()
    .isArray().withMessage('Fotos harus berupa array.'),
];

// Change password validation
const changePasswordRules = [
  body('password_lama')
    .notEmpty().withMessage('Password lama wajib diisi.'),
  body('password_baru')
    .notEmpty().withMessage('Password baru wajib diisi.')
    .isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.'),
  body('konfirmasi_password')
    .notEmpty().withMessage('Konfirmasi password wajib diisi.')
    .custom((value, { req }) => {
      if (value !== req.body.password_baru) {
        throw new Error('Konfirmasi password tidak cocok.');
      }
      return true;
    }),
];

module.exports = {
  loginRules,
  createUserRules,
  updateUserRules,
  createLaporanRules,
  changePasswordRules,
};
