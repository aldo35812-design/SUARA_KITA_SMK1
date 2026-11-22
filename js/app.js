// app.js : login, navigasi, form, tampilan.
// PENTING: password di bawah ini bisa dibaca siapa saja yang membuka kode.
// Cukup untuk proyek sekolah/demo, bukan keamanan sungguhan.
const PASSWORD_SISWA = "@Siswa333";
const PASSWORD_GURU = "kenari30";

const STATUS_ASPIRASI = ["Baru", "Diproses", "Selesai", "Ditolak"];
const STATUS_LF = ["Aktif", "Sudah Kembali"];

let sesi = null;              // { peran: "siswa" | "guru", nama: "..." }
let peranDipilih = "siswa";   // pilihan di halaman login

const $ = (s) => document.querySelector(s);
const adalahGuru = () => sesi && sesi.peran === "guru";

// Mencegah teks pengguna dibaca sebagai kode HTML
function esc(t) {
  const d = document.createElement("div");
  d.textContent = t ?? "";
  return d.innerHTML;
}
function toast(pesan) {
  const t = $("#toast");
  t.textContent = pesan;
  t.classList.add("tampil");
  setTimeout(() => t.classList.remove("tampil"), 2400);
}
function tglIndo(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
// Hanya terima foto berformat data:image (aman untuk ditampilkan)
function fotoValid(f) {
  return typeof f === "string" && /^data:image\/[a-z]+;base64,[A-Za-z0-9+\/=]+$/.test(f);
}

// ---------- Login ----------
document.querySelectorAll("[data-peran]").forEach(b => b.addEventListener("click", () => {
  peranDipilih = b.dataset.peran;
  document.querySelectorAll("[data-peran]").forEach(x => x.classList.toggle("aktif", x === b));
  $("#baris-nama").hidden = peranDipilih === "guru";   // guru cukup password
  $("#pesan-login").textContent = "";
}));
$("#lihat-pass").addEventListener("change", (e) => {
  $("#login-pass").type = e.target.checked ? "text" : "password";
});
$("#form-login").addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = $("#login-pass").value;
  if (peranDipilih === "siswa") {
    const nama = $("#login-nama").value.trim();
    if (!nama) return ($("#pesan-login").textContent = "Isi username dulu.");
    if (pass !== PASSWORD_SISWA) return ($("#pesan-login").textContent = "Password salah.");
    sesi = { peran: "siswa", nama };
  } else {
    if (pass !== PASSWORD_GURU) return ($("#pesan-login").textContent = "Password salah.");
    sesi = { peran: "guru", nama: "Guru" };
  }
  sessionStorage.setItem("suarakita_sesi", JSON.stringify(sesi));
  $("#login-pass").value = "";
  mulai();
});
$("#btn-keluar").addEventListener("click", () => {
  sessionStorage.removeItem("suarakita_sesi");
  sesi = null;
  $("#aplikasi").hidden = true;
  $("#login").hidden = false;
});
function mulai() {
  $("#pesan-login").textContent = "";
  $("#login").hidden = true;
  $("#aplikasi").hidden = false;
  $("#info-user").textContent = adalahGuru() ? "Masuk sebagai guru" : "Masuk sebagai " + sesi.nama;
  $("#nav-guru").hidden = !adalahGuru();
  tampil("beranda");
}

// ---------- Navigasi ----------
function tampil(nama) {
  if (nama === "cadangan" && !adalahGuru()) return;
  document.querySelectorAll(".halaman").forEach(h => h.hidden = true);
  $("#h-" + nama).hidden = false;
  document.querySelectorAll(".bawah button").forEach(b =>
    b.classList.toggle("aktif", b.dataset.hal === nama));
  render();
  window.scrollTo(0, 0);
}

