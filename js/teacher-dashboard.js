// js/teacher-dashboard.js
import { callApi } from "./api.js";

/* ================= DOM ================= */
const nameEl   = document.getElementById("teacherName");
const emailEl  = document.getElementById("teacherEmail");

const totalSessionsEl   = document.getElementById("totalSessions");
const openSessionsEl   = document.getElementById("openSessions");
const totalAttendEl    = document.getElementById("totalAttendance");

const tableBody = document.getElementById("sessionTable");
const msgEl     = document.getElementById("msg");

const subjectFilter = document.getElementById("subjectFilter");
const subjectChips  = document.getElementById("subjectSummaryChips");

const exportAllBtn = document.getElementById("exportAllBtn");

/* MODAL */
const modalBackdrop   = document.getElementById("sessionModal");
const modalTitle      = document.getElementById("modalTitle");
const modalSubtitle   = document.getElementById("modalSubtitle");
const modalStats      = document.getElementById("modalStats");
const modalTableBody  = document.getElementById("modalTableBody");
const modalFooterInfo = document.getElementById("modalFooterInfo");
const modalCloseBtn   = document.getElementById("modalCloseBtn");
const exportSessionBtn= document.getElementById("exportSessionBtn");

/* ================= STATE ================= */
let sessions = [];
let attendMap = {}; // sessionId -> attendance[]
let activeSessionId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const teacher = getTeacherSession();
  if (!teacher){
    location.href = "login.html";
    return;
  }

  nameEl.textContent  = teacher.name || "-";
  emailEl.textContent = teacher.email || "-";

  bindEvents();
  await loadDashboard();
}

/* ================= SESSION ================= */
function getTeacherSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  }catch(e){
    return null;
  }
}

/* ================= LOAD ================= */
async function loadDashboard(){
  setMsg("");
  try{
    const res = await callApi("teacherGetDashboard", {});
    if (!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    sessions  = res.sessions || [];
    attendMap = res.attendanceMap || {};

    renderStats(res.stats || {});
    buildSubjectFilter();
    renderSubjectChips();
    renderTable();

  }catch(err){
    setMsg("❌ " + err.message);
  }
}

/* ================= RENDER ================= */
function renderStats(stats){
  totalSessionsEl.textContent = stats.totalSessions || sessions.length || 0;
  openSessionsEl.textContent  = stats.openSessions || sessions.filter(s=>s.status==="OPEN").length || 0;
  totalAttendEl.textContent   = stats.totalAttendance || 0;
}

function renderTable(){
  tableBody.innerHTML = "";

  const subject = subjectFilter.value;
  const rows = subject
    ? sessions.filter(s=>s.subject === subject)
    : sessions;

  if (!rows.length){
    tableBody.innerHTML = `<tr><td colspan="5" class="empty">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  rows.forEach(s=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="session-subject">${s.subject}</div>
        <div class="session-room">${s.room || "-"}</div>
      </td>
      <td><strong>${s.token}</strong></td>
      <td>${fmtTime(s.startTime)}</td>
      <td>
        <span class="status-pill ${s.status==="OPEN"?"status-open":"status-closed"}">
          ${s.status}
        </span>
      </td>
      <td>
        <button class="btn-small" data-id="${s.sessionId}">ดูรายละเอียด</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll(".btn-small").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      openSessionModal(btn.dataset.id);
    });
  });
}

function buildSubjectFilter(){
  const subjects = [...new Set(sessions.map(s=>s.subject))];
  subjectFilter.innerHTML = `<option value="">ทั้งหมด</option>`;
  subjects.forEach(sub=>{
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subjectFilter.appendChild(opt);
  });
}

function renderSubjectChips(){
  subjectChips.innerHTML = "";
  const map = {};
  sessions.forEach(s=>{
    map[s.subject] = (map[s.subject] || 0) + 1;
  });

  Object.entries(map).forEach(([sub,count])=>{
    const div = document.createElement("div");
    div.className = "chip";
    div.innerHTML = `${sub} <span class="highlight">${count}</span>`;
    subjectChips.appendChild(div);
  });
}

/* ================= MODAL ================= */
async function openSessionModal(sessionId){
  activeSessionId = sessionId;
  modalBackdrop.classList.add("open");

  const session = sessions.find(s=>s.sessionId === sessionId);
  modalTitle.textContent = session.subject;
  modalSubtitle.textContent = `TOKEN ${session.token} · ${fmtTime(session.startTime)}`;

  modalTableBody.innerHTML =
    `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">กำลังโหลด...</td></tr>`;

  try{
    const res = await callApi("teacherGetSessionDetail", { sessionId });
    if (!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลคาบไม่สำเร็จ");
    }

    renderModalStats(res.stats || {});
    renderModalTable(res.records || []);

  }catch(err){
    modalTableBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;color:#f87171;">${err.message}</td></tr>`;
  }
}

function renderModalStats(stats){
  modalStats.innerHTML = "";
  modalFooterInfo.innerHTML = "";

  const items = [
    { k:"OK",     v: stats.ok || 0,     c:"ok" },
    { k:"LATE",   v: stats.late || 0,   c:"late" },
    { k:"ABSENT", v: stats.absent || 0, c:"absent" }
  ];

  items.forEach(i=>{
    const b = document.createElement("div");
    b.className = `badge ${i.c}`;
    b.textContent = `${i.k}: ${i.v}`;
    modalStats.appendChild(b);
  });

  modalFooterInfo.innerHTML =
    `<div class="badge">รวม ${stats.total || 0} คน</div>`;
}

function renderModalTable(rows){
  modalTableBody.innerHTML = "";

  if (!rows.length){
    modalTableBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">ไม่มีข้อมูล</td></tr>`;
    return;
  }

  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.studentId}</td>
      <td>${r.name}</td>
      <td>${fmtTime(r.time)}</td>
      <td>${r.status}</td>
    `;
    modalTableBody.appendChild(tr);
  });
}

/* ================= EXPORT ================= */
exportAllBtn.addEventListener("click", async ()=>{
  try{
    const res = await callApi("teacherExportAll", {});
    if (!res || !res.success){
      throw new Error("Export ไม่สำเร็จ");
    }
    downloadCSV(res.csv, "attendance_all.csv");
  }catch(err){
    alert(err.message);
  }
});

exportSessionBtn.addEventListener("click", async ()=>{
  if (!activeSessionId) return;
  try{
    const res = await callApi("teacherExportSession", {
      sessionId: activeSessionId
    });
    if (!res || !res.success){
      throw new Error("Export คาบไม่สำเร็จ");
    }
    downloadCSV(res.csv, "attendance_session.csv");
  }catch(err){
    alert(err.message);
  }
});

/* ================= EVENTS ================= */
subjectFilter.addEventListener("change", renderTable);
modalCloseBtn.addEventListener("click", ()=> modalBackdrop.classList.remove("open"));
modalBackdrop.addEventListener("click", e=>{
  if (e.target === modalBackdrop){
    modalBackdrop.classList.remove("open");
  }
});

/* ================= HELPERS ================= */
function fmtTime(ts){
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString("th-TH", {
    dateStyle:"short",
    timeStyle:"short"
  });
}

function setMsg(t){
  msgEl.textContent = t || "";
}

function downloadCSV(csv, filename){
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
