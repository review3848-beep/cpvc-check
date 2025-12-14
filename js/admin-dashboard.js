/* =====================================================
   Admin Dashboard JS
   CPVC-Check / NexAttend
   ใช้ api.js เป็นศูนย์กลาง
===================================================== */

import { callApi } from "../js/api.js";

/* =========================
   CONFIG
========================= */
const REFRESH_INTERVAL = 30000; // 30 วินาที

const BADGE_MAP = {
  users: "badge-users",
  review: "badge-review"
};

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderToday();
  loadAll();
  setInterval(loadAll, REFRESH_INTERVAL);
  bindCardRoutes();
});

/* =========================
   MAIN LOAD
========================= */
function loadAll() {
  loadStats();
  loadBadges();
  loadActivity();
  loadTrendChart();
}

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
   STATS (REAL DATA)
========================= */
async function loadStats() {
  try {
    const d = await callApi("adminStats");

    setText("stat-students", d.students);
    setText("stat-teachers", d.teachers);
    setText("stat-absent", d.absent);

    // 🔥 กัน undefined 100%
    const rate = Number.isFinite(d.rate) ? d.rate : 0;
    setText("stat-rate", rate + "%");

  } catch (err) {
    console.error("❌ loadStats error:", err);
    fallbackStats();
  }
}

function fallbackStats() {
  setText("stat-students", "—");
  setText("stat-teachers", "—");
  setText("stat-absent", "—");
  setText("stat-rate", "0%");
}

/* =========================
   BADGES
========================= */
async function loadBadges() {
  try {
    const d = await callApi("adminBadges");

    Object.keys(BADGE_MAP).forEach(key => {
      const el = document.getElementById(BADGE_MAP[key]);
      if (!el) return;

      const count = Number(d[key] || 0);
      if (count <= 0) {
        el.style.display = "none";
      } else {
        el.style.display = "inline-block";
        el.textContent = count;
      }
    });

  } catch (err) {
    console.error("❌ loadBadges error:", err);
  }
}

/* =========================
   ACTIVITY
========================= */
async function loadActivity() {
  const list = document.getElementById("activityList");
  if (!list) return;

  try {
    const data = await callApi("adminActivity");

    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = `<li class="muted">ยังไม่มี activity วันนี้</li>`;
      return;
    }

    data.slice(0, 4).forEach(a => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${escapeHtml(a.text || "-")}
        <span>${escapeHtml(a.time || "")}</span>
      `;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("❌ loadActivity error:", err);
    list.innerHTML = `<li class="muted">โหลด activity ไม่สำเร็จ</li>`;
  }
}

/* =========================
   TREND CHART (7 DAYS)
========================= */
let trendChartInstance = null;

async function loadTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas || typeof Chart === "undefined") return;

  try {
    const d = await callApi("adminTrend7Days");
    if (!d || !d.labels || !d.values || d.values.length === 0) {
      canvas.style.display = "none";
      return;
    }

    canvas.style.display = "block";

    if (trendChartInstance) {
      trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: d.labels,
        datasets: [{
          data: d.values,
          borderColor: "#38bdf8",
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });

  } catch (err) {
    console.error("❌ loadTrendChart error:", err);
    canvas.style.display = "none";
  }
}

/* =========================
   ROUTING
========================= */
function bindCardRoutes() {
  document.querySelectorAll("[data-target]").forEach(el => {
    el.addEventListener("click", () => {
      location.href = el.dataset.target;
    });
  });
}

/* =========================
   UTIL
========================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "—";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================
   DEBUG
========================= */
window.reloadAdminDashboard = loadAll;
