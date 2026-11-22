// storage.js : semua urusan localStorage ada di sini.
const KUNCI = "suarakita_laporan";

function ambilData() {
  try { return JSON.parse(localStorage.getItem(KUNCI)) || []; }
  catch (e) { return []; }
}
// Mengembalikan true jika berhasil, false jika penyimpanan penuh
function simpanData(data) {
  try { localStorage.setItem(KUNCI, JSON.stringify(data)); return true; }
  catch (e) { return false; }
}
function tambahLaporan(laporan) {
  const data = ambilData();
  laporan.id = Date.now();
  laporan.tanggal = new Date().toISOString();
  data.unshift(laporan);
  return simpanData(data);
}
function ubahLaporan(id, perubahan) {
  const data = ambilData();
  const l = data.find(x => x.id === id);
  if (l) Object.assign(l, perubahan);
  return simpanData(data);
}
function hapusLaporan(id) {
  return simpanData(ambilData().filter(x => x.id !== id));
}
// Suka / batal suka. "nama" = username siswa (huruf kecil)
function ubahSuka(id, nama) {
  const data = ambilData();
  const l = data.find(x => x.id === id);
  if (!l) return;
  l.suka = l.suka || [];
  const i = l.suka.indexOf(nama);
  if (i >= 0) l.suka.splice(i, 1); else l.suka.push(nama);
  simpanData(data);
}
