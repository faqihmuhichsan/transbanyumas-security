/**
 * Main Application Logic (Security Dashboard SPA)
 * Trans Banyumas Security Patrol System
 */

const ITEMS_DEFAULT = {
  'Koridor I': ['Start Poin Koridor', 'Pompa Air', 'Pos Jaga', 'Gerbang / Pintu', 'Parkiran', 'Lampu', 'Pagar / Tembok', 'CCTV', 'Kebersihan', 'Lainnya'],
  'Koridor II': ['Start Poin Koridor', 'Pompa Air', 'Pos Jaga', 'Gerbang / Pintu', 'Parkiran', 'Lampu', 'Pagar / Tembok', 'CCTV', 'Kebersihan', 'Lainnya'],
  'Koridor III A': ['Start Poin Koridor', 'Pompa Air', 'Pos Jaga', 'Gerbang / Pintu', 'Parkiran', 'Lampu', 'Pagar / Tembok', 'CCTV', 'Kebersihan', 'Lainnya'],
  'Koridor III B': ['Start Poin Koridor', 'Pompa Air', 'Pos Jaga', 'Gerbang / Pintu', 'Parkiran', 'Lampu', 'Pagar / Tembok', 'CCTV', 'Kebersihan', 'Lainnya'],
  'Koridor IV': ['Start Poin Koridor', 'Pompa Air', 'Pos Jaga', 'Gerbang / Pintu', 'Parkiran', 'Lampu', 'Pagar / Tembok', 'CCTV', 'Kebersihan', 'Lainnya'],
  'Kantor Pusat': ['Ruang Kantor / Office', 'Ruang Meeting', 'Pompa Air', 'Ruang Lainnya', 'Pos Jaga', 'Gerbang', 'Parkir', 'Listrik / Lampu', 'CCTV', 'Kebersihan', 'Lainnya'],
};

const WARNA_KORIDOR = {
  'Koridor I': 'bg-blue-600',
  'Koridor II': 'bg-teal-500',
  'Koridor III A': 'bg-red-600',
  'Koridor III B': 'bg-purple-600',
  'Koridor IV': 'bg-yellow-400 text-slate-900',
  'Kantor Pusat': 'bg-slate-900',
};

let shift = 'Pagi';
let koridorAktif = 'Koridor I';
let statusLaporan = 'aman';
let kondisi = 'Baik';
let prioritas = 'Sedang';
let selectedItems = new Set();
let filterShiftHome = 'semua';

let SHIFT_JAM = {
  Pagi: { mulai: '07:00', selesai: '19:00' },
  Malam: { mulai: '19:00', selesai: '07:00' },
};

try {
  const s = JSON.parse(localStorage.getItem('tb_shiftJam') || 'null');
  if (s && s.Pagi && s.Malam) SHIFT_JAM = s;
} catch (e) {}

function simpanShiftJam() {
  localStorage.setItem('tb_shiftJam', JSON.stringify(SHIFT_JAM));
}

function jamShiftText(s) {
  const j = SHIFT_JAM[s] || SHIFT_JAM.Pagi;
  return `${j.mulai} - ${j.selesai}`;
}

function getDefaultCek() {
  if (koridorAktif === 'Kantor Pusat') return ['Ruang Kantor / Office', 'Ruang Meeting', 'Pompa Air'];
  return ['Start Poin Koridor', 'Pompa Air'];
}

function updateShiftUI() {
  const topShift = document.getElementById('topShift');
  const topShiftJam = document.getElementById('topShiftJam');
  const homeShiftInfo = document.getElementById('homeShiftInfo');
  const infoShift = document.getElementById('infoShift');
  const infoJamShift = document.getElementById('infoJamShift');
  const editShiftNama = document.getElementById('editShiftNama');
  const shiftMulai = document.getElementById('shiftMulai');
  const shiftSelesai = document.getElementById('shiftSelesai');

  if (topShift) topShift.textContent = shift;
  if (topShiftJam) topShiftJam.textContent = jamShiftText(shift);
  if (homeShiftInfo) homeShiftInfo.textContent = `Shift ${shift} • ${jamShiftText(shift)}`;
  if (infoShift) infoShift.textContent = shift;
  if (infoJamShift) infoJamShift.textContent = jamShiftText(shift);
  if (editShiftNama) editShiftNama.textContent = shift.toUpperCase();
  if (shiftMulai) shiftMulai.value = SHIFT_JAM[shift].mulai;
  if (shiftSelesai) shiftSelesai.value = SHIFT_JAM[shift].selesai;
}

