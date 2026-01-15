/***********************
 * SETTING TOKO
 ***********************/
const NAMA_TOKO = "TOKO ANDA";
const ALAMAT_TOKO = "Alamat toko Anda";

/***********************
 * INIT
 ***********************/
document.getElementById("namaToko").innerText = NAMA_TOKO;
document.getElementById("alamatToko").innerText = ALAMAT_TOKO;
document.getElementById("tanggalCetak").innerText =
  "Dicetak: " + new Date().toLocaleDateString("id-ID");

/***********************
 * LOAD DATA
 ***********************/
async function loadPriceList() {
  const data = getCache("cache_produk") || await apiGet("getProduk");
  renderPriceList(data);
}

function renderPriceList(data) {
  const tbody = document.getElementById("listPrice");
  tbody.innerHTML = "";

  const rows = data.slice(1).sort((a,b)=>a[1].localeCompare(b[1],"id"));

  rows.forEach((r, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td style="text-align:center">${i + 1}</td>
      <td>${r[1]}</td>
      <td>${r[3]} – ${r[5]}</td>
      <td style="text-align:right">Rp ${formatRupiah(r[7])}</td>
    `;

    tbody.appendChild(tr);
  });
}

/***********************
 * FORMAT RUPIAH
 ***********************/
function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

/***********************
 * EXPORT EXCEL
 ***********************/
function exportExcel() {
  const wb = XLSX.utils.book_new();
  const table = document.querySelector("#priceArea table");
  const ws = XLSX.utils.table_to_sheet(table);

  XLSX.utils.book_append_sheet(wb, ws, "Price List");
  XLSX.writeFile(wb, "price_list.xlsx");
}

/***********************
 * EXPORT PDF
 ***********************/
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(document.getElementById("priceArea"));
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const w = 210;
  const h = canvas.height * w / canvas.width;

  pdf.addImage(img, "PNG", 0, 0, w, h);
  pdf.save("price_list.pdf");
}

/***********************
 * EXPORT JPG + SHARE
 ***********************/
async function exportJPG() {
  const canvas = await html2canvas(document.getElementById("priceArea"));
  canvas.toBlob(async blob => {

    const file = new File([blob], "price_list.jpg", { type: "image/jpeg" });

    // SHARE HP
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Price List",
        text: "Price list terbaru"
      });
    } else {
      // fallback download
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "price_list.jpg";
      a.click();
    }
  });
}

loadPriceList();
