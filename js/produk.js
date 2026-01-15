/***********************
 * STATE GLOBAL
 ***********************/
let DATA_PRODUK = [];

/***********************
 * HELPER
 ***********************/
function formatRupiah(angka) {
  return Number(angka || 0).toLocaleString("id-ID");
}

/***********************
 * ROLE CHECK
 ***********************/
const role = localStorage.getItem("role_sales");

document.addEventListener("DOMContentLoaded", () => {
  if (role === "admin") {
    const form = document.getElementById("formProduk");
    if (form) form.style.display = "block";
  } else {
    const info = document.getElementById("info");
    if (info) {
      info.innerText =
        "Akses terbatas. Hanya admin yang dapat menambah atau mengubah produk.";
    }
  }

  loadProduk();
});

/***********************
 * SIMPAN PRODUK (ADMIN)
 ***********************/
async function simpanProduk() {
  if (role !== "admin") {
    alert("Akses ditolak");
    return;
  }

  const nama_produk = document
    .getElementById("nama_produk")
    .value.toUpperCase()
    .trim();

  const supplierRaw = document.getElementById("supplier").value.trim();
  const supplier =
    supplierRaw.charAt(0).toUpperCase() + supplierRaw.slice(1).toLowerCase();

  const satuan = document.getElementById("satuan").value;
  const jenis_ukuran = document.getElementById("jenis_ukuran").value;
  const nilai_ukuran = document.getElementById("nilai_ukuran").value;

  const harga_modal = Number(
    document.getElementById("harga_modal").value || 0
  );
  const harga_jual = Number(
    document.getElementById("harga_jual").value || 0
  );
  const stok = document.getElementById("stok").value;
  const file = document.getElementById("foto").files[0];

  if (
    !nama_produk ||
    !supplier ||
    !satuan ||
    !jenis_ukuran ||
    !nilai_ukuran ||
    harga_modal <= 0 ||
    harga_jual <= 0
  ) {
    alert("Semua field wajib diisi (stok & foto boleh kosong)");
    return;
  }

  let fotoBase64 = "";
  if (file) {
    fotoBase64 = await toBase64(file);
  }

  const res = await apiPost({
    action: "addProduk",
    nama_produk,
    supplier,
    satuan,
    jenis_ukuran,
    nilai_ukuran,
    harga_modal,
    harga_jual,
    stok,
    foto: fotoBase64,
    nama_admin: localStorage.getItem("nama_sales") || "ADMIN"
  });

  if (res.status === "ok") {
    alert("Produk tersimpan: " + res.kode_produk);
    document.querySelectorAll("#formProduk input").forEach(i => (i.value = ""));
    localStorage.removeItem("cache_produk");
    loadProduk(true);
  } else {
    alert("Gagal menyimpan produk");
  }
}

/***********************
 * LOAD PRODUK (CACHE SELAMANYA)
 ***********************/
async function loadProduk(forceUpdate = false) {
  if (!forceUpdate) {
    const cached = getCache("cache_produk");
    if (cached) {
      DATA_PRODUK = cached;
      renderProduk(cached);
      return;
    }
  }

  const fresh = await apiGet("getProduk");
  setCache("cache_produk", fresh);
  DATA_PRODUK = fresh;
  renderProduk(fresh);
}

/***********************
 * UPDATE DATA MANUAL (ADMIN)
 ***********************/
function updateProdukManual() {
  if (role !== "admin") {
    alert("Akses ditolak");
    return;
  }
  localStorage.removeItem("cache_produk");
  loadProduk(true);
}

/***********************
 * SEARCH CEPAT
 ***********************/
function filterProduk() {
  const keyword = document
    .getElementById("searchProduk")
    .value.toLowerCase()
    .trim();

  if (!keyword) {
    renderProduk(DATA_PRODUK);
    return;
  }

  const filtered = [
    DATA_PRODUK[0],
    ...DATA_PRODUK.slice(1).filter(r => {
      return (
        String(r[0]).toLowerCase().includes(keyword) || // kode
        String(r[1]).toLowerCase().includes(keyword) || // nama
        String(r[3]).toLowerCase().includes(keyword) || // satuan
        String(r[5]).toLowerCase().includes(keyword)    // ukuran
      );
    })
  ];

  renderProduk(filtered);
}

/***********************
 * RENDER PRODUK
 ***********************/
function renderProduk(data) {
  const ul = document.getElementById("listProduk");
  if (!ul) return;

  ul.innerHTML = "";

  const rows = data
    .slice(1)
    .sort((a, b) =>
      String(a[1]).localeCompare(String(b[1]), "id", { sensitivity: "base" })
    );

  rows.forEach(r => {
    const kode = r[0];
    const nama = r[1];
    const satuan = r[3];
    const ukuran = r[5];
    const harga = r[7];
    const foto = r[9];

    let tombolFoto = "";
    if (foto) {
      tombolFoto = `<button onclick="lihatFoto('${foto}')">📷 Foto</button>`;
    }

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${nama}</strong><br>
      <small>${ukuran} / ${satuan}</small><br>
      <strong>Rp ${formatRupiah(harga)}</strong><br>
      ${tombolFoto}
    `;

    ul.appendChild(li);
  });

  if (ul.children.length === 0) {
    ul.innerHTML = "<li>Tidak ada produk</li>";
  }
}

/***********************
 * LIHAT FOTO PRODUK (POPUP)
 ***********************/
function lihatFoto(url) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Foto Produk</title>
        <style>
          body {
            margin: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          img {
            max-width: 100%;
            max-height: 100vh;
          }
        </style>
      </head>
      <body>
        <img src="${url}">
      </body>
    </html>
  `);
}
function bukaPriceList() {
  window.location.href = "price_list.html";
}

/***********************
 * BASE64 HELPER
 ***********************/
function toBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}
