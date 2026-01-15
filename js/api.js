// GANTI dengan URL /exec dari Apps Script Anda
const API_URL = "https://script.google.com/macros/s/AKfycbzc7fFnO1J8wiitO1TGC_ubC5qy3p-ryJOJgtE_Vf-uxlKQ2Zr6S52C_oijqY6kJJMV/exec";

async function apiGet(action) {
  const res = await fetch(API_URL + "?action=" + action);
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}

function testAddPelanggan() {
  addPelanggan({
    nama: "TEST USER",
    alamat: "TEST ALAMAT",
    hp: "08123456789"
  });
}
async function updateSemuaData() {
  if (!confirm("Update semua data dari server?")) return;

  // 1️⃣ Hapus cache
  clearCache("cache_produk");
  clearCache("cache_pelanggan");
  clearCache("cache_pesanan");

  // 2️⃣ Ambil data terbaru
  const [produk, pelanggan, pesanan] = await Promise.all([
    apiGet("getProduk"),
    apiGet("getPelanggan"),
    apiGet("getPesanan")
  ]);

  // 3️⃣ Simpan ke cache
  setCache("cache_produk", produk);
  setCache("cache_pelanggan", pelanggan);
  setCache("cache_pesanan", pesanan);

  alert("Semua data berhasil diperbarui");

  // 4️⃣ Optional reload halaman
  location.reload();
}

// ===== CACHE HELPER (TANPA TTL) =====
function setCache(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getCache(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function clearCache(key) {
  localStorage.removeItem(key);
}

