# 📡 API Documentation - Security Patrol System

Base URL: `http://localhost:3000/api`

## Authentication

Semua endpoint (kecuali login) memerlukan header:
```
Authorization: Bearer <jwt_token>
```

---

## POST /api/auth/login

Login dan dapatkan JWT token.

**Request Body:**
```json
{
  "username": "security1",
  "password": "Security@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJI...",
    "refreshToken": "eyJhbGciOiJI...",
    "user": {
      "id": 2,
      "username": "security1",
      "nama_lengkap": "Bayu Prasetyo",
      "role": "security",
      "koridor_default": "Koridor I"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Username atau password salah"
}
```

---

## GET /api/auth/me

Dapatkan info user yang sedang login.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "security1",
    "nama_lengkap": "Bayu Prasetyo",
    "role": "security",
    "no_hp": "08123456789",
    "koridor_default": "Koridor I",
    "is_active": 1
  }
}
```

---

## PUT /api/auth/change-password

Ganti password sendiri.

**Request Body:**
```json
{
  "oldPassword": "Security@123",
  "newPassword": "NewPassword@456"
}
```

---

## GET /api/users

List semua user. **Super Admin only.**

**Query Parameters:**
- `search` - Cari berdasarkan username atau nama
- `role` - Filter berdasarkan role (super_admin, admin, security)
- `page` - Nomor halaman (default: 1)
- `limit` - Jumlah per halaman (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 10,
    "page": 1,
    "totalPages": 1
  }
}
```

---

## POST /api/users

Buat user baru. **Super Admin only.**

**Request Body:**
```json
{
  "username": "security3",
  "password": "Security@123",
  "nama_lengkap": "Dian Saputra",
  "role": "security",
  "no_hp": "08987654321",
  "koridor_default": "Koridor III A"
}
```

---

## POST /api/laporan

Buat laporan patroli baru. **Security only.**

**Request Body:**
```json
{
  "koridor": "Koridor I",
  "shift": "Pagi",
  "jam_shift": "07:00 - 19:00",
  "titik": "Pos Jaga Utama",
  "items_cek": ["Start Poin Koridor", "Pompa Air", "CCTV"],
  "status": "aman",
  "kondisi": "Baik",
  "prioritas": "Sedang",
  "catatan": "Kondisi aman, tidak ada temuan.",
  "gps_lat": -7.4316,
  "gps_lng": 109.2497,
  "gps_akurasi": 15,
  "gps_dilewati": false,
  "foto_paths": ["/uploads/abc123.jpg", "/uploads/def456.jpg"]
}
```

---

## GET /api/laporan

List laporan dengan filter.

**Query Parameters:**
- `koridor` - Filter koridor
- `shift` - Filter shift (Pagi/Malam)
- `status` - Filter status (aman/temuan)
- `user_id` - Filter berdasarkan petugas
- `tanggal_dari` - Tanggal mulai (YYYY-MM-DD)
- `tanggal_sampai` - Tanggal akhir (YYYY-MM-DD)
- `bulan` - Filter bulan (YYYY-MM)
- `page` - Nomor halaman
- `limit` - Jumlah per halaman

---

## POST /api/upload

Upload foto. Gunakan `multipart/form-data`.

**Form Data:**
- `photos` - File foto (bisa multiple, max 6 file, max 5MB per file)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "path": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
        "originalName": "foto-1.jpg",
        "size": 245760
      }
    ]
  }
}
```

---

## Error Response Format

Semua error mengikuti format:
```json
{
  "success": false,
  "message": "Pesan error yang user-friendly",
  "errors": [] // Detail validasi jika ada
}
```

**HTTP Status Codes:**
- `200` - Sukses
- `201` - Berhasil dibuat
- `400` - Request tidak valid
- `401` - Tidak terautentikasi
- `403` - Tidak punya akses (forbidden)
- `404` - Tidak ditemukan
- `429` - Rate limit exceeded
- `500` - Server error