function pilihShift(s, btn) {
  shift = s;
  document.querySelectorAll('.shiftBtn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  updateShiftUI();
}

function simpanShiftEdit() {
  const m = document.getElementById('shiftMulai').value || '07:00';
  const sl = document.getElementById('shiftSelesai').value || '19:00';
  SHIFT_JAM[shift] = { mulai: m, selesai: sl };
  simpanShiftJam();
  updateShiftUI();
  showToast(`Jam Shift ${shift} disimpan: ${m} - ${sl}`, 'ok');
}

function resetShift() {
  SHIFT_JAM.Pagi = { mulai: '07:00', selesai: '19:00' };
  SHIFT_JAM.Malam = { mulai: '19:00', selesai: '07:00' };
  simpanShiftJam();
  updateShiftUI();
  showToast('Jam direset ke default (07-19 / 19-07)', 'ok');
}

function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + p);
  if (target) target.classList.add('active');

  document.querySelectorAll('.navBtn').forEach(b => {
    const on = b.dataset.nav === p;
    b.classList.toggle('text-blue-600', on);
    b.classList.toggle('bg-blue-50', on);
    b.classList.toggle('text-slate-500', !on);
  });

  window.scrollTo(0, 0);

  if (p === 'home') renderHome();
  if (p === 'form') renderForm();
  if (p === 'laporan') renderLaporan();
  if (p === 'riwayat') renderRiwayat();
  if (p === 'rekap') renderRekap();
}

function bukaMenu(p) {
  showPage(p);
}

function pilihKoridor(k) {
  koridorAktif = k;
  const korText = document.getElementById('koridorLockText');
  const infoKor = document.getElementById('infoKoridor');
  const topKor = document.getElementById('topKoridor');
  const box = document.getElementById('koridorLockBox');

  if (korText) korText.textContent = koridorAktif;
  if (infoKor) infoKor.textContent = koridorAktif;
  if (topKor) topKor.textContent = koridorAktif;
  if (box) {
    box.className = `rounded-[20px] p-4 mt-1 text-white flex items-center gap-3 ${WARNA_KORIDOR[koridorAktif] || 'bg-blue-600'}`;
  }

  selectedItems = new Set(getDefaultCek());
  window.selectedItems = selectedItems;
  window.gpsData = null;
  renderCekItems();
  showPage('form');
}

function renderForm() {
  const user = API.getUser();
  const infoPetugas = document.getElementById('infoPetugas');
  const infoKoridor = document.getElementById('infoKoridor');
  const infoWaktu = document.getElementById('infoWaktu');

  if (infoPetugas) infoPetugas.textContent = user ? user.nama_lengkap : '-';
  if (infoKoridor) infoKoridor.textContent = koridorAktif;
  if (infoWaktu) infoWaktu.textContent = `${tanggalIndo()} • ${formatWaktu()}`;

  updateShiftUI();
  renderCekItems();
  window.updateGPSBox();
}

function renderCekItems() {
  const box = document.getElementById('listCekItem');
  if (!box) return;

  const list = ITEMS_DEFAULT[koridorAktif] || ITEMS_DEFAULT['Koridor I'];
  box.innerHTML = '';

  list.forEach(it => {
    const wrap = document.createElement('div');
    const isChecked = selectedItems.has(it);
    wrap.className = `cekItem border-2 rounded-xl py-2.5 px-3 text-xs font-bold text-left cursor-pointer transition select-none ${isChecked ? 'on bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-700'}`;
    wrap.innerHTML = `<span>${isChecked ? '✅ ' : '⚪ '}${it}</span>`;
    wrap.onclick = () => {
      if (selectedItems.has(it)) selectedItems.delete(it);
      else selectedItems.add(it);
      renderCekItems();
    };
    box.appendChild(wrap);
  });
}

function tambahItemManual() {
  const inp = document.getElementById('inItemBaru');
  const val = inp ? inp.value.trim() : '';
  if (!val) {
    showToast('Ketik item cek baru terlebih dahulu!', 'warn');
    return;
  }
  selectedItems.add(val);
  if (!ITEMS_DEFAULT[koridorAktif].includes(val)) {
    ITEMS_DEFAULT[koridorAktif].push(val);
  }
  inp.value = '';
  renderCekItems();
  showToast(`Item "${val}" ditambahkan & diceklis ✅`, 'ok');
}

function isiTitik(v) {
  const inTitik = document.getElementById('inTitik');
  if (inTitik) inTitik.value = v;
  window.gpsData = null;
  window.updateGPSBox();
}

