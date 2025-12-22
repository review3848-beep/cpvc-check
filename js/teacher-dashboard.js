// teacher-dashboard.js
import { callApi } from "../js/api.js";

const modal = document.getElementById("closeModal");
const btnConfirm = document.getElementById("btnConfirm");
const btnCancel = document.getElementById("btnCancel");
const modalText = document.getElementById("closeModalText");

let currentSessionId = null;
let currentButton = null;

function openCloseModal(sessionId, btn) {
  currentSessionId = sessionId;
  currentButton = btn;
  modalText.textContent = "ยืนยันการปิดคาบนี้?";
  modal.classList.remove("hidden");
}

btnCancel.onclick = () => {
  modal.classList.add("hidden");
};

btnConfirm.onclick = async () => {
  btnConfirm.classList.add("loading");
  btnConfirm.textContent = "กำลังปิดคาบ...";

  const res = await callApi("teacherCloseSession", {
    sessionId: currentSessionId
  });

  btnConfirm.classList.remove("loading");
  btnConfirm.textContent = "ยืนยันปิดคาบ";
  modal.classList.add("hidden");

  if (!res.success) {
    alert(res.message || "ปิดคาบไม่สำเร็จ");
    return;
  }

  // โหลดใหม่ + ได้สรุป OK/LATE/ABSENT อัตโนมัติ
  await loadDashboard(true);
};


/* ================= CONFIG ================= */
const REFRESH_INTERVAL = 5000;

/* ================= DOM ================= */
const nameEl   = document.getElementById("teacherName");
const emailEl  = document.getElementById("teacherEmail");

const totalSessionsEl   = document.getElementById("totalSessions");
const openSessionsEl    = document.getElementById("openSessions");
const totalAttendEl     = document.getElementById("totalAttendance");

const exportAllBtn      = document.getElementById("exportAllBtn");

const subjectFilterEl   = document.getElementById("subjectFilter");
const subjectChipsEl    = document.getElementById("subjectSummaryChips");
const tableBody         = document.getElementById("sessionTable");

const msgEl             = document.getElementById("msg");

/* modal */
const modalBackdrop     = document.getElementById("sessionModal");
const modalCloseBtn     = document.getElementById("modalCloseBtn");
const modalTitleEl      = document.getElementById("modalTitle");
const modalSubtitleEl   = document.getElementById("modalSubtitle");
const modalStatsEl      = document.getElementById("modalStats");
const modalTableBody    = document.getElementById("modalTableBody");
const modalFooterInfo   = document.getElementById("modalFooterInfo");
const exportSessionBtn  = document.getElementById("exportSessionBtn");

/* ================= STATE ================= */
let teacher = null;
let allSessions = [];
let lastSnapshot = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  teacher = getTeacherSession();
  if (!teacher) {
    location.href = "login.html";
    return;
  }

  nameEl.textContent  = teacher.name  || "-";
  emailEl.textContent = teacher.email || "-";

  exportAllBtn.addEventListener("click", exportAllCSV);
  subjectFilterEl.addEventListener("change", renderTable);
  modalCloseBtn.addEventListener("click", closeModal);

  await loadDashboard(true);
  setInterval(() => loadDashboard(false), REFRESH_INTERVAL);
}

/* ================= SESSION ================= */
function getTeacherSession() {
  try {
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  } catch {
    return null;
  }
}

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard(force) {
  const res = await callApi("teacherGetDashboard", {});
  if (!res.success) return;

  const snapshot = JSON.stringify(res);
  if (!force && snapshot === lastSnapshot) return;
  lastSnapshot = snapshot;

  totalSessionsEl.textContent = res.stats.totalSessions ?? 0;
  openSessionsEl.textContent  = res.stats.openSessions ?? 0;
  totalAttendEl.textContent   = res.stats.totalAttendance ?? 0;

  allSessions = res.sessions || [];

  buildSubjectFilter(allSessions);
  renderSubjectChips(allSessions);
  renderTable(allSessions);
}

/* ================= SUBJECT FILTER ================= */
function buildSubjectFilter(sessions) {
  const subjects = [...new Set(sessions.map(s => s.subject).filter(Boolean))];
  subjectFilterEl.innerHTML = `<option value="">ทั้งหมด</option>`;
  subjects.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subjectFilterEl.appendChild(opt);
  });
}

