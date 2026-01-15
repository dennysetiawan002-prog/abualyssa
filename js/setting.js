/***********************
 * ROLE CHECK
 ***********************/
const role = localStorage.getItem("role_sales");

if (role !== "admin") {
  document.getElementById("info").innerText =
    "Akses ditolak. Hanya admin yang dapat mengubah setting.";
} else {
  document.getElementById("settingSistem").style.display = "block";
  document.getElementById("settingToko").style.display = "block";
}

/***********************
 * LOAD SETTING
 ***********************/
async function loadSetting() {
  const cached = getCache("cache_setting");
  if (cached) {
    renderSetting(cached);
    return;
  }

  const data = await apiGet("getSetting");
  setCache("cache_setting", data);
  renderSetting(data);
}

function renderSetting(data) {
  data.forEach(r => {
    const key = r[0];
    const val = r[1] || "";

    const el = document.getElementById(key);
    if (el) el.value = val;

    if (key === "logo_url" && val) {
      previewLogo.src = val;
      previewLogo.style.display = "block";
    }
  });
}

/***********************
 * SIMPAN PASSWORD ADMIN
 ***********************/
async function simpanPassword() {
  const pass = admin_password.value.trim();
  if (!pass) {
    alert("Password tidak boleh kosong");
    return;
  }

  const res = await apiPost({
    action: "updateSetting",
    key: "admin_password",
    value: pass
  });

  if (res.status === "ok") {
    clearCache("cache_setting");
    alert("Password admin diperbarui");
    admin_password.value = "";
  }
}

/***********************
 * SIMPAN SETTING TOKO
 ***********************/
async function simpanSettingToko() {
  let logoBase64 = "";
  const file = logo.files[0];

  if (file) {
    logoBase64 = await toBase64(file);
  }

  const payload = {
    action: "updateSettingBatch",
    data: {
      nama_toko: nama_toko.value,
      alamat_toko: alamat_toko.value,
      telepon_toko: telepon_toko.value,
      warna_utama: warna_utama.value,
      warna_tombol: warna_tombol.value,
      font_aplikasi: font_aplikasi.value
    },
    logo: logoBase64
  };

  const res = await apiPost(payload);

  if (res.status === "ok") {
    clearCache("cache_setting");
    alert("Setting toko disimpan");
    loadSetting();
    applyTheme(payload.data);
  }
}

/***********************
 * APPLY THEME
 ***********************/
function applyTheme(data) {
  document.documentElement.style.setProperty("--warna-utama", data.warna_utama);
  document.documentElement.style.setProperty("--warna-tombol", data.warna_tombol);
  document.body.style.fontFamily = data.font_aplikasi;
}

/***********************
 * BASE64
 ***********************/
function toBase64(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", loadSetting);

fetch(API+'?action=getSettingToko')
  .then(r=>r.json())
  .then(s=>{
    nama_toko.value = s.nama_toko || '';
    alamat_toko.value = s.alamat_toko || '';
    telepon_toko.value = s.telepon_toko || '';
    warna_utama.value = s.warna_utama || '#000000';
    font_aplikasi.value = s.font_aplikasi || 'monospace';
  });
function simpanSettingToko(){
  fetch(API,{
    method:'POST',
    body:JSON.stringify({
      action:'simpanSettingToko',
      data:{
        nama_toko:nama_toko.value,
        alamat_toko:alamat_toko.value,
        telepon_toko:telepon_toko.value,
        font_aplikasi:font_aplikasi.value
      }
    })
  }).then(()=>alert('Setting disimpan'));
}