// ---------- Foto: kecilkan dulu agar localStorage tidak cepat penuh ----------
function kecilkanFoto(file, maks = 600) {
  return new Promise((ok, gagal) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const skala = Math.min(1, maks / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * skala);
      c.height = Math.round(img.height * skala);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = gagal;
    img.src = url;
  });
}
$("#foto").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const p = $("#preview-foto");
  if (!file) { p.hidden = true; return; }
  try { p.src = await kecilkanFoto(file); p.hidden = false; }
  catch (err) { p.hidden = true; toast("File itu bukan gambar."); e.target.value = ""; }
});

// ---------- Kartu laporan ----------
function buatKartu(l) {
  const guru = adalahGuru();
  const asp = l.jenis === "aspirasi";
  const opsi = asp ? STATUS_ASPIRASI : STATUS_LF;
  const label = asp ? l.kategori : (l.jenis === "hilang" ? "Hilang" : "Ditemukan");
  const pengirim = asp ? (l.anonim && !guru ? "Anonim" : (l.pengirim || "Siswa")) + (l.anonim && guru ? " (anonim)" : "") : "";

  let html = `<article class="kartu ${l.jenis}">
    <h3>${esc(l.judul)}</h3>
    <span class="lencana ${l.status.replace(" ", "-")}">${esc(l.status)}</span>
    <span class="meta"> ${esc(label)} | ${tglIndo(l.tanggal)}${pengirim ? " | " + esc(pengirim) : ""}</span>
    ${fotoValid(l.foto) ? `<img class="foto" src="${l.foto}" alt="Foto ${esc(l.judul)}">` : ""}
    <p>${esc(l.isi)}</p>
    ${l.lokasi ? `<p class="meta">Lokasi: ${esc(l.lokasi)}</p>` : ""}
    ${l.tanggapan ? `<p class="tanggapan"><b>Balasan guru:</b> ${esc(l.tanggapan)}</p>` : ""}`;

  if (asp) {
    const suka = l.suka || [];
    const sudah = sesi && suka.includes(sesi.nama.toLowerCase());
    html += guru
      ? `<p class="meta">${suka.length} siswa mendukung</p>`
      : `<button class="suka ${sudah ? "aktif" : ""}" data-aksi="suka" data-id="${l.id}">${sudah ? "Didukung" : "Dukung"} (${suka.length})</button>`;
  }
  if (l.kontak && l.status === "Aktif") {
    html += `<a href="https://wa.me/${encodeURIComponent(l.kontak)}" target="_blank" rel="noopener">Hubungi via WhatsApp</a>`;
  }
  if (guru) {   // kontrol khusus guru
    html += `<div class="filter">
      <select data-aksi="status" data-id="${l.id}">
        ${opsi.map(o => `<option ${o === l.status ? "selected" : ""}>${o}</option>`).join("")}
      </select>
      <button class="bahaya" data-aksi="hapus" data-id="${l.id}">Hapus</button></div>`;
    if (asp) {
      html += `<div class="filter">
        <input placeholder="Tulis balasan untuk siswa" value="${esc(l.tanggapan || "")}">
        <button data-aksi="balas" data-id="${l.id}">Balas</button></div>`;
    }
  }
  return html + "</article>";
}
function isiDaftar(el, daftar) {
  el.innerHTML = daftar.length
    ? daftar.map(buatKartu).join("")
    : `<p class="kosong">Belum ada laporan.</p>`;
}

