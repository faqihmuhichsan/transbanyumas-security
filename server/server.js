/**
 * Server Entry Point
 * Security Patrol System - Trans Banyumas
 */
require('dotenv').config();
const http = require('http');
const app = require('./app');

// Ensure database initializes and runs schema
require('./config/database');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('=============================================');
  console.log(`🛡️  SECURITY TRANS BANYUMAS SERVER BERJALAN`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🕒 Waktu: ${new Date().toLocaleString('id-ID')}`);
  console.log('=============================================');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n[Server] Menerima sinyal ${signal}. Menutup server...`);
  server.close(() => {
    console.log('[Server] Koneksi ditutup. Keluar.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
