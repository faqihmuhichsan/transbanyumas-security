/**
 * Laporan (Patrol Report) Form & Viewing Module
 * Trans Banyumas Security Patrol
 */

let filterLaporan = 'semua';
let cariLaporan = '';
let filterRiwayat = '';
let cacheLaporan = [];

async function kirimLaporan() {
  const inTitik = document.getElementById('inTitik');
  const inCatatan = document.getElementById('inCatatan');
  const titik = inTitik ? inTitik.value.trim() : '';
  const catatan = inCatatan ? inCatatan.value.trim() : '';

  const kurang = [];
  const blobs = window.getFotoBlobs();

  if (!blobs || !blobs.length) kurang.push('📷 FOTO belum ada (minimal 1)');
  if (!titik) kurang.push('📍 TITIK PENGECEKAN masih kosong');
  if (!window.selectedItems || !window.selectedItems.size) kurang.push('🔍 ITEM CEK belum dipilih');
  if (!catatan) kurang.push('📝 CATATAN masih kosong');

  const err = document.getElementById('errorBox');
  if (kurang.length) {
    if (err) {
      err.classList.remove('hidden');
      err.innerHTML = '⚠️ BELUM BISA DIKIRIM, KURANG:<br>• ' + kurang.join('<br>• ');
      err.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (!titik && inTitik) inTitik.focus();
    showToast('Lengkapi dulu data laporan!', 'warn');
    return;
  }

  if (!window.gpsData) {
    const ya = await showConfirm('Kirim tanpa GPS?', 'GPS belum dicek. Tetap kirim tanpa bukti lokasi?', '📍');
    if (!ya) return;
    window.gpsData = { lat: 0, lng: 0, akurasi: 0, waktu: formatWaktu(new Date()), dilewati: true };
  }

  if (err) err.classList.add('hidden');

  const btnKirim = document.getElementById('btnKirim');
  showLoading(btnKirim, 'Mengupload foto & menyimpan...');

  try {
    // 1. Upload photos first
    const formData = new FormData();
    blobs.forEach((b, idx) => {
      formData.append('photos', b, `patroli_${Date.now()}_${idx}.jpg`);
    });

    const uploadRes = await API.upload.photos(formData);
    const uploadedPaths = uploadRes.data.map(f => f.file_path);

    // 2. Submit report
    const payload = {
      koridor: window.koridorAktif,
      shift: window.shift,
      jam_shift: window.jamShiftText(window.shift),
      titik: titik,
      items_cek: Array.from(window.selectedItems),
      status: window.statusLaporan,
      kondisi: window.kondisi,
      prioritas: window.prioritas,
      catatan: catatan,
      gps_lat: window.gpsData.lat,
      gps_lng: window.gpsData.lng,
      gps_akurasi: window.gpsData.akurasi,
      gps_dilewati: window.gpsData.dilewati ? 1 : 0,
      fotos: uploadedPaths,
    };

    const res = await API.laporan.create(payload);

    // 3. Show success dialog
    const lap = res.data;
    lap.fotos = uploadedPaths.map(p => ({ file_path: p }));
    window.laporanTerakhir = lap;

    document.getElementById('suksesKoridor').textContent = lap.koridor;
    document.getElementById('suksesShift').textContent = `${lap.shift} (${lap.jam_shift})`;
    document.getElementById('suksesTitik').textContent = lap.titik;
    document.getElementById('suksesFoto').textContent = `${uploadedPaths.length} foto`;
    document.getElementById('suksesStatus').textContent = lap.status === 'aman' ? '✅ AMAN' : '⚠️ TEMUAN';
    document.getElementById('suksesGPS').textContent = lap.gps_dilewati ? '⏭️ DILEWATI' : `✅ ${Number(lap.gps_lat).toFixed(6)}, ${Number(lap.gps_lng).toFixed(6)}`;

    // Reset Form
    window.resetFotoList();
    if (inTitik) inTitik.value = '';
    if (inCatatan) inCatatan.value = '';
    window.selectedItems = new Set(window.getDefaultCek());
    window.renderCekItems();
    window.setStatus('aman');
    window.setKondisi('Baik');
    window.gpsData = null;
    window.updateGPSBox();

    document.getElementById('overlaySukses').classList.remove('hidden');
    showToast('Laporan berhasil tersimpan di server! 🎉', 'ok');
  } catch (e) {
    showToast('Gagal mengirim laporan: ' + e.message, 'err', 5000);
  } finally {
    hideLoading(btnKirim);
  }
}

function teksLaporan(l) {
  const gpsTxt = l.gps_dilewati
    ? '⏭️ GPS DILEWATI'
    : (l.gps_lat ? `✅ ${Number(l.gps_lat).toFixed(6)}, ${Number(l.gps_lng).toFixed(6)} (Akurasi ±${Math.round(l.gps_akurasi || 0)}m)` : 'GPS tidak tercatat');

  const gpsLink = (l.gps_lat && l.gps_lat !== 0)
    ? `https://www.google.com/maps/search/?api=1&query=${l.gps_lat},${l.gps_lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.titik)}`;

  const items = Array.isArray(l.items_cek) ? l.items_cek.join(', ') : (l.items_cek || '-');
  const user = API.getUser();
  const nama = l.nama_lengkap || (user ? user.nama_lengkap : 'Petugas');
  const waktu = l.waktu_patroli ? tanggalIndo(l.waktu_patroli) + ' • ' + formatWaktu(l.waktu_patroli) : '-';

  return `🛡️ *SECURITY - TRANS BANYUMAS*
*LAPORAN PATROLI & CEK*
━━━━━━━━━━━━━━

👤 *Petugas:* ${nama}
🛡️ *Area:* ${l.koridor}
📍 *Titik Pengecekan:* ${l.titik}
🕐 *Shift:* ${l.shift} (${l.jam_shift || ''})
🕒 *Waktu:* ${waktu}

📍 *BUKTI LOKASI:*
${gpsTxt}
🗺️ *Maps:* ${gpsLink}

🔍 *Item Cek:* ${items}
✅ *Status:* ${l.status === 'aman' ? 'AMAN ✅' : 'TEMUAN ⚠️'}
🔧 *Kondisi:* ${l.kondisi || 'Baik'}
⚡ *Prioritas:* ${l.prioritas || 'Sedang'}
📝 *Catatan:* ${l.catatan}

📷 *Foto:* ${(l.fotos || []).length} foto terlampir
━━━━━━━━━━━━━━
_Aplikasi Patroli Security Trans Banyumas_`;
}

function copyLaporan() {
  if (!window.laporanTerakhir) return;
  const txt = teksLaporan(window.laporanTerakhir);
  navigator.clipboard.writeText(txt).then(() => {
    showToast('Teks laporan berhasil di-copy! 📋 Tinggal paste di WhatsApp.', 'ok');
  }).catch(() => {
    showToast('Gagal copy teks.', 'err');
  });
}

function shareLaporanWA() {
  if (!window.laporanTerakhir) return;
  const txt = teksLaporan(window.laporanTerakhir);
  window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function tutupSuksesKeHome() {
  document.getElementById('overlaySukses').classList.add('hidden');
  window.showPage('home');
}

async function renderLaporan() {
  const box = document.getElementById('listLaporan');
  if (!box) return;

  box.innerHTML = '<div class="text-center py-6 text-slate-400">Memuat laporan... ⏳</div>';

  try {
    const filterBulan = document.getElementById('filterBulan');
    const params = {
      limit: 100,
    };
    if (filterBulan && filterBulan.value) {
      const [th, bl] = filterBulan.value.split('-');
      params.tanggal_mulai = `${th}-${bl}-01`;
      params.tanggal_selesai = `${th}-${bl}-31`;
    }
    if (filterLaporan !== 'semua') {
      params.koridor = filterLaporan;
    }
    if (cariLaporan) {
      params.search = cariLaporan;
    }

    const res = await API.laporan.getAll(params);
    cacheLaporan = res.data || [];

    const total = cacheLaporan.length;
    const aman = cacheLaporan.filter(x => x.status === 'aman').length;
    const temuan = cacheLaporan.filter(x => x.status === 'temuan').length;

    document.getElementById('rekapTotal').textContent = total;
    document.getElementById('rekapAman').textContent = aman;
    document.getElementById('rekapTemuan').textContent = temuan;

    if (!cacheLaporan.length) {
      box.innerHTML = '<div class="bg-white rounded-2xl border p-6 text-center text-slate-400 text-sm">Belum ada laporan pada periode ini.<br>Yuk mulai patroli! 🛡️</div>';
      return;
    }

    box.innerHTML = cacheLaporan.map(cardLaporan).join('');
  } catch (err) {
    box.innerHTML = `<div class="bg-red-50 text-red-600 rounded-2xl p-4 text-center text-sm font-bold">Gagal memuat laporan: ${err.message}</div>`;
  }
}

function badgeGPS(x) {
  if (x.gps_dilewati) return '<span class="text-[11px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">📍 GPS ⏭️ DILEWATI</span>';
  if (!x.gps_lat || x.gps_lat === 0) return '<span class="text-[11px] bg-slate-100 px-2 py-1 rounded-full font-bold">📍 GPS: -</span>';
  return `<span class="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">📍 GPS ✅ ${Number(x.gps_lat).toFixed(4)}, ${Number(x.gps_lng).toFixed(4)}</span>`;
}

function cardLaporan(x) {
  const kor = x.koridor;
  const warna = window.WARNA_KORIDOR[kor] || 'bg-blue-600';
  const waktu = x.waktu_patroli ? tanggalIndo(x.waktu_patroli) + ' • ' + formatWaktu(x.waktu_patroli) : '-';
  const fotoThumb = (x.fotos || []).map(f => {
    const url = typeof f === 'string' ? f : f.file_path;
    return `<img src="${url}" loading="lazy" class="w-[52px] h-[52px] object-cover rounded-lg border shrink-0">`;
  }).join('');

  return `
    <div onclick="lihatDetail(${x.id})" class="bg-white rounded-[20px] border p-4 cursor-pointer active:scale-[.98] transition shadow-sm hover:shadow-md">
      <div class="flex justify-between items-start">
        <span class="text-white text-[11px] font-bold px-2.5 py-1 rounded-full ${warna}">${kor}</span>
        <span class="text-[11px] font-bold ${x.status === 'aman' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2.5 py-1 rounded-full">
          ${x.status === 'aman' ? '✅ AMAN' : '⚠️ TEMUAN'}
        </span>
      </div>
      <p class="font-extrabold text-sm mt-2">📍 ${x.titik}</p>
      <p class="text-xs text-slate-500 mt-0.5">👤 ${x.nama_lengkap || 'Petugas'} • ${x.shift} (${x.jam_shift || ''}) • ${waktu}</p>
      <p class="text-xs text-slate-600 mt-1 line-clamp-2">📝 ${x.catatan || '-'}</p>
      <div class="flex flex-wrap gap-1.5 mt-2">${badgeGPS(x)}</div>
      <div class="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar items-center">
        ${fotoThumb}
        <span class="text-[11px] bg-slate-100 px-2.5 py-1.5 rounded-full font-bold text-slate-600 shrink-0">📷 ${(x.fotos || []).length} foto</span>
      </div>
    </div>
  `;
}

async function lihatDetail(id) {
  try {
    const res = await API.laporan.getById(id);
    const x = res.data;
    window.laporanTerakhir = x;

    const kor = x.koridor;
    const warna = window.WARNA_KORIDOR[kor] || 'bg-blue-600';
    const waktu = x.waktu_patroli ? tanggalIndo(x.waktu_patroli) + ' • ' + formatWaktu(x.waktu_patroli) : '-';

    const gpsHtml = x.gps_dilewati
      ? '<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-2 text-xs font-bold text-yellow-800">⏭️ GPS DILEWATI OLEH PETUGAS</div>'
      : (x.gps_lat && x.gps_lat !== 0
        ? `<div class="bg-green-50 border border-green-200 rounded-xl p-3 mt-2 text-xs">
            <p class="font-extrabold text-green-800">✅ BUKTI LOKASI TERSIMPAN</p>
            <p class="text-slate-600 mt-1">Koordinat: ${Number(x.gps_lat).toFixed(6)}, ${Number(x.gps_lng).toFixed(6)} (Akurasi ±${Math.round(x.gps_akurasi || 0)}m)</p>
            <button onclick="bukaMapsGPS(${x.gps_lat}, ${x.gps_lng})" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs mt-2 inline-block">🗺️ Lihat di Google Maps</button>
           </div>`
        : '<p class="text-xs text-slate-400 mt-2">GPS tidak tercatat.</p>');

    const items = Array.isArray(x.items_cek) ? x.items_cek : JSON.parse(x.items_cek || '[]');
    const itemsHtml = items.map(i => `<span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold">${i}</span>`).join('');

    const fotosHtml = (x.fotos || []).map((f, idx) => {
      const url = typeof f === 'string' ? f : f.file_path;
      return `<img onclick="bukaLightboxFoto(${idx}, 'detail')" src="${url}" loading="lazy" class="w-full h-[120px] object-cover rounded-xl border cursor-pointer hover:opacity-90 shadow-sm">`;
    }).join('');

    const user = API.getUser();
    const canDelete = user && (user.role === 'super_admin' || user.role === 'admin');

    document.getElementById('isiDetail').innerHTML = `
      <div class="flex justify-between items-start">
        <span class="text-white text-xs font-bold px-3 py-1.5 rounded-full ${warna}">${kor}</span>
        <span class="text-xs font-bold ${x.status === 'aman' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-3 py-1.5 rounded-full">
          ${x.status === 'aman' ? '✅ AMAN' : '⚠️ TEMUAN'}
        </span>
      </div>
      <h3 class="font-extrabold text-[16px] mt-3">📍 ${x.titik}</h3>
      <p class="text-xs text-slate-500 mt-1">👤 ${x.nama_lengkap || 'Petugas'} • Shift ${x.shift} (${x.jam_shift || ''})<br>🕒 ${waktu}</p>
      
      <p class="text-xs font-bold mt-3">📍 BUKTI LOKASI:</p>
      ${gpsHtml}

      <div class="grid grid-cols-2 gap-2 mt-3">
        <div class="bg-slate-50 rounded-xl p-2.5 text-center">
          <p class="text-[10px] font-bold text-slate-500">KONDISI</p>
          <p class="font-extrabold text-sm">${x.kondisi || 'Baik'}</p>
        </div>
        <div class="bg-slate-50 rounded-xl p-2.5 text-center">
          <p class="text-[10px] font-bold text-slate-500">PRIORITAS</p>
          <p class="font-extrabold text-sm">${x.prioritas || 'Sedang'}</p>
        </div>
      </div>

      <p class="text-xs font-bold mt-3">🔍 ITEM CEK:</p>
      <div class="flex flex-wrap gap-1.5 mt-1">${itemsHtml || '<span class="text-xs text-slate-400">-</span>'}</div>

      <p class="text-xs font-bold mt-3">📝 CATATAN:</p>
      <p class="text-sm bg-slate-50 rounded-xl p-3 mt-1 font-medium text-slate-700">${x.catatan || '-'}</p>

      <p class="text-xs font-bold mt-3">📷 FOTO BUKTI (${(x.fotos || []).length}) - Tap untuk memperbesar:</p>
      <div class="grid grid-cols-2 gap-2 mt-1">${fotosHtml || '<p class="text-xs text-slate-400">Tidak ada foto.</p>'}</div>

      <button onclick="shareLaporanWA()" class="w-full bg-[#25D366] text-slate-900 py-3.5 rounded-xl font-extrabold text-sm mt-4 shadow">📲 SHARE KE WHATSAPP</button>
      <button onclick="copyLaporan()" class="w-full bg-white border py-3 rounded-xl font-bold text-sm mt-2">📋 Copy Teks Laporan</button>
      ${canDelete ? `<button onclick="hapusLaporanDariDetail(${x.id})" class="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm mt-2 border border-red-200">🗑️ Hapus Laporan Ini</button>` : ''}
    `;

    document.getElementById('modalDetail').classList.remove('hidden');
  } catch (err) {
    showToast('Gagal memuat detail laporan: ' + err.message, 'err');
  }
}

async function hapusLaporanDariDetail(id) {
  const ya = await showConfirm('Hapus Laporan?', 'Laporan ini akan dihapus permanen dari server.', '🗑️');
  if (!ya) return;

  try {
    await API.laporan.delete(id);
    tutupModal('modalDetail');
    showToast('Laporan berhasil dihapus.', 'ok');
    renderLaporan();
    renderRiwayat();
  } catch (err) {
    showToast('Gagal menghapus laporan: ' + err.message, 'err');
  }
}

async function renderRiwayat() {
  const user = API.getUser();
  if (!user) return;

  const box = document.getElementById('listRiwayat');
  const countEl = document.getElementById('riwayatCount');
  if (!box) return;

  box.innerHTML = '<div class="text-center py-6 text-slate-400">Memuat riwayat... ⏳</div>';

  try {
    const res = await API.laporan.getAll({ user_id: user.id, search: filterRiwayat, limit: 100 });
    const list = res.data || [];

    if (countEl) countEl.textContent = `${list.length} laporan`;

    if (!list.length) {
      box.innerHTML = `
        <div class="bg-white rounded-2xl border p-6 text-center text-slate-400 text-sm">
          Belum ada riwayat laporan untuk ${user.nama_lengkap}.<br>
          Silakan kirim laporan patroli pertamamu! 🛡️
        </div>
      `;
      return;
    }

    box.innerHTML = list.map(cardLaporan).join('');
  } catch (err) {
    box.innerHTML = `<div class="bg-red-50 text-red-600 rounded-2xl p-4 text-center text-sm font-bold">Gagal memuat riwayat: ${err.message}</div>`;
  }
}

function setFilterLaporan(f, btn) {
  filterLaporan = f;
  document.querySelectorAll('#page-laporan .chip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderLaporan();
}

function filterLaporanText(val) {
  cariLaporan = val.trim();
  renderLaporan();
}

function filterRiwayatText(val) {
  filterRiwayat = val.trim();
  renderRiwayat();
}

function exportCSV() {
  const filterBulan = document.getElementById('filterBulan');
  const params = {};
  if (filterBulan && filterBulan.value) {
    const [th, bl] = filterBulan.value.split('-');
    params.tanggal_mulai = `${th}-${bl}-01`;
    params.tanggal_selesai = `${th}-${bl}-31`;
  }
  if (filterLaporan !== 'semua') params.koridor = filterLaporan;

  const url = API.laporan.getCSVUrl(params);
  window.open(url, '_blank');
  showToast('Download CSV dimulai... 📥', 'ok');
}

window.kirimLaporan = kirimLaporan;
window.copyLaporan = copyLaporan;
window.shareLaporanWA = shareLaporanWA;
window.tutupSuksesKeHome = tutupSuksesKeHome;
window.renderLaporan = renderLaporan;
window.renderRiwayat = renderRiwayat;
window.lihatDetail = lihatDetail;
window.setFilterLaporan = setFilterLaporan;
window.filterLaporanText = filterLaporanText;
window.filterRiwayatText = filterRiwayatText;
window.exportCSV = exportCSV;
window.hapusLaporanDariDetail = hapusLaporanDariDetail;