// ---------- Render ----------
function render() {
  if (!sesi) return;
  const data = ambilData();

  const asp = data.filter(l => l.jenis === "aspirasi").length;
  const hilang = data.filter(l => l.jenis === "hilang" && l.status === "Aktif").length;
  const temu = data.filter(l => l.jenis === "ditemukan" && l.status === "Aktif").length;
  $("#statistik").innerHTML =
    `<div><b>${asp}</b><span>Aspirasi</span></div>
     <div><b>${hilang}</b><span>Barang hilang</span></div>
     <div><b>${temu}</b><span>Barang ditemukan</span></div>`;
  isiDaftar($("#daftar-terbaru"), data.slice(0, 3));

  // Aspirasi: urut dari suka terbanyak, kalau sama yang terbaru dulu
  const kataA = $("#cari-aspirasi").value.toLowerCase();
  const statA = $("#status-aspirasi").value;
  const daftarA = data
    .filter(l => l.jenis === "aspirasi" &&
      (l.judul + l.isi).toLowerCase().includes(kataA) &&
      (!statA || l.status === statA))
    .sort((a, b) => (b.suka || []).length - (a.suka || []).length || b.id - a.id);
  isiDaftar($("#daftar-aspirasi"), daftarA);

  const kataL = $("#cari-lf").value.toLowerCase();
  const jenisL = $("#jenis-lf").value;
  isiDaftar($("#daftar-lf"), data.filter(l =>
    l.jenis !== "aspirasi" &&
    (l.judul + l.isi).toLowerCase().includes(kataL) &&
    (!jenisL || l.jenis === jenisL)));
}
["#cari-aspirasi", "#status-aspirasi", "#cari-lf", "#jenis-lf"].forEach(s =>
  $(s).addEventListener("input", render));

// ---------- Form ----------
$("#form-aspirasi").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const ok = tambahLaporan({
    jenis: "aspirasi", status: "Baru", suka: [],
    kategori: f.get("kategori"), judul: f.get("judul").trim(),
    isi: f.get("isi").trim(), lokasi: f.get("lokasi").trim(),
    anonim: f.get("anonim") === "on", pengirim: sesi.nama
  });
  if (!ok) return toast("Penyimpanan penuh.");
  e.target.reset();
  toast("Aspirasi terkirim");
  render();
});
$("#form-lf").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  let foto = "";
  const file = $("#foto").files[0];
  if (file) {
    try { foto = await kecilkanFoto(file); }
    catch (err) { return toast("Foto tidak bisa dibaca."); }
  }
  const ok = tambahLaporan({
    jenis: f.get("jenis"), status: "Aktif",
    judul: f.get("judul").trim(), isi: f.get("isi").trim(),
    lokasi: f.get("lokasi").trim(), kontak: f.get("kontak").trim(),
    pengirim: sesi.nama, foto
  });
  if (!ok) return toast("Penyimpanan penuh. Hapus laporan lama atau kirim tanpa foto.");
  e.target.reset();
  $("#preview-foto").hidden = true;
  toast("Laporan terkirim");
  render();
});

// ---------- Aksi di kartu (suka, status, balas, hapus) ----------
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.hal) return tampil(t.dataset.hal);
  const id = Number(t.dataset.id);
  switch (t.dataset.aksi) {
    case "suka":
      ubahSuka(id, sesi.nama.toLowerCase()); render(); break;
    case "hapus":
      if (adalahGuru() && confirm("Hapus laporan ini?")) { hapusLaporan(id); render(); }
      break;
    case "balas": {
      if (!adalahGuru()) break;
      const teks = t.previousElementSibling.value.trim();
      const data = ambilData().find(x => x.id === id);
      const perubahan = { tanggapan: teks };
      if (data && data.status === "Baru" && teks) perubahan.status = "Diproses";
      ubahLaporan(id, perubahan);
      toast("Balasan tersimpan"); render(); break;
    }
  }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.aksi === "status" && adalahGuru()) {
    ubahLaporan(Number(e.target.dataset.id), { status: e.target.value });
    toast("Status diperbarui"); render();
  }
});

// ---------- Cadangan data (guru) ----------
$("#btn-ekspor").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(ambilData(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cadangan-suarakita.json";
  a.click();
});
$("#file-impor").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const baca = new FileReader();
  baca.onload = () => {
    try {
      const data = JSON.parse(baca.result);
      if (!Array.isArray(data)) throw new Error();
      if (!simpanData(data)) return toast("Penyimpanan penuh.");
      toast("Data dipulihkan"); render();
    } catch (err) { toast("File tidak valid"); }
  };
  baca.readAsText(file);
});

// ---------- PWA & mulai ----------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

try { sesi = JSON.parse(sessionStorage.getItem("suarakita_sesi")); } catch (e) { sesi = null; }
if (sesi) mulai(); else $("#login").hidden = false;
