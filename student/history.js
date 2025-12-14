// student/history.js
import { callApi } from "../js/api.js";

let allRows = [];
let filteredRows = [];

let dateFilter = "ALL";    // ALL | TODAY | WEEK
let statusFilter = "ALL";  // ALL | OK | LATE | ABSENT
let searchText = "";

document.addEventListener("DOMContentLoaded", async () => {
  const nameEl = document.getElementById("studentNameDisplay");
  const idEl   = document.getElementById("studentIdDisplay");
  const tbody  = document.getElementById("historyBody");
  const msgEl  = document.getElementById("historyMsg");

  // ===== AUTH =====
  const raw = localStorage.getItem("cpvc_student");
  if (!raw) {
    location.href = "login.html";
    return;
  }

  const student = JSON.parse(raw);
  const studentId = student.studentId;

  nameEl.textContent = student.name || "-";
  idEl.textContent   = studentId || "-";

  // ===== LOAD DATA =====
  let res;
  try {
    res = await callApi("studentGetHistory", { studentId });
  } catch (e) {
    msgEl.textContent = "❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
    return;
  }

  if (!res.success) {
    msgEl.textContent = res.message || "โหลดข้อมูลไม่สำเร็จ";
    return;
  }

  allRows = res.rows || [];
  applyFilters();

  // ===== EVENTS =====
  setupDateFilters();
  setupStatusFilters();
  setupSearch();
  setupExport();
});

// ==========================
// FILTER LOGIC
// ==========================
function applyFilters() {
  filteredRows = allRows.filter(r => {
    if (!matchDate(r.date)) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchText) {
      const t = searchText.toLowerCase();
      if (
        !(r.subject || "").toLowerCase().includes(t) &&
        !(r.teacher || "").toLowerCase().includes(t)
      ) return false;
    }
    return true;
  });

  renderTable();
  updateBadges();
}

function matchDate(dateStr) {
  if (dateFilter === "ALL") return true;
  const d = new Date(dateStr);
  const now = new Date();

  if (dateFilter === "TODAY") {
    return d.toDateString() === now.toDateString();
  }

  if (dateFilter === "WEEK") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return d >= start && d <= now;
  }

  return true;
}

// ==========================
// RENDER
// ==========================
function renderTable() {
  const tbody = document.getElementById("historyBody");
  tbody.innerHTML = "";

  if (!filteredRows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  filteredRows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="time-col">${r.time || "-"}</td>
      <td>${r.subject || "-"}</td>
      <td>${r.room || "-"}</td>
      <td class="status-${(r.status || "").toLowerCase()}">${r.status || "-"}</td>
      <td>${r.teacher || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateBadges() {
  const count = s =>
    filteredRows.filter(r => s === "ALL" || r.status === s).length;

  document.getElementById("countAll").textContent    = filteredRows.length;
  document.getElementById("countOK").textContent     = count("OK");
  document.getElementById("countLATE").textContent   = count("LATE");
  document.getElementById("countABSENT").textContent = count("ABSENT");
}

// ==========================
// UI EVENTS
// ==========================
function setupDateFilters() {
  document.querySelectorAll('[data-date]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[data-date]').forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      dateFilter = btn.dataset.date;
      applyFilters();
    });
  });
}

function setupStatusFilters() {
  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[data-status]').forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      statusFilter = btn.dataset.status;
      applyFilters();
    });
  });
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    searchText = input.value.trim();
    applyFilters();
  });
}

// ==========================
// EXPORT
// ==========================
function setupExport() {
  document.getElementById("btnExportCSV").onclick = () => exportCSV();
  document.getElementById("btnExportXLSX").onclick = () => exportXLSX();
}

function exportCSV() {
  const header = ["เวลา", "วิชา", "ห้อง", "สถานะ", "ครู"];
  const rows = filteredRows.map(r => [
    r.time, r.subject, r.room, r.status, r.teacher
  ]);

  const csv = [header, ...rows]
    .map(r => r.map(v => `"${v || ""}"`).join(","))
    .join("\n");

  download(csv, "history.csv", "text/csv");
}

function exportXLSX() {
  const ws = XLSX.utils.json_to_sheet(
    filteredRows.map(r => ({
      เวลา: r.time,
      วิชา: r.subject,
      ห้อง: r.room,
      สถานะ: r.status,
      ครู: r.teacher
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "History");
  XLSX.writeFile(wb, "history.xlsx");
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
