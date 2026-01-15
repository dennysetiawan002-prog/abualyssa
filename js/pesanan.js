/*************************
 * STATE PESANAN
 *************************/
let order = {
  pelanggan: "",
  items: [],
  total: 0
};
let editingOrderNo = null;
// DATA MASTER
let DATA_PELANGGAN = [];
let DATA_PRODUK = [];

function getRole() {
  return (localStorage.getItem("role_sales") || "").toLowerCase().trim();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    

    DATA_PELANGGAN = await apiGet("getPelanggan");
    DATA_PRODUK = await apiGet("getProduk");
    loadDaftarPesanan();
  } catch (err) {
    console.error(err);
    alert("Gagal mengambil data");
  }
});

/*************************
 * ELEMENT INPUT PESANAN
 *************************/
const inputPelanggan = document.getElementById("inputPelanggan");
const inputProduk = document.getElementById("inputProduk");
const inputQty = document.getElementById("inputQty");
const btnTambah = document.getElementById("btnTambah");
const listItem = document.getElementById("listItem");
const listPelanggan = document.getElementById("listPelanggan");
const listProduk = document.getElementById("listProduk");
const btnKirimPesanan = document.getElementById("btnKirimPesanan");

/*************************
 * EVENT
 *************************/
btnTambah?.addEventListener("click", tambahItem);

inputPelanggan?.addEventListener("input", () => {
  tampilkanPelanggan(inputPelanggan.value);
});

inputProduk?.addEventListener("input", () => {
  tampilkanProduk(inputProduk.value);
});

btnKirimPesanan?.addEventListener("click", kirimPesanan);

/*************************
 * KIRIM PESANAN
 *************************/
async function kirimPesanan() {
  if (!order.items.length) {
    alert("Pesanan masih kosong");
    return;
  }

  const payload = {
    action: "simpanPesanan",
    pelanggan: {
      id: inputPelanggan.dataset.id || "",
      nama_toko: inputPelanggan.value
    },
    items: order.items,
    total: order.total,
    sales: localStorage.getItem("nama_sales") || "",
replace_no: editingOrderNo
  };

  try {
    const res = await apiPost(payload);
    if (res.status === "ok") {
      alert("Pesanan tersimpan: " + res.no_pesanan);
      resetPesanan();
      loadDaftarPesanan();
    } else {
      alert("Gagal menyimpan pesanan");
    }
  } catch (err) {
    console.error(err);
    alert("Error saat menyimpan pesanan");
  }
}

/*************************
 * LOAD DAFTAR PESANAN
 * ⬇️ DI SINI TOMBOL PRINT DITENTUKAN
 *************************/
