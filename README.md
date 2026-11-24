# 🛡️ Security Patrol System - Trans Banyumas

Sistem manajemen patroli keamanan untuk **PT Trans Banyumas** (BRT Trans Banyumas).

## 📋 Fitur Utama

### 👮 Untuk Security (Petugas Lapangan)
- ✅ Login dengan akun yang dikelola Super Admin
- ✅ Input laporan patroli per koridor (I, II, III A, III B, IV, Kantor Pusat)
- ✅ Ambil foto bukti dari kamera atau galeri (auto-compress)
- ✅ Bukti lokasi GPS otomatis
- ✅ Checklist item pengecekan per area
- ✅ Status: Aman / Temuan + Prioritas
- ✅ Share laporan ke WhatsApp
- ✅ Riwayat patroli pribadi

### 👑 Untuk Super Admin
- ✅ Dashboard overview (statistik real-time)
- ✅ Kelola akun security (CRUD user)
- ✅ Lihat semua laporan dari semua petugas
- ✅ Statistik bulanan per koridor & per petugas
- ✅ Export CSV
- ✅ Audit log (siapa melakukan apa dan kapan)
- ✅ Reset password user
- ✅ Aktifkan / Nonaktifkan akun

### 🔐 Keamanan
- JWT authentication (token-based)
- Password di-hash dengan bcrypt (12 rounds)
- Role-Based Access Control (RBAC)
- Rate limiting (brute-force protection)
- Input validation & sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention
- Helmet.js security headers
- Audit trail lengkap

---

## 🚀 Instalasi & Setup

### Prasyarat
- **Node.js** v18+ ([Download](https://nodejs.org))
- **npm** (sudah termasuk dengan Node.js)
- **Git** (opsional, untuk version control)

### Langkah Instalasi

```bash
# 1. Clone atau masuk ke folder proyek
cd d:\Projects\security-transbanyumas

# 2. Install dependencies
npm install

# 3. Setup environment variables
# File .env sudah ada dengan default values
# Edit jika perlu (terutama JWT_SECRET untuk production!)

# 4. Jalankan database migration & seed
npm run seed

# 5. Jalankan server
npm start

# Atau untuk development (auto-restart):
npm run dev
```

### Akses Aplikasi
Buka browser: **http://localhost:3000**

### Akun Default

| Role | Username | Password | Keterangan |
|------|----------|----------|------------|
| Super Admin | `superadmin` | `Admin@TransBms2024` | Akun utama pengelola |
| Security | `security1` | `Security@123` | Petugas: Bayu Prasetyo |
| Security | `security2` | `Security@123` | Petugas: Adi Nugroho |

> ⚠️ **PENTING:** Segera ganti password default setelah login pertama kali!

---

## 📁 Struktur Proyek

```
security-transbanyumas/
├── server/              # Backend (Node.js/Express)
│   ├── app.js           # Express app setup
│   ├── server.js        # Server entry point
│   ├── config/          # Konfigurasi (database, auth, cors)
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── middleware/       # Auth, role, rate limit, validation
│   ├── utils/           # Hash, token, logger helpers
│   ├── database/        # Schema, seed, migration
│   └── uploads/         # Foto upload (auto-generated)
│
├── public/              # Frontend (HTML/CSS/JS)
│   ├── index.html       # Halaman login
│   ├── dashboard.html   # Dashboard security
│   ├── admin.html       # Panel super admin
│   ├── css/             # Stylesheet
│   ├── js/              # JavaScript modules
│   └── assets/          # Logo, icons, images
│
└── docs/                # Dokumentasi
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/refresh` | Refresh token | Auth |
| GET | `/api/auth/me` | Info user aktif | Auth |
| PUT | `/api/auth/change-password` | Ganti password | Auth |

### Users (Super Admin Only)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/users` | List semua user |
| POST | `/api/users` | Buat user baru |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Nonaktifkan user |
| PUT | `/api/users/:id/reset-password` | Reset password |
| PUT | `/api/users/:id/toggle-active` | Aktifkan/nonaktifkan |

### Laporan
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan` | List laporan (filter) | Auth |
| POST | `/api/laporan` | Buat laporan baru | Security |
| GET | `/api/laporan/:id` | Detail laporan | Auth |
| DELETE | `/api/laporan/:id` | Hapus laporan | Admin |
| GET | `/api/laporan/stats/today` | Statistik hari ini | Auth |
| GET | `/api/laporan/stats/monthly` | Statistik bulanan | Auth |

### Upload
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/api/upload` | Upload foto | Auth |

---

## 🏗️ Deployment ke Production

### Environment Variables yang WAJIB diganti:
```env
JWT_SECRET=ganti-dengan-random-string-minimal-32-karakter
PORT=3000  # atau port yang tersedia
```

### Rekomendasi Production:
1. Gunakan **MySQL/PostgreSQL** sebagai database (ganti SQLite)
2. Gunakan **NGINX** sebagai reverse proxy
3. Aktifkan **HTTPS** (SSL certificate)
4. Set `NODE_ENV=production`
5. Gunakan **PM2** untuk process management:
   ```bash
   npm install -g pm2
   pm2 start server/server.js --name security-app
   pm2 startup
   pm2 save
   ```

---

## 📞 Kontak & Support

**PT Trans Banyumas**  
Sistem dikembangkan untuk internal perusahaan.

---

*Built with ❤️ for Trans Banyumas Security Team*
# security-transbanyumas
