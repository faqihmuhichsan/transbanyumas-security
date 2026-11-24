/**
 * UI Utilities
 * Toast alerts, confirmation modals, formatters, and spinners
 */

let confirmResolve = null;

function showToast(msg, type = 'info', dur = 3000) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    document.body.appendChild(wrap);
  }

  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icon = type === 'ok' ? '✅' : type === 'err' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
  el.innerHTML = `
    <span>${icon}</span>
    <span style="flex:1">${msg}</span>
    <button onclick="this.parentElement.remove()" style="opacity:.7;font-weight:bold;cursor:pointer">✕</button>
  `;
  wrap.appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, dur);
}

function showConfirm(title, msg, icon = '❓') {
  return new Promise(res => {
    confirmResolve = res;
    const modal = document.getElementById('confirmModal');
    if (!modal) {
      res(false);
      return;
    }
    const ic = document.getElementById('confirmIcon');
    const tt = document.getElementById('confirmTitle');
    const ms = document.getElementById('confirmMsg');
    if (ic) ic.textContent = icon;
    if (tt) tt.textContent = title;
    if (ms) ms.textContent = msg;
    modal.classList.add('show');
  });
}

function tutupConfirm(ya) {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('show');
  if (confirmResolve) {
    confirmResolve(ya);
    confirmResolve = null;
  }
}

function tutupModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function bukaModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function tanggalIndo(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatWaktu(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
}

function showLoading(btn, text = 'Memproses...') {
  if (!btn) return;
  btn.dataset.originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="inline-block animate-spin mr-2">⏳</span> ${text}`;
}

function hideLoading(btn) {
  if (!btn || !btn.dataset.originalText) return;
  btn.innerHTML = btn.dataset.originalText;
  btn.disabled = false;
}

window.showToast = showToast;
window.showConfirm = showConfirm;
window.tutupConfirm = tutupConfirm;
window.tutupModal = tutupModal;
window.bukaModal = bukaModal;
window.tanggalIndo = tanggalIndo;
window.formatWaktu = formatWaktu;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
