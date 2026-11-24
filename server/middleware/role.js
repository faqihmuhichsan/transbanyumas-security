/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the allowed roles.
 */

/**
 * @param  {...string} roles - Allowed roles, e.g. 'super_admin', 'admin', 'security'
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.',
      });
    }

    next();
  };
}

module.exports = { requireRole };
