/* =====================================================
   Admin Dashboard Controller
   CPVC-Check / NexAttend
   ใช้ร่วมกับ js/api.js
===================================================== */

import { callApi } from "../js/api.js";

/* =========================
   CONFIG
========================= */

// badge แจ้งเตือน
const BADGE_MAP = {
  users: "badge-users",
  review: "badge-review",
  settings: "badge-settings"
};

const LEVEL = {
  danger: 4,
  warning: 2
};

// element id ของสถิติผู้ใช้
const STAT_MAP = {
  students: "stat-students",
  teachers: "stat-teachers",
  total: "stat-total"
};

const REFRESH_INTERVAL = 30000; // 30 วิ

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderToday();
  loadAdminBadges();
  loadUserStats();
  setupAutoRefresh();
  setupCardActions();
});

/* =========================
   DATE
========================= */
function renderToday() {
  const el = document.getElementById("today");
  if (!el) return;

  el.textContent = new Date().toLocaleDateString("th-TH", {
    dateStyle: "medium"
  });
}

/* =========================
   BADGES
========================= */
async function loadAdminBadges() {
  try {
    const data = await callApi("adminBadges");

    Object.keys(BADGE_MAP).forEach(type => {
      const el = document.getElementById(BADGE_MAP[type]);
      if (!el) return;

      const count = Number(data[type] || 0);

      if (count <= 0) {
        el.style.display = "none";
        return;
      }

      el.style.display = "inline-block";
      el.textContent = count;
      el.className = "badge";

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
   USER STATS (REAL DATA)
========================= */
async function loadUserStats() {
  try {
    const data = await callApi("adminStats");
    /*
      expected:
      {
        students: number,
        teachers: number,
        admins: number
      }
    */

    const students = Number(data.students || 0);
    const teachers = Number(data.teachers || 0);
    const admins  = Number(data.admins || 0);
    const total   = students + teachers + admins;

    setStat("students", students);
    setStat("teachers", teachers);
    setStat("total", total);

  } catch (err) {
    console.error("❌ Load user stats failed:", err);
  }
}

function setStat(key, value) {
  const el = document.getElementById(STAT_MAP[key]);
  if (!el) return;

  // ใส่ comma แบบมือโปร
  el.textContent = value.toLocaleString("th-TH");
}

/* =========================
   AUTO REFRESH
========================= */
function setupAutoRefresh() {
  setInterval(() => {
    loadAdminBadges();
    loadUserStats();
  }, REFRESH_INTERVAL);
}

/* =========================
   CARD ACTIONS
========================= */
function setupCardActions() {
  document.querySelectorAll(".action-card").forEach(card => {
    card.addEventListener("click", () => {
      const target = card.dataset.target;
      if (!target) return;
      window.location.href = target;
    });
  });
}

/* =========================
   MANUAL DEBUG
========================= */
window.reloadAdminDashboard = () => {
  loadAdminBadges();
  loadUserStats();
};
