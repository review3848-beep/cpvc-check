// admin/dashboard.js
import { callApi, getAdminSession } from "../api.js";

// key ต้องตรงกับที่หน้า login เซฟไว้
const ADMIN_KEY = "admin";

const $ = (id) => document.getElementById(id);

const el = {
  adminName: $("adminName"),

  totalTeachers: $("totalTeachers"),
  totalStudents: $("totalStudents"),
  todaySessions: $("todaySessions"),
  totalAttendance: $("totalAttendance"),

  subTeachers: $("subTeachers"),
  subStudents: $("subStudents"),
  subToday: $("subToday"),
  subAttendance: $("subAttendance"),

  recentSessions: $("recentSessions"),
  footerNote: $("footerNote"),

  q: $("q"),
  filterStatus: $("filterStatus"),

  btnRefresh: $("btnRefresh"),
  btnExport: $("btnExport"),
  btnLogout: $("btnLogout"),
};

let rawSessions = [];
let viewSessions = [];

function guard() {
  const admin = getAdminSession() || safeGetLocal(ADMIN_KEY);
  if (!admin) {
    location.href = "./login.html";
    return null;
  }
  if (el.adminName) el.adminName.textContent = admin?.name || admin?.username || "Admin";
  return admin;
}

function safeGetLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pill(status) {
  const s = String(status || "").toUpperCase();
  const isOpen = s === "OPEN";
  const cls = isOpen ? "open" : "closed";
  return `<span class="pill ${cls}"><span class="dot"></span>${isOpen ? "OPEN" : "CLOSED"}</span>`;
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function renderStats(stats) {
  el.totalTeachers.textContent = stats.teachers ?? "-";
  el.totalStudents.textContent = stats.students ?? "-";
  el.todaySessions.textContent = stats.todaySessions ?? "-";
  el.totalAttendance.textContent = stats.attendance ?? "-";

  const stamp = nowStamp();
  el.subTeachers.textContent = `อัปเดตล่าสุด: ${stamp}`;
  el.subStudents.textContent = `อัปเดตล่าสุด: ${stamp}`;
  el.subToday.textContent = `กำลังเปิดอยู่: ${stats.openSessions ?? "-"}`;
  el.subAttendance.textContent = `รายการสะสมทั้งระบบ`;
  el.footerNote.textContent = `Last sync: ${stamp}`;
}

function applyFilterAndSearch() {
  const q = (el.q?.value || "").trim().toLowerCase();
  const f = el.filterStatus?.value || "ALL";

  let rows = [...rawSessions];

  if (f !== "ALL") rows = rows.filter(s => String(s.status).toUpperCase() === f);

  if (q) {
    rows = rows.filter(s =>
      String(s.subject || "").toLowerCase().includes(q) ||
      String(s.teacher || "").toLowerCase().includes(q) ||
      String(s.room || "").toLowerCase().includes(q) ||
      String(s.status || "").toLowerCase().includes(q)
    );
  }

  viewSessions = rows;
  renderTable(rows);
}

function renderTable(rows) {
  if (!rows.length) {
    el.recentSessions.innerHTML = `<tr><td colspan="5" class="empty">ไม่พบข้อมูลตามตัวกรอง/คำค้น</td></tr>`;
    return;
  }

  el.recentSessions.innerHTML = rows.map(s => `
    <tr>
      <td><b>${escapeHtml(s.subject || "-")}</b></td>
      <td>${escapeHtml(s.teacher || "-")}</td>
      <td>${escapeHtml(s.room || "-")}</td>
      <td>${pill(s.status)}</td>
      <td class="right muted">${escapeHtml(s.time || "-")}</td>
    </tr>
  `).join("");
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function exportCSV() {
  if (!viewSessions.length) return alert("ไม่มีข้อมูลให้ Export");

  const cols = ["subject", "teacher", "room", "status", "time"];
  const lines = [
    cols.join(","),
    ...viewSessions.map(r => cols.map(c => csvEscape(r[c])).join(","))
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admin_recent_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function loadDashboard() {
  // ต้องมีเคสนี้ใน Code.gs (doPost)
  const r = await callApi("adminDashboard", { limit: 20 });

  // รองรับทั้งรูปแบบ {success:true,...} และ {success:true,data:{...}}
  const data = r.data || r;

  if (data.adminName && el.adminName) el.adminName.textContent = data.adminName;

  renderStats(data.stats || {});
  rawSessions = Array.isArray(data.recentSessions) ? data.recentSessions : [];
  applyFilterAndSearch();
}

function bindEvents() {
  el.q?.addEventListener("input", applyFilterAndSearch);
  el.filterStatus?.addEventListener("change", applyFilterAndSearch);

  el.btnRefresh?.addEventListener("click", async () => {
    try { await loadDashboard(); }
    catch (e) { console.error(e); alert(e.message || "โหลดข้อมูลไม่สำเร็จ"); }
  });

  el.btnExport?.addEventListener("click", exportCSV);

  el.btnLogout?.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_KEY);
    location.href = "./login.html";
  });
}

(async function init() {
  const admin = guard();
  if (!admin) return;

  bindEvents();

  try {
    await loadDashboard();
  } catch (e) {
    console.error(e);
    alert(e?.message || "Failed to fetch");
  }
})();
