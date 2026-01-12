import { callApi } from "../js/api.js";

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
  btnManage: $("btnManage"),
  btnViewAll: $("btnViewAll"),
  btnExport: $("btnExport"),
  btnAudit: $("btnAudit"),
};

let state = {
  dashboard: null,
  sessions: [],
};

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function pill(status) {
  const isOpen = String(status).toUpperCase() === "OPEN";
  const cls = isOpen ? "open" : "closed";
  const label = isOpen ? "OPEN" : "CLOSED";
  return `<span class="pill ${cls}"><span class="dot"></span>${label}</span>`;
}

function setLoading(isLoading) {
  if (!el.btnRefresh) return;
  el.btnRefresh.disabled = isLoading;
  el.btnRefresh.style.opacity = isLoading ? "0.6" : "1";
}

function renderHeader() {
  const stamp = nowStamp();
  el.footerNote.textContent = `Last sync: ${stamp}`;
  el.subTeachers.textContent = `อัปเดตล่าสุด: ${stamp}`;
  el.subStudents.textContent = `อัปเดตล่าสุด: ${stamp}`;
}

function renderStats() {
  const d = state.dashboard || {};
  el.adminName.textContent = d.adminName || "Admin";

  el.totalTeachers.textContent = d.totalTeachers ?? "-";
  el.totalStudents.textContent = d.totalStudents ?? "-";
  el.todaySessions.textContent = d.todaySessions ?? "-";
  el.totalAttendance.textContent = d.totalAttendance ?? "-";

  const openCount = (state.sessions || []).filter(
    (s) => String(s.status).toUpperCase() === "OPEN"
  ).length;

  el.subToday.textContent = `กำลังเปิดอยู่: ${openCount}`;
  el.subAttendance.textContent = `รายการสะสมทั้งระบบ`;
}

function applyFilterAndSearch() {
  const q = (el.q?.value || "").trim().toLowerCase();
  const f = el.filterStatus?.value || "ALL";

  let rows = [...(state.sessions || [])];

  if (f !== "ALL") rows = rows.filter((s) => String(s.status).toUpperCase() === f);

  if (q) {
    rows = rows.filter((s) => {
      const subject = (s.subject || "").toLowerCase();
      const teacher = (s.teacher || "").toLowerCase();
      const room = String(s.room || "").toLowerCase();
      const status = String(s.status || "").toLowerCase();
      const time = String(s.time || "").toLowerCase();
      return (
        subject.includes(q) ||
        teacher.includes(q) ||
        room.includes(q) ||
        status.includes(q) ||
        time.includes(q)
      );
    });
  }

  if (!rows.length) {
    el.recentSessions.innerHTML = `<tr><td colspan="5" class="empty">ไม่พบข้อมูลตามตัวกรอง/คำค้น</td></tr>`;
    return;
  }

  el.recentSessions.innerHTML = rows
    .map(
      (s) => `
    <tr>
      <td><b>${escapeHtml(s.subject || "-")}</b></td>
      <td>${escapeHtml(s.teacher || "-")}</td>
      <td>${escapeHtml(String(s.room || "-"))}</td>
      <td>${pill(s.status || "CLOSED")}</td>
      <td class="right muted">${escapeHtml(s.time || "-")}</td>
    </tr>
  `
    )
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ====== โหลดข้อมูลจริงจาก GAS ======
async function loadDashboard() {
  setLoading(true);
  try {
    // 1) ยิง action ดึงภาพรวม + recent sessions
    // ฝั่ง GAS จะต้อง return รูปแบบนี้:
    // { success:true, data:{ adminName, totalTeachers, totalStudents, todaySessions, totalAttendance, recentSessions:[...] } }
    const res = await callApi("adminGetDashboard", { limit: 12 });

    if (!res.success) throw new Error(res.message || "Load failed");

    const data = res.data || {};
    state.dashboard = {
      adminName: data.adminName,
      totalTeachers: data.totalTeachers,
      totalStudents: data.totalStudents,
      todaySessions: data.todaySessions,
      totalAttendance: data.totalAttendance,
    };
    state.sessions = Array.isArray(data.recentSessions) ? data.recentSessions : [];

    renderHeader();
    renderStats();
    applyFilterAndSearch();
  } catch (err) {
    console.error(err);
    el.recentSessions.innerHTML = `<tr><td colspan="5" class="empty">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(err.message || "error")}</td></tr>`;
  } finally {
    setLoading(false);
  }
}

// ====== Events ======
function bindEvents() {
  el.q?.addEventListener("input", applyFilterAndSearch);
  el.filterStatus?.addEventListener("change", applyFilterAndSearch);

  el.btnRefresh?.addEventListener("click", loadDashboard);

  el.btnManage?.addEventListener("click", () => {
    alert("Manage: ต่อไปลิงก์ไปหน้า admin/manage.html หรือแยกครู/นักเรียน");
  });

  el.btnViewAll?.addEventListener("click", () => {
    alert("View all: ต่อไปทำหน้า sessions ทั้งหมด + pagination");
  });

  el.btnExport?.addEventListener("click", () => {
    alert("Export: ต่อไปทำ action adminExportAll หรือ export รายงาน");
  });

  el.btnAudit?.addEventListener("click", () => {
    alert("Audit Log: ต่อไปทำหน้า log events");
  });
}

// init
bindEvents();
loadDashboard();
