/**
 * Rekap & Summary Module
 * Trans Banyumas Security Patrol
 */

let filterRekap = 'semua';
let cacheRekapData = [];

async function renderRekap() {
  const box = document.getElementById('listRekap');
  if (!box) return;

  const filterBulanRekap = document.getElementById('filterBulanRekap');
  const [tahun, bulan] = (filterBulanRekap ? filterBulanRekap.value : '').split('-');

  box.innerHTML = '<div class="text-center py-6 text-slate-400">Memuat rekap bulanan... ⏳</div>';

  try {
    const params = {
      limit: 200,
    };
    if (tahun && bulan) {
      params.tanggal_mulai = `${tahun}-${bulan}-01`;
      params.tanggal_selesai = `${tahun}-${bulan}-31`;
    }
    if (filterRekap !== 'semua') {
      params.koridor = filterRekap;
    }

    const res = await API.laporan.getAll(params);
    cacheRekapData = res.data || [];

    const total = cacheRekapData.length;
    const aman = cacheRekapData.filter(x => x.status === 'aman').length;
    const temuan = cacheRekapData.filter(x => x.status === 'temuan').length;

    document.getElementById('rekapBulanTotal').textContent = total;
    document.getElementById('rekapBulanAman').textContent = aman;
    document.getElementById('rekapBulanTemuan').textContent = temuan;

    if (!cacheRekapData.length) {
      box.innerHTML = '<div class="bg-white rounded-2xl border p-6 text-center text-slate-400 text-sm">Belum ada laporan pada periode filter ini.</div>';
      return;
    }

    box.innerHTML = cacheRekapData.map(cardLaporan).join('');
  } catch (err) {
    box.innerHTML = `<div class="bg-red-50 text-red-600 rounded-2xl p-4 text-center text-sm font-bold">Gagal memuat rekap: ${err.message}</div>`;
  }
}

function setFilterRekap(f, btn) {
  filterRekap = f;
  document.querySelectorAll('#page-rekap .chip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderRekap();
}

function setBulanIniRekap() {
  const n = new Date();
  const ym = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  const el = document.getElementById('filterBulanRekap');
  if (el) el.value = ym;
  renderRekap();
}

function bukaShareRekap() {
  const el = document.getElementById('modalShare');
  if (el) el.classList.remove('hidden');
}

function shareRekapWA(shiftTarget) {
  const filterBulan = document.getElementById('filterBulanRekap');
  const blnText = filterBulan ? filterBulan.value : 'Bulan Ini';

  const dataShift = cacheRekapData.filter(x => x.shift === shiftTarget);
  const total = dataShift.length;
  const aman = dataShift.filter(x => x.status === 'aman').length;
  const temuan = dataShift.filter(x => x.status === 'temuan').length;

  const perKor = {};
  dataShift.forEach(x => {
    perKor[x.koridor] = (perKor[x.koridor] || 0) + 1;
  });

  let detailKoridor = '';
  Object.keys(perKor).forEach(k => {
    detailKoridor += `\n• ${k}: ${perKor[k]} laporan`;
  });

  let temuanTxt = '';
  dataShift.filter(x => x.status === 'temuan').slice(0, 5).forEach(x => {
    temuanTxt += `\n• [${x.koridor}] ${x.titik}: ${x.catatan}`;
  });

  const jamShift = window.jamShiftText ? window.jamShiftText(shiftTarget) : (shiftTarget === 'Pagi' ? '07:00 - 19:00' : '19:00 - 07:00');

  const txt = `🛡️ *SECURITY - TRANS BANYUMAS*
*REKAP PATROLI SHIFT ${shiftTarget.toUpperCase()}*
━━━━━━━━━━━━━━

📅 *Periode:* ${blnText}
🕐 *Shift:* ${shiftTarget} (${jamShift})

📊 *Total:* ${total}  |  ✅ *Aman:* ${aman}  |  ⚠️ *Temuan:* ${temuan}
${detailKoridor ? `\n📌 *Laporan per Area:*${detailKoridor}` : ''}
${temuanTxt ? `\n⚠️ *Daftar Temuan:*${temuanTxt}` : ''}

━━━━━━━━━━━━━━
_Aplikasi Patroli Security Trans Banyumas_`;

  tutupModal('modalShare');
  window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

window.renderRekap = renderRekap;
window.setFilterRekap = setFilterRekap;
window.setBulanIniRekap = setBulanIniRekap;
window.bukaShareRekap = bukaShareRekap;
window.shareRekapWA = shareRekapWA;
