/**
 * Database Seeder
 * Populates initial accounts: Super Admin and sample Security Officers
 */
const { hashPassword } = require('../utils/hash');

function runSeed(dbInstance) {
  const db = dbInstance || require('../config/database');
  console.log('[Seed] Memulai seeding database...');

  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (usersCount > 0) {
    console.log('[Seed] Database sudah memiliki data user. Lewati seeding awal.');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, nama_lengkap, role, no_hp, koridor_default, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const insertAllUsers = db.transaction(() => {
    // 1. Super Admin
    const adminPass = hashPassword('Admin@TransBms2024');
    insertUser.run('superadmin', adminPass, 'Super Administrator Trans Banyumas', 'super_admin', '081122334455', 'Kantor Pusat');

    // 2. Supervisor / Admin
    const spvPass = hashPassword('Spv@TransBms2024');
    insertUser.run('supervisor1', spvPass, 'Agus Setiawan (Koordinator Security)', 'admin', '081298765432', 'Kantor Pusat');

    // 3. Security 1
    const sec1Pass = hashPassword('Security@123');
    insertUser.run('security1', sec1Pass, 'Bayu Prasetyo', 'security', '085712345678', 'Koridor I');

    // 4. Security 2
    const sec2Pass = hashPassword('Security@123');
    insertUser.run('security2', sec2Pass, 'Adi Nugroho', 'security', '085887654321', 'Koridor II');

    // 5. Security 3
    const sec3Pass = hashPassword('Security@123');
    insertUser.run('security3', sec3Pass, 'Rian Hidayat', 'security', '082134567890', 'Koridor III A');
  });

  insertAllUsers();

  console.log('✅ Seeding berhasil!');
  console.log('----------------------------------------------------');
  console.log('Akun Super Admin: username="superadmin", password="Admin@TransBms2024"');
  console.log('Akun Koordinator: username="supervisor1", password="Spv@TransBms2024"');
  console.log('Akun Security 1:  username="security1",  password="Security@123"');
  console.log('Akun Security 2:  username="security2",  password="Security@123"');
  console.log('Akun Security 3:  username="security3",  password="Security@123"');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  runSeed();
  process.exit(0);
}

module.exports = runSeed;