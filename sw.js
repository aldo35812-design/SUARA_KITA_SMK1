// sw.js : simpan file ke cache supaya bisa dibuka offline.
// Setiap kali mengubah file, naikkan angka VERSI agar cache diperbarui.
const VERSI = "suarakita-v2";
const FILE = [
  "./", "index.html", "manifest.json",
  "css/style.css", "js/storage.js", "js/app.js",
  "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(FILE)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(nama =>
    Promise.all(nama.filter(n => n !== VERSI).map(n => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
