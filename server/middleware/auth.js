/**
 * JWT Authentication middleware
 * Verifies Bearer token from Authorization header and attaches user to req.
 */
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. User tidak ditemukan.',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Akun Anda telah dinonaktifkan.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kadaluarsa. Silakan login kembali.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
}

module.exports = authenticate;
