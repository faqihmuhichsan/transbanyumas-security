/**
 * File upload routes - photo upload with multer
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter: only allow jpeg and png
const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file JPEG dan PNG yang diperbolehkan.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    files: 5, // max 5 files at once
  },
});

/**
 * POST /api/upload
 * Upload one or more photos
 * Returns array of file info objects
 */
router.post(
  '/',
  authenticate,
  uploadLimiter,
  (req, res, next) => {
    upload.array('photos', 5)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              success: false,
              message: 'Ukuran file terlalu besar. Maksimal 5MB per file.',
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: 'Maksimal 5 file per upload.',
            });
          }
          return res.status(400).json({ success: false, message: err.message });
        }
        // Custom file filter error
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload.',
      });
    }

    const files = req.files.map(file => ({
      file_path: `/uploads/${file.filename}`,
      original_name: file.originalname,
      file_size: file.size,
    }));

    res.status(201).json({
      success: true,
      message: `${files.length} file berhasil diupload.`,
      data: files,
    });
  }
);

module.exports = router;
