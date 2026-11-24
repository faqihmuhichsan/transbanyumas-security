/**
 * Camera & Photo Capture Module
 * Trans Banyumas Security Patrol
 */

let fotoList = []; // stores uploaded file paths or compressed dataUrls
let fotoBlobs = []; // stores compressed blobs to upload to server
let stream = null;
let facing = 'environment';
let lightboxList = [];
let lightboxIdx = 0;
let lightboxJudul = '';

function hentikanKamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  const el = document.getElementById('kameraAktif');
  if (el) el.classList.add('hidden');
}

async function bukaKamera() {
  try {
    hentikanKamera();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: false,
    });
    const video = document.getElementById('video');
    video.srcObject = stream;
    document.getElementById('kameraAktif').classList.remove('hidden');
    document.getElementById('kameraPlaceholder').classList.add('hidden');
    document.getElementById('hasilBox').classList.add('hidden');
  } catch (e) {
    showToast('Kamera tidak bisa dibuka. Silakan pakai pilihan Galeri.', 'err');
  }
}

function gantiKamera() {
  facing = facing === 'environment' ? 'user' : 'environment';
  bukaKamera();
}

function kompresFoto(dataURL, cb) {
  const img = new Image();
  img.onload = () => {
    const max = 1000;
    let w = img.width;
    let h = img.height;
    if (w > max) {
      h = Math.round((h * max) / w);
      w = max;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    c.toBlob((blob) => {
      const compressedUrl = c.toDataURL('image/jpeg', 0.7);
      cb(compressedUrl, blob);
    }, 'image/jpeg', 0.7);
  };
  img.src = dataURL;
}

function jepret() {
  const v = document.getElementById('video');
  const c = document.getElementById('canvas');
  c.width = v.videoWidth || 640;
  c.height = v.videoHeight || 480;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);

  const rawUrl = c.toDataURL('image/jpeg', 0.85);
  kompresFoto(rawUrl, (kecil, blob) => {
    document.getElementById('hasilFoto').src = kecil;
    document.getElementById('hasilFoto').dataset.blob = kecil;
    window._lastCapturedBlob = blob;
    document.getElementById('hasilBox').classList.remove('hidden');
    document.getElementById('kameraAktif').classList.add('hidden');
    hentikanKamera();
  });
}

function pakaiFoto() {
  const src = document.getElementById('hasilFoto').src;
  if (src && window._lastCapturedBlob) {
    tambahFoto(src, window._lastCapturedBlob);
  }
  document.getElementById('hasilBox').classList.add('hidden');
  document.getElementById('kameraPlaceholder').classList.add('hidden');
}

function ulangiFoto() {
  document.getElementById('hasilBox').classList.add('hidden');
  bukaKamera();
}

function previewGaleri(e) {
  const files = e.target.files;
  if (!files || !files.length) return;

  Array.from(files).forEach((f) => {
    const r = new FileReader();
    r.onload = (ev) => {
      kompresFoto(ev.target.result, (kecil, blob) => {
        tambahFoto(kecil, blob);
      });
    };
    r.readAsDataURL(f);
  });
  e.target.value = '';
}

function tambahFoto(dataUrl, blob) {
  if (fotoList.length >= 6) {
    showToast('Maksimal 6 foto per laporan.', 'warn');
    return;
  }
  fotoList.push(dataUrl);
  fotoBlobs.push(blob);
  renderGaleri();
}

function renderGaleri() {
  const g = document.getElementById('galeriFoto');
  if (!g) return;
  g.innerHTML = '';

  fotoList.forEach((src, i) => {
    const d = document.createElement('div');
    d.className = 'relative';
    d.innerHTML = `
      <img onclick="bukaLightboxFoto(${i}, 'form')" src="${src}" loading="lazy" class="w-full h-[80px] object-cover rounded-xl border cursor-pointer hover:opacity-90">
      <button onclick="hapusFoto(${i})" class="absolute -top-1 -right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] font-bold shadow">×</button>
    `;
    g.appendChild(d);
  });

  const infoFoto = document.getElementById('infoFoto');
  const statusKamera = document.getElementById('statusKamera');
  if (infoFoto) infoFoto.textContent = `${fotoList.length} foto`;
  if (statusKamera) statusKamera.textContent = fotoList.length ? `${fotoList.length} foto siap dikirim.` : 'Belum ada foto.';

  const placeholder = document.getElementById('kameraPlaceholder');
  if (placeholder) {
    placeholder.classList.toggle('hidden', fotoList.length > 0);
  }
}

function hapusFoto(i) {
  fotoList.splice(i, 1);
  fotoBlobs.splice(i, 1);
  renderGaleri();
}

function bukaLightboxFoto(idx, sumber) {
  if (sumber === 'form') {
    lightboxList = fotoList.slice();
    lightboxJudul = 'Bukti Foto - Form';
  } else if (window.laporanTerakhir && window.laporanTerakhir.fotos) {
    lightboxList = window.laporanTerakhir.fotos.map(f => f.file_path);
    lightboxJudul = window.laporanTerakhir.titik;
  } else return;

  lightboxIdx = idx;
  tampilFoto();
  document.getElementById('lightbox').classList.remove('hidden');
}

function tampilFoto() {
  if (!lightboxList.length) return;
  document.getElementById('lightboxImg').src = lightboxList[lightboxIdx];
  document.getElementById('lightboxCounter').textContent = `${lightboxIdx + 1} / ${lightboxList.length}`;
  document.getElementById('lightboxCaption').textContent = `${lightboxJudul} • Foto ${lightboxIdx + 1}`;
}

function nextFoto() {
  if (!lightboxList.length) return;
  lightboxIdx = (lightboxIdx + 1) % lightboxList.length;
  tampilFoto();
}

function prevFoto() {
  if (!lightboxList.length) return;
  lightboxIdx = (lightboxIdx - 1 + lightboxList.length) % lightboxList.length;
  tampilFoto();
}

function tutupLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

function downloadFotoAktif() {
  if (!lightboxList.length) return;
  const a = document.createElement('a');
  a.href = lightboxList[lightboxIdx];
  a.download = `bukti-foto-${lightboxIdx + 1}.jpg`;
  a.click();
  showToast('Foto berhasil di-download 📥', 'ok');
}

window.bukaKamera = bukaKamera;
window.hentikanKamera = hentikanKamera;
window.gantiKamera = gantiKamera;
window.jepret = jepret;
window.pakaiFoto = pakaiFoto;
window.ulangiFoto = ulangiFoto;
window.previewGaleri = previewGaleri;
window.hapusFoto = hapusFoto;
window.bukaLightboxFoto = bukaLightboxFoto;
window.nextFoto = nextFoto;
window.prevFoto = prevFoto;
window.tutupLightbox = tutupLightbox;
window.downloadFotoAktif = downloadFotoAktif;
window.getFotoBlobs = () => fotoBlobs;
window.resetFotoList = () => {
  fotoList = [];
  fotoBlobs = [];
  renderGaleri();
};
