# 🛠️ Panduan Setup & Deployment

## Setup Development

### 1. Install Node.js
Download dan install dari: https://nodejs.org (versi 18 atau lebih baru)

Verifikasi:
```bash
node --version   # Harus v18+
npm --version    # Harus v9+
```

### 2. Clone / Download Proyek
```bash
cd d:\Projects
# Jika pakai git:
git clone <repo-url> security-transbanyumas
cd security-transbanyumas
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment
```bash
# File .env sudah ada, edit jika perlu:
notepad .env
```

Yang perlu diganti untuk production:
- `JWT_SECRET` — Harus string random minimal 32 karakter
- `PORT` — Port yang diinginkan (default 3000)

### 5. Seed Database
```bash
npm run seed
```
Ini akan membuat:
- Database SQLite di `server/database/security.db`
- Akun Super Admin default
- Akun Security contoh

### 6. Jalankan
```bash
# Development (auto-restart saat edit):
npm run dev

# Production:
npm start
```

Buka: http://localhost:3000

---

## Setup Production (VPS/Server)

### Rekomendasi Server
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimal 1GB
- **Storage**: 10GB+ (tergantung jumlah foto)
- **Provider**: DigitalOcean, Vultr, AWS Lightsail, atau VPS lokal

### 1. Install Node.js di Server
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3. Upload Proyek ke Server
```bash
# Via Git
git clone <repo-url> /var/www/security-transbanyumas
cd /var/www/security-transbanyumas

# Install dependencies
npm install --production
```

### 4. Setup Environment Production
```bash
cp .env.example .env
nano .env
```
```env
PORT=3000
JWT_SECRET=GANTI_DENGAN_STRING_RANDOM_YANG_SANGAT_PANJANG_DAN_UNIK
JWT_EXPIRES_IN=8h
NODE_ENV=production
```

### 5. Seed Database
```bash
npm run seed
```

### 6. Jalankan dengan PM2
```bash
pm2 start server/server.js --name security-app
pm2 startup    # Auto-start saat reboot
pm2 save
```

### 7. Setup NGINX (Reverse Proxy + HTTPS)
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Buat konfigurasi:
```bash
sudo nano /etc/nginx/sites-available/security
```

```nginx
server {
    listen 80;
    server_name security.transbanyumas.com;  # Ganti domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/security /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup HTTPS (gratis):
sudo certbot --nginx -d security.transbanyumas.com
```

### 8. Monitoring
```bash
pm2 status           # Cek status
pm2 logs security-app # Lihat log
pm2 monit            # Monitor realtime
```

---

## Backup Database

### Manual Backup
```bash
# Backup database SQLite
cp server/database/security.db server/database/backup-$(date +%Y%m%d).db

# Backup foto
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz server/uploads/
```

### Auto Backup (Cron)
```bash
crontab -e
# Tambahkan (backup harian jam 2 pagi):
0 2 * * * cp /var/www/security-transbanyumas/server/database/security.db /backups/security-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

### Port 3000 sudah digunakan
```bash
# Ganti PORT di .env
PORT=3001

# Atau kill proses yang pakai port 3000:
# Windows: netstat -ano | findstr :3000
# Linux: sudo lsof -i :3000
```

### Database error
```bash
# Hapus dan buat ulang database:
rm server/database/security.db
npm run seed
```

### Permission error (Linux)
```bash
sudo chown -R $USER:$USER /var/www/security-transbanyumas
chmod -R 755 server/uploads
```
