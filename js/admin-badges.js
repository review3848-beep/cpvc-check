/* =========================
   CONFIG
========================= */
const API_URL = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec"; 
import { guardAdmin } from "./js/admin-guard.js";

guardAdmin(); // ทุก role เข้าได้

// 👆 เปลี่ยนเป็น Web App ของคุณ

// map TYPE จากชีต → id badge ในหน้า
const BADGE_MAP = {
  users: "badge-users",
  review: "badge-review",
  settings: "badge-settings"
};

// threshold สำหรับเปลี่ยนสี (ปรับได้)
const LEVEL = {
  danger: 4,
  warning: 2
};

/* =========================
   LOAD BADGES
========================= */
async function loadAdminBadges() {
  try {
    const res = await fetch(`${API_URL}?action=adminBadges`);
    if (!res.ok) throw new Error("API not ok");

    const data = await res.json();

    Object.keys(BADGE_MAP).forEach(type => {
      const el = document.getElementById(BADGE_MAP[type]);
      if (!el) return;

      const count = Number(data[type] || 0);

      // ซ่อนถ้าไม่มีแจ้งเตือน
      if (count <= 0) {
        el.style.display = "none";
        return;
      }

      el.style.display = "inline-block";
      el.textContent = count;

      // reset class
      el.className = "badge";

      // set level
      if (count >= LEVEL.danger) {
        el.classList.add("danger");
      } else if (count >= LEVEL.warning) {
        el.classList.add("warning");
      } else {
        el.classList.add("info");
      }
    });

  } catch (err) {
    console.error("❌ Load admin badges failed:", err);
  }
}

/* =========================
   AUTO REFRESH (OPTIONAL)
========================= */
// โหลดครั้งแรก
loadAdminBadges();

// รีเฟรชทุก 30 วินาที (ถ้าไม่อยากใช้ ลบ setInterval ทิ้ง)
setInterval(loadAdminBadges, 30000);
