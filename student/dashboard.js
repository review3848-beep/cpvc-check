// student/dashboard.js
import { callApi, getStudentSession, clearAllSession } from "../api.js";

/* ================== DOM ================== */
const nameEl = document.getElementById("studentName");
const idEl   = document.getElementById("studentIdDisplay");
const msgEl  = document.getElementById("msg");

const totalEl = document.getElementById("totalSessions");
const okEl    = document.getElementById("attendedCount");
const lateEl  = document.getElementById("lateCount");
const absEl   = document.getElementById("absentCount");

const tbodyEl = document.getElementById("recentAttendance");
const chartCanvas = document.getElementById("attendanceChart");

const btnScan    = document.getElementById("btnScan");
const btnHistory = document.getElementById("btnHistory");
const btnRefresh = document.getElementById("btnRefresh");
const logoutBtn  = document.getElementById("logoutBtn");

/* ================== STATE ================== */
let student = null;
let chart = null;
let refreshing = false;

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", async () => {
  student = guardStudent();
  if (!student) return;

  hydrateHeader(student);
  wireButtons();

  await loadDashboard();

  // อัปเดตเองทุก 25 วิ (ถ้าไม่อยากให้ auto ปิดบรรทัดนี้)
  setInterval(() => {
    if (!refreshing) loadDashboard(true);
  }, 25000);
});

/* ================== AUTH ================== */
function guardStudent() {
  // ✅ ใช้ helper ที่มาจาก api.js (key ที่โปรเจกต์ใช้จริงคือ cpvc_student)
  const s = getStudentSession();
  if (!s) {
    location.href = "./login.html";
    return null;
  }

  // normalize รูปแบบ session ให้ชัวร์
  // บางหน้าชอบเก็บเป็น { student:{...} } ก็จัดให้รองรับ
  if (s.student) return s.student;
  return s;
}

function hydrateHeader(s) {
  const name = s.name || s.studentName || s.fullname || "STUDENT";
  const sid  = s.studentId || s.id || s.code || s.STUDENT_ID || "";

  nameEl.textContent = name;
  idEl.textContent = sid || "-";
}

function wireButtons() {
  btnScan.addEventListener("click", () => {
    // เปลี่ยนชื่อไฟล์ปลายทางตรงนี้ได้ตามที่เธอใช้จริง
    // เช่น scan.html / checkin.html / scanner.html
    location.href = "./scan.html";
  });

  btnHistory.addEventListener("click", async () => {
    // ถ้ามีหน้า history.html ก็ไปเลย
    // ถ้ายังไม่มี จะ fallback เป็น alert พร้อม export json ให้ดู
    try {
      // ถ้ามีไฟล์อยู่แล้ว ให้ใช้บรรทัดนี้
      location.href = "./history.html";
    } catch (e) {
      alert("ยังไม่มีหน้า history.html");
    }
  });

  btnRefresh.addEventListener("click", () => loadDashboard());

  logoutBtn.addEventListener("click", () => {
    clearAllSession();
    location.href = "./login.html";
  });
}

/* ================== LOAD DASHBOARD ================== */
async function loadDashboard(silent = false) {
  const sid = (student.studentId || student.id || student.code || "").toString().trim();
  if (!sid) {
    setMsg("ไม่พบ studentId ใน session (เช็คตอน login ว่าเก็บ studentId ไหม)", "err");
    return;
  }

  if (!silent) setMsg("กำลังโหลดข้อมูล...", "info");
  refreshing = true;

  try {
    // ✅ ต้องส่ง studentId ไปด้วย ไม่งั้นจะได้ 0 หมด
    const res = await callApi("studentGetDashboard", { studentId: sid });

    if (!res || !res.success) {
      // ถ้าโดนหลุด session (เผื่อบางคนไปลบ key)
      if (String(res?.message || "").toLowerCase().includes("login")) {
        clearAllSession();
        location.href = "./login.html";
        return;
      }
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    const stats = res.stats || res.data?.stats || {};
    const recent = res.recent || res.data?.recent || [];

    renderStats(stats);
    renderRecent(recent);
    renderChart(stats);

    setMsg(silent ? "" : "อัปเดตล่าสุดเรียบร้อย ✅", silent ? "": "ok");
  } catch (err) {
    setMsg("❌ " + (err.message || err), "err");
  } finally {
    refreshing = false;
  }
}

/* ================== RENDER ================== */
function renderStats(stats) {
  const total = num(stats.total ?? stats.totalSessions ?? 0);
  const ok    = num(stats.ok ?? stats.attended ?? stats.present ?? 0);
  const late  = num(stats.late ?? 0);
  const abs   = num(stats.absent ?? 0);

  totalEl.textContent = total;
  okEl.textContent    = ok;
  lateEl.textContent  = late;
  absEl.textContent   = abs;
}

function renderRecent(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    tbodyEl.innerHTML = `<tr><td colspan="3" class="empty">ยังไม่มีประวัติ</td></tr>`;
    return;
  }

  // รองรับหลายฟิลด์ (GAS ของเธอคืน {time, subject, status, token, teacher, room?})
  const list = rows.slice(0, 10).map(r => ({
    time: r.time || r.datetime || r.createdAt || r.date || "-",
    subject: r.subject || r.course || r.className || "-",
    status: String(r.status || r.result || "-").toUpperCase()
  }));

  tbodyEl.innerHTML = list.map(x => `
    <tr>
      <td>${esc(formatTime(x.time))}</td>
      <td>${esc(x.subject)}</td>
      <td>${badge(x.status)}</td>
    </tr>
  `).join("");
}

function renderChart(stats) {
  if (!chartCanvas || !window.Chart) return;

  const ok   = num(stats.ok ?? stats.attended ?? stats.present ?? 0);
  const late = num(stats.late ?? 0);
  const abs  = num(stats.absent ?? 0);

  try { chart?.destroy(); } catch {}

  chart = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: ["มาเรียน", "สาย", "ขาด"],
      datasets: [{ data: [ok, late, abs], borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      cutout: "68%"
    }
  });
}

/* ================== UI HELPERS ================== */
function setMsg(text, type) {
  msgEl.textContent = text || "";
  msgEl.className = "msg" + (type ? " " + type : "");
}

function badge(status) {
  const s = String(status || "-").toUpperCase();
  if (s === "OK" || s === "PRESENT" || s === "ATTENDED") return `<span class="badge b-ok">มาเรียน</span>`;
  if (s === "LATE") return `<span class="badge b-late">สาย</span>`;
  if (s === "ABSENT") return `<span class="badge b-abs">ขาด</span>`;
  return `<span class="badge">${esc(s)}</span>`;
}

function formatTime(v) {
  // ถ้าเป็น Date string/ISO ช่วยจัดให้อ่านง่าย
  try {
    const d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return String(v);
  }
}

function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
