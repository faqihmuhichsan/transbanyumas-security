/**
 * Global error handler middleware
 * Returns sanitized error responses; hides stack traces in production.
 */
function errorHandler(err, req, res, _next) {
  // Log error details server-side
  console.error(`[Error] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Ukuran file terlalu besar. Maksimal 5MB.',
    });
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Field upload tidak sesuai.',
    });
  }

  // Validation errors from express-validator (thrown manually)
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal.',
      errors: err.errors,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'Terjadi kesalahan internal server.'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
  });
}

module.exports = errorHandler;
