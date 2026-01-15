function getSetting() {
  const saved = localStorage.getItem("app_setting");
  if (!saved) return null;
  return JSON.parse(saved);
}

function applyTheme() {
  const setting = getSetting();
  if (!setting) return;

  document.body.style.backgroundColor = setting.theme.background;
  document.body.style.color = setting.theme.text;
  document.body.style.fontFamily = setting.theme.font;

  document.querySelectorAll("button").forEach(btn => {
    btn.style.backgroundColor = setting.theme.primary;
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.padding = "8px 12px";
    btn.style.borderRadius = "4px";
  });
}

// auto apply saat halaman dibuka
document.addEventListener("DOMContentLoaded", applyTheme);
