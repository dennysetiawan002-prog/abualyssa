/***********************
 * KONFIGURASI
 ***********************/
const LINK_GRUP_WA =
  "https://chat.whatsapp.com/BubncxfjaeK8KK0y0jaGQB";

/***********************
 * ROLE & SALES
 ***********************/
const role = localStorage.getItem("role_sales");
const namaSales = localStorage.getItem("nama_sales");

/***********************
 * CONTACT PICKER
 ***********************/
async function pilihKontak() {
  if (!("contacts" in navigator)) {
    alert("Fitur kontak tidak didukung");
    return;
  }

  try {
    const c = await navigator.contacts.select(["tel"], { multiple: false });
    if (c.length && c[0].tel?.length) {
      document.getElementById("hp").value =
        c[0].tel[0].replace(/\s|-/g, "");
    }
  } catch {}
}

/***********************
 * GPS
 ***********************/
function ambilLokasi() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      () => {
        alert("Gagal mengambil lokasi");
        reject();
      },
      { enableHighAccuracy: true }
    );
  });
}

/***********************
 * SIMPAN PELANGGAN
 ***********************/
async function simpanPelanggan() {
  const nama = document.getElementById("nama").value.trim();
  const pemilik = document.getElementById("nama_pemilik").value.trim();
  const alamat = document.getElementById("alamat").value.trim();
  const hp = document.getElementById("hp").value.trim();

  if (!nama || !pemilik || !alamat || !hp) {
    alert("Semua data wajib diisi");
    return;
  }

  let lokasi;
  try {
    lokasi = await ambilLokasi();
  } catch {
    return;
  }

  const res = await apiPost({
    action: "addPelanggan",
    nama,
    nama_pemilik: pemilik,
    alamat,
    hp,
    lat: lokasi.lat,
    lng: lokasi.lng,
    nama_sales: namaSales
  });

  if (res.status !== "ok") {
    alert("Gagal simpan pelanggan");
    return;
  }

  clearCache("cache_pelanggan");
  loadPelanggan();

  const pesan = `
📍 Alamat pelanggan baru

Nama Toko : ${nama}
Pemilik   : ${pemilik}
Lokasi    : https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}
`;

  window.open(LINK_GRUP_WA, "_blank");
  setTimeout(() => {
    window.open(
      "https://wa.me/?text=" + encodeURIComponent(pesan),
      "_blank"
    );
  }, 800);

  document.querySelectorAll("input").forEach(i => i.value = "");
}

/***********************
 * LOAD PELANGGAN (CACHE SELAMANYA)
 ***********************/
async function loadPelanggan() {
  const cached = getCache("cache_pelanggan");
  if (cached) {
    renderPelanggan(cached);
    return;
  }

  const fresh = await apiGet("getPelanggan");
  setCache("cache_pelanggan", fresh);
  renderPelanggan(fresh);
}

/***********************
 * UPDATE MANUAL
 ***********************/
async function updatePelanggan() {
  clearCache("cache_pelanggan");
  const fresh = await apiGet("getPelanggan");
  setCache("cache_pelanggan", fresh);
  renderPelanggan(fresh);
  alert("Data diperbarui");
}

/***********************
 * MAPS
 ***********************/
function bukaMaps(lat, lng) {
  window.open(
    "https://www.google.com/maps?q=" + lat + "," + lng,
    "_blank"
  );
}

/***********************
 * RENDER + FILTER SALES
 ***********************/
function renderPelanggan(data) {
  const ul = document.getElementById("listPelanggan");
  ul.innerHTML = "";

  data.slice(1).forEach(r => {
    const salesData = r[8];

    // ADMIN LIHAT SEMUA, SALES HANYA MILIKNYA
    if (role !== "admin" && salesData !== namaSales) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${r[1]}</strong><br>
      <small>Pemilik: ${r[2]}</small><br>
      <small>${r[3]}</small><br>
      <small>${r[4]}</small><br>
      <button class="small" onclick="bukaMaps('${r[5]}','${r[6]}')">
        📍 Maps
      </button>
    `;
    ul.appendChild(li);
  });

  if (!ul.children.length) {
    ul.innerHTML = "<li>Tidak ada pelanggan</li>";
  }
}

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", loadPelanggan);
