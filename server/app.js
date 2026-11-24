/**
 * Express Application Setup
 * Security Patrol System - Trans Banyumas
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const laporanRoutes = require('./routes/laporan');
const uploadRoutes = require('./routes/upload');
const auditRoutes = require('./routes/audit');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for CDN Tailwind & scripts
    crossOriginEmbedderPolicy: false,
  })
);

// CORS config
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for general API requests
app.use('/api', generalLimiter);

// Body Parsers (allow up to 15MB for photo payloads / multipart)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static files (Frontend and uploaded photos)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Security Patrol Trans Banyumas',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit-log', auditRoutes);

// Fallback for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
  }
  // Serve public/index.html by default
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