async function loadDaftarPesanan() {
  const tbody = document.querySelector("#tabelPesanan tbody");
  if (!tbody) return;

  const res = await apiGet("getPesanan");

  const data =
    Array.isArray(res) ? res :
    Array.isArray(res?.data) ? res.data :
    Array.isArray(res?.pesanan) ? res.pesanan :
    [];

  tbody.innerHTML = "";

  data.forEach(p => {

  const aksiHTML = `
    <a href="pesanan_detail.html?no=${p.no_pesanan}">🔍 Rincian</a>
    | <button onclick="editPesanan('${p.no_pesanan}')">✏️ Edit</button>
  `;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${p.no_pesanan}</td>
    <td>${new Date(p.tanggal).toLocaleString()}</td>
    <td>${p.nama_toko}</td>
    <td style="text-align:right">
      Rp ${Number(p.total).toLocaleString()}
    </td>
    <td>${p.status || "-"}</td>
    <td>${aksiHTML}</td>
  `;

  tbody.appendChild(tr);
});
}

/*************************
 * TAMBAH ITEM
 *************************/
function tambahItem() {
  const pelanggan = inputPelanggan.value.trim();
  const produk = inputProduk.value.trim();
  const qty = parseInt(inputQty.value);

  if (!pelanggan || !produk || !qty || qty <= 0) {
    alert("Lengkapi data pesanan");
    return;
  }

  order.pelanggan = pelanggan;
  const harga = parseInt(inputProduk.dataset.harga);

  if (!harga) {
    alert("Pilih produk dari daftar");
    return;
  }

  const existing = order.items.find(i => i.produk === produk);

  if (existing) {
    existing.qty += qty;
    existing.subtotal = existing.qty * existing.harga;
  } else {
    order.items.push({
      produk,
      qty,
      harga,
      modal: parseInt(inputProduk.dataset.modal) || 0,
      subtotal: qty * harga
    });
  }

  hitungTotal();
  renderItem();
  resetInputProduk();
}

/*************************
 * HITUNG TOTAL
 *************************/
function hitungTotal() {
  order.total = order.items.reduce((sum, item) => sum + item.subtotal, 0);
}

/*************************
 * RESET PESANAN
 *************************/
function resetPesanan() {
  order = { pelanggan: "", items: [], total: 0 };
editingOrderNo = null;
  listItem.innerHTML = "";
  updateTotalUI();
  inputPelanggan.value = "";
  inputPelanggan.dataset.id = "";
  resetInputProduk();
}

/*************************
 * RENDER ITEM
 *************************/
function renderItem() {
  listItem.innerHTML = "";

  if (order.items.length === 0) {
    listItem.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888">Belum ada item</td></tr>`;
    updateTotalUI();
    return;
  }

  order.items.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.produk}</td>
      <td><input type="number" min="1" value="${item.qty}" onchange="ubahQty(${index}, this.value)"></td>
      <td><input type="number" min="0" value="${item.harga}" onchange="ubahHarga(${index}, this.value)"></td>
      <td>Rp ${item.subtotal.toLocaleString()}</td>
      <td><button onclick="hapusItem(${index})">✕</button></td>
    `;
    listItem.appendChild(tr);
  });

  updateTotalUI();
}

/*************************
 * UPDATE ITEM
 *************************/
function ubahQty(i, v) {
  const qty = parseInt(v);
  if (qty <= 0) return;
  order.items[i].qty = qty;
  order.items[i].subtotal = qty * order.items[i].harga;
  hitungTotal();
  renderItem();
}

function ubahHarga(i, v) {
  const harga = parseInt(v);
  if (harga < 0) return;
  order.items[i].harga = harga;
  order.items[i].subtotal = harga * order.items[i].qty;
  hitungTotal();
  renderItem();
}

function hapusItem(i) {
  if (!confirm("Hapus item ini?")) return;
  order.items.splice(i, 1);
  hitungTotal();
  renderItem();
}

/*************************
 * TOTAL UI
 *************************/
function updateTotalUI() {
  const el = document.querySelector(".total");
  if (el) el.innerText = "Total: Rp " + order.total.toLocaleString();
}

/*************************
 * AUTOCOMPLETE
 *************************/
function resetInputProduk() {
  inputProduk.value = "";
  inputQty.value = "";
  inputProduk.dataset.harga = "";
  inputProduk.dataset.modal = "";
  listProduk.innerHTML = "";
}

function tampilkanPelanggan(keyword) {
  listPelanggan.innerHTML = "";
  if (!keyword) return;

  DATA_PELANGGAN.slice(1)
    .filter(r => (r[1] || "").toLowerCase().includes(keyword.toLowerCase()))
    .slice(0, 6)
    .forEach(r => {
      const div = document.createElement("div");
      div.innerText = r[1];
      div.onclick = () => {
        inputPelanggan.value = r[1];
        inputPelanggan.dataset.id = r[0];
        listPelanggan.innerHTML = "";
      };
      listPelanggan.appendChild(div);
    });
}

function tampilkanProduk(keyword) {
  listProduk.innerHTML = "";
  if (!keyword) return;

  DATA_PRODUK.slice(1)
    .filter(r => (r[1] || "").toLowerCase().includes(keyword.toLowerCase()))
    .slice(0, 6)
    .forEach(r => {
      const hargaJual = parseInt(r[7]) || 0;
      const hargaModal = parseInt(r[6]) || 0;

      const div = document.createElement("div");
      div.innerHTML = `${r[1]} <small>Rp ${hargaJual.toLocaleString()}</small>`;
      div.onclick = () => {
        inputProduk.value = r[1];
        inputProduk.dataset.harga = hargaJual;
        inputProduk.dataset.modal = hargaModal;
        listProduk.innerHTML = "";
      };
      listProduk.appendChild(div);
    });
}
async function editPesanan(noPesanan) {
editingOrderNo = noPesanan;
  if (!confirm("Tarik pesanan ini untuk diedit ulang?")) return;

  try {
    const res = await apiGet("getPesananDetail&no=" + noPesanan);

    if (!res || !res.items || !res.items.length) {
      alert("Detail pesanan tidak ditemukan");
      return;
    }

    // RESET STATE LAMA
    order = {
      pelanggan: res.nama_toko,
      items: [],
      total: 0
    };

    // SET PELANGGAN
    inputPelanggan.value = res.nama_toko;
    inputPelanggan.dataset.id = res.id_pelanggan || "";

    // SET ITEM
    res.items.forEach(item => {
      order.items.push({
        produk: item.produk,
        qty: Number(item.qty),
        harga: Number(item.harga),
        modal: Number(item.modal || 0),
        subtotal: Number(item.subtotal)
      });
    });

    hitungTotal();
    renderItem();

    alert("Pesanan dimuat ke form. Silakan edit lalu kirim.");

  } catch (err) {
    console.error(err);
    alert("Gagal memuat pesanan");
  }
}