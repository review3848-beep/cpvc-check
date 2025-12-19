// teacher-session-detail.js
import { callApi } from "../js/api.js";

/* ================= PARAM ================= */
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("id");

/* ================= DOM ================= */
const navTokenEl      = document.getElementById("navToken");
const teacherNameEl   = document.getElementById("teacherName");
const teacherEmailEl  = document.getElementById("teacherEmail");

const subjEl          = document.getElementById("sessSubject");
const roomEl          = document.getElementById("sessRoom");
const statusEl        = document.getElementById("sessStatus");
const startTimeEl     = document.getElementById("sessStartTime");

const sumTotalEl      = document.getElementById("sumTotal");
const sumOkEl         = document.getElementById("sumOk");
const sumLateEl       = document.getElementById("sumLate");
const sumAbsentEl     = document.getElementById("sumAbsent");

const tableBody       = document.getElementById("attTable");
const msgEl           = document.getElementById("msg");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  const teacher = getTeacherSession();
  if (!teacher) {
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent  = teacher.name  || "-";
  teacherEmailEl.textContent = teacher.email || "-";

  if (!sessionId) {
    msgEl.textContent = "❌ ไม่พบ sessionId";
    msgEl.style.color = "#f87171";
    tableBody.innerHTML =
      `<tr><td colspan="4" class="empty">ไม่สามารถแสดงข้อมูลได้</td></tr>`;
    return;
  }

  await loadSessionDetail();
}

/* ================= SESSION ================= */
function getTeacherSession() {
  try {
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  } catch {
    return null;
  }
}

/* ================= LOAD DETAIL ================= */
async function loadSessionDetail() {
  tableBody.innerHTML =
    `<tr><td colspan="4" class="empty">กำลังโหลดข้อมูล...</td></tr>`;

  const res = await callApi("teacherGetSessionDetail", { sessionId });

  if (!res.success) {
    msgEl.textContent = res.message || "ไม่สามารถโหลดข้อมูลคาบเรียนได้";
    msgEl.style.color = "#f87171";
    return;
  }

  const s = res.session;

  /* header / summary */
  navTokenEl.textContent = s.token || "-";

  subjEl.textContent      = s.subject || "-";
  roomEl.textContent      = s.room || "-";
  statusEl.textContent    = s.status || "-";
  startTimeEl.textContent = formatDate(s.startTime);

  /* summary counts */
  sumTotalEl.textContent  = res.stats.total ?? 0;
  sumOkEl.textContent     = res.stats.ok ?? 0;
  sumLateEl.textContent   = res.stats.late ?? 0;
  sumAbsentEl.textContent = res.stats.absent ?? 0;

  renderTable(res.records || []);
}

/* ================= TABLE ================= */
function renderTable(records) {
  tableBody.innerHTML = "";

  if (records.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="4" class="empty">ยังไม่มีนักเรียนเช็คชื่อ</td></tr>`;
    return;
  }

  records.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.studentId || "-"}</td>
      <td>${r.studentName || "-"}</td>
      <td>${formatDate(r.time)}</td>
      <td class="${statusClass(r.status)}">${r.status}</td>
    `;

    tableBody.appendChild(tr);
  });
}

/* ================= HELPERS ================= */
function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("th-TH");
}

function statusClass(status) {
  if (status === "OK") return "status-ok";
  if (status === "LATE") return "status-late";
  if (status === "ABSENT") return "status-absent";
  return "";
}