function isiCatatan(v) {
  const inCat = document.getElementById('inCatatan');
  if (inCat) inCat.value = v;
}

function setStatus(s) {
  statusLaporan = s;
  window.statusLaporan = s;
  const btnAman = document.getElementById('btnAman');
  const btnTemuan = document.getElementById('btnTemuan');
  if (btnAman) {
    btnAman.className = `py-3.5 rounded-2xl font-extrabold border-2 ${s === 'aman' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500 border-slate-200'}`;
  }
  if (btnTemuan) {
    btnTemuan.className = `py-3.5 rounded-2xl font-extrabold border-2 ${s === 'temuan' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200'}`;
  }
}

function setKondisi(k) {
  kondisi = k;
  window.kondisi = k;
  const kondBaik = document.getElementById('kondBaik');
  const kondRusak = document.getElementById('kondRusak');
  if (kondBaik) {
    kondBaik.className = `py-2.5 rounded-xl text-xs font-bold border-2 ${k === 'Baik' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500 border-slate-200'}`;
  }
  if (kondRusak) {
    kondRusak.className = `py-2.5 rounded-xl text-xs font-bold border-2 ${k === 'Rusak' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200'}`;
  }
}

function setPrioritas(p, btn) {
  prioritas = p;
  window.prioritas = p;
  document.querySelectorAll('.priBtn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
}

function setFilterShiftHome(s, btn) {
  filterShiftHome = s;
  document.querySelectorAll('.chipShift').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderHome();
}

async function renderHome() {
  const user = API.getUser();
  if (user) {
    const namaEl = document.getElementById('namaPetugas');
    if (namaEl) namaEl.textContent = user.nama_lengkap;
  }

  document.getElementById('tanggalHome').textContent = tanggalIndo();
  updateShiftUI();

  try {
    const res = await API.laporan.getStatsToday();
    const stats = res.data;

    let total = stats.total_hari_ini || 0;
    let aman = stats.aman || 0;
    let temuan = stats.temuan || 0;

    document.getElementById('statHariIni').textContent = total;
    document.getElementById('statAman').textContent = aman;
    document.getElementById('statTemuan').textContent = temuan;

    document.getElementById('progressText').textContent = `${total} laporan patroli hari ini`;
    document.getElementById('progressSub').textContent = total
      ? (temuan ? `⚠️ Ada ${temuan} temuan! Harap cek segera.` : '🎉 Semua area aman terkendali.')
      : 'Belum ada pengecekan hari ini. Silakan mulai patroli.';
  } catch (err) {
    console.error('Gagal memuat stats:', err);
  }
}

async function handleLogout() {
  const ya = await showConfirm('Keluar?', 'Apakah kamu yakin ingin keluar dari akun ini?', '👋');
  if (ya) {
    Auth.logout();
  }
}

// Global scope bindings
window.ITEMS_DEFAULT = ITEMS_DEFAULT;
window.WARNA_KORIDOR = WARNA_KORIDOR;
window.shift = shift;
window.koridorAktif = koridorAktif;
window.statusLaporan = statusLaporan;
window.kondisi = kondisi;
window.prioritas = prioritas;
window.selectedItems = selectedItems;
window.jamShiftText = jamShiftText;
window.getDefaultCek = getDefaultCek;
window.pilihShift = pilihShift;
window.simpanShiftEdit = simpanShiftEdit;
window.resetShift = resetShift;
window.showPage = showPage;
window.bukaMenu = bukaMenu;
window.pilihKoridor = pilihKoridor;
window.renderCekItems = renderCekItems;
window.tambahItemManual = tambahItemManual;
window.isiTitik = isiTitik;
window.isiCatatan = isiCatatan;
window.setStatus = setStatus;
window.setKondisi = setKondisi;
window.setPrioritas = setPrioritas;
window.setFilterShiftHome = setFilterShiftHome;
window.renderHome = renderHome;
window.handleLogout = handleLogout;

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.checkAuth(['security', 'admin', 'super_admin']);
  if (!user) return;

  const n = new Date();
  const ym = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  const fBulan = document.getElementById('filterBulan');
  const fRekap = document.getElementById('filterBulanRekap');
  if (fBulan) fBulan.value = ym;
  if (fRekap) fRekap.value = ym;

  if (user.koridor_default) {
    koridorAktif = user.koridor_default;
  }

  pilihKoridor(koridorAktif);
  showPage('home');
});
