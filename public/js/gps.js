/**
 * GPS & Geolocation Module
 * Trans Banyumas Security Patrol
 */

let gpsData = null;
let gpsMencoba = false;

function updateGPSBox() {
  const box = document.getElementById('gpsBox');
  const status = document.getElementById('gpsStatus');
  const detail = document.getElementById('gpsDetail');
  if (!box || !status || !detail) return;

  if (!gpsData) {
    status.textContent = '⚪ Belum dicek. Pencet tombol di bawah.';
    detail.textContent = 'GPS: - • Akurasi: - • Waktu: -';
    box.className = 'bg-slate-50 border rounded-2xl p-3 mt-2 text-xs';
    return;
  }

  if (gpsData.dilewati) {
    status.textContent = '⏭️ GPS DILEWATI - Tetap bisa kirim';
    detail.textContent = 'GPS dilewati manual oleh petugas.';
    box.className = 'bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mt-2 text-xs';
    return;
  }

  status.textContent = `✅ BUKTI LOKASI TERSIMPAN - ${gpsData.lat.toFixed(6)}, ${gpsData.lng.toFixed(6)}`;
  box.className = 'bg-green-50 border border-green-200 rounded-2xl p-3 mt-2 text-xs';
  detail.textContent = `GPS: ${gpsData.lat.toFixed(6)}, ${gpsData.lng.toFixed(6)} • Akurasi: ±${Math.round(gpsData.akurasi)}m • Waktu: ${gpsData.waktu}`;
}

function cekGPS() {
  const inTitik = document.getElementById('inTitik');
  const titik = inTitik ? inTitik.value.trim() : '';
  if (!titik) {
    showToast('Ketik Titik Pengecekan dulu! Contoh: Pos Jaga', 'warn');
    if (inTitik) inTitik.focus();
    return;
  }

  if (!navigator.geolocation) {
    showToast('HP ini tidak mendukung fitur GPS', 'err');
    return;
  }

  if (gpsMencoba) return;
  gpsMencoba = true;

  const btn = document.getElementById('btnGPS');
  const status = document.getElementById('gpsStatus');
  if (btn) {
    btn.textContent = '⏳ Mengambil lokasi... (maks 8 detik)';
    btn.disabled = true;
  }
  if (status) status.textContent = '⏳ Mengambil lokasi...';

  navigator.geolocation.getCurrentPosition(suksesGPS, gagalGPS, {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 60000,
  });
}

function suksesGPS(pos) {
  gpsMencoba = false;
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const ak = pos.coords.accuracy;

  gpsData = {
    lat,
    lng,
    akurasi: ak,
    waktu: formatWaktu(new Date()),
    dilewati: false,
  };

  const btn = document.getElementById('btnGPS');
  if (btn) {
    btn.textContent = '📍 AMBIL BUKTI LOKASI (CEPET)';
    btn.disabled = false;
  }
  updateGPSBox();
  showToast(`Bukti lokasi tersimpan ✅<br>${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'ok');
}

function gagalGPS(err) {
  gpsMencoba = false;
  const btn = document.getElementById('btnGPS');
  const status = document.getElementById('gpsStatus');
  const detail = document.getElementById('gpsDetail');

  if (btn) {
    btn.textContent = '📍 AMBIL BUKTI LOKASI (CEPET)';
    btn.disabled = false;
  }
  if (status) status.textContent = '⚠️ GPS gagal / timeout. Bisa Coba Lagi / Lewati.';
  if (detail) detail.textContent = 'Aktifkan Lokasi di HP & coba lagi di luar ruangan, atau klik Lewati GPS.';

  showToast('GPS gagal: ' + err.message + '. Aktifkan izin lokasi atau klik Lewati.', 'err', 4000);
}

async function lewatiGPS() {
  const ya = await showConfirm('Lewati GPS?', 'Laporan tetap bisa dikirim, tapi tercatat "GPS DILEWATI". Lanjut?', '⏭️');
  if (!ya) return;

  gpsData = {
    lat: 0,
    lng: 0,
    akurasi: 0,
    waktu: formatWaktu(new Date()),
    dilewati: true,
  };

  updateGPSBox();
  const errorBox = document.getElementById('errorBox');
  if (errorBox) errorBox.classList.add('hidden');
  showToast('GPS dilewati, tetap bisa kirim laporan.', 'warn');
}

function bukaMapsGPS(lat, lng) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
}

window.gpsData = gpsData;
window.cekGPS = cekGPS;
window.lewatiGPS = lewatiGPS;
window.updateGPSBox = updateGPSBox;
window.bukaMapsGPS = bukaMapsGPS;