function renderSubjectChips(sessions) {
  subjectChipsEl.innerHTML = "";
  const map = {};
  sessions.forEach(s => {
    if (!map[s.subject]) map[s.subject] = 0;
    map[s.subject]++;
  });

  Object.entries(map).forEach(([sub, count]) => {
    const div = document.createElement("div");
    div.className = "chip";
    div.innerHTML = `${sub} <span class="highlight">${count}</span>`;
    subjectChipsEl.appendChild(div);
  });
}

/* ================= TABLE ================= */
function renderTable(sessions = []) {
  tableBody.innerHTML = "";

  if (!sessions.length) {
    tableBody.innerHTML =
      `<tr><td colspan="5" class="empty">ยังไม่มีข้อมูลคาบเรียน</td></tr>`;
    return;
  }

  sessions.forEach(s => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="session-subject">${s.subject || "-"}</div>
        <div class="session-room">${s.room || "-"}</div>
      </td>
      <td>${s.token || "-"}</td>
      <td>${formatDate(s.startTime)}</td>
      <td>${renderStatus(s.status)}</td>
      <td>
        ${
          s.status === "OPEN"
            ? `<button class="btn-close" data-id="${s.sessionId}">ปิดคาบ</button>`
            : "-"
        }
      </td>
    `;

    tableBody.appendChild(tr);
  });

  bindCloseButtons();
}
function bindCloseButtons() {
  document.querySelectorAll(".btn-close").forEach(btn => {
    btn.addEventListener("click", () => {
      openCloseModal(btn.dataset.id, btn);
    });
  });
}



function renderStatus(status) {
  if (status === "OPEN")
    return `<span class="status-pill status-open">OPEN</span>`;
  if (status === "CLOSED")
    return `<span class="status-pill status-closed">CLOSED</span>`;
  return "-";
}

/* ================= MODAL ================= */
window.openSessionDetail = async function (sessionId) {
  modalBackdrop.classList.add("open");
  modalTableBody.innerHTML =
    `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">กำลังโหลด...</td></tr>`;

  const res = await callApi("teacherGetSessionDetail", { sessionId });
  if (!res.success) return;

  modalTitleEl.textContent = res.session.subject;
  modalSubtitleEl.textContent =
    `${res.session.room} • TOKEN ${res.session.token}`;

  modalStatsEl.innerHTML = `
    <span class="badge ok">OK ${res.stats.ok}</span>
    <span class="badge late">LATE ${res.stats.late}</span>
    <span class="badge absent">ABSENT ${res.stats.absent}</span>
  `;

  modalFooterInfo.innerHTML =
    `นักเรียนทั้งหมด ${res.stats.total} คน`;

  modalTableBody.innerHTML = "";
  res.records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.studentId}</td>
      <td>${r.studentName}</td>
      <td>${formatDate(r.time)}</td>
      <td>${r.status}</td>
    `;
    modalTableBody.appendChild(tr);
  });

  exportSessionBtn.onclick = () =>
    exportSessionCSV(sessionId);
};

function closeModal() {
  modalBackdrop.classList.remove("open");
}

/* ================= EXPORT ================= */
function exportAllCSV() {
  window.location.href = `${API_BASE}?action=teacherExportAll&token=${teacher.token}`;
}

function exportSessionCSV(sessionId) {
  window.location.href =
    `${API_BASE}?action=teacherExportSession&sessionId=${sessionId}`;
}

/* ================= HELPERS ================= */
function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("th-TH");
}

async function exportSession(sessionId) {
  alert("Export คาบ: " + sessionId);
}

async function closeSession(sessionId) {
  const modal = document.getElementById("closeModal");
  const btnConfirm = document.getElementById("btnConfirm");
  const btnCancel  = document.getElementById("btnCancel");

  // เก็บ sessionId ไว้ใช้
  modal.dataset.sessionId = sessionId;

  modal.classList.remove("hidden");

  btnCancel.onclick = () => {
    modal.classList.add("hidden");
  };

  btnConfirm.onclick = async () => {
    btnConfirm.disabled = true;
    btnConfirm.textContent = "กำลังปิดคาบ...";

    const res = await callApi("teacherCloseSession", {
      sessionId: modal.dataset.sessionId
    });

    btnConfirm.disabled = false;
    btnConfirm.textContent = "ยืนยันปิดคาบ";
    modal.classList.add("hidden");

    if (!res.success) {
      alert(res.message || "ปิดคาบไม่สำเร็จ");
      return;
    }

    await loadDashboard(true);
  };
}
