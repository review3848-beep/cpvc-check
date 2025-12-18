// js/teacher-session-detail.js
import { callApi } from "./api.js";

/* ================= DOM ================= */
const teacherNameEl  = document.getElementById("teacherName");
const teacherEmailEl = document.getElementById("teacherEmail");

const navTokenEl = document.getElementById("navToken");

const subjectEl   = document.getElementById("sessSubject");
const roomEl      = document.getElementById("sessRoom");
const statusEl    = document.getElementById("sessStatus");
const startTimeEl = document.getElementById("sessStartTime");

const sumTotalEl  = document.getElementById("sumTotal");
const sumOkEl     = document.getElementById("sumOk");
const sumLateEl   = document.getElementById("sumLate");
const sumAbsentEl = document.getElementById("sumAbsent");

const tableBody = document.getElementById("attTable");
const msgEl     = document.getElementById("msg");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const teacher = getTeacherSession();
  if (!teacher){
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent  = teacher.name || "-";
  teacherEmailEl.textContent = teacher.email || "-";

  const sessionId = getSessionIdFromURL();
  if (!sessionId){
    setMsg("❌ ไม่พบ sessionId", "#f87171");
    return;
  }

  await loadSessionDetail(sessionId);
}

/* ================= SESSION ================= */
function getTeacherSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  }catch(e){
    return null;
  }
}

/* ================= URL ================= */
function getSessionIdFromURL(){
  const p = new URLSearchParams(location.search);
  return p.get("sessionId");
}

/* ================= LOAD ================= */
async function loadSessionDetail(sessionId){
  setMsg("");
  tableBody.innerHTML =
    `<tr><td colspan="4" class="empty">กำลังโหลดข้อมูล...</td></tr>`;

  try{
    const res = await callApi("teacherGetSessionDetail", { sessionId });

    if (!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลคาบไม่สำเร็จ");
    }

    renderSummary(res.session, res.stats);
    renderTable(res.records || []);

  }catch(err){
    tableBody.innerHTML =
      `<tr><td colspan="4" class="empty" style="color:#f87171;">${err.message}</td></tr>`;
    setMsg("❌ " + err.message, "#f87171");
  }
}

/* ================= RENDER ================= */
function renderSummary(session, stats){
  subjectEl.textContent   = session.subject || "-";
  roomEl.textContent      = session.room || "-";
  statusEl.textContent    = session.status || "-";
  startTimeEl.textContent = fmtTime(session.startTime);
  navTokenEl.textContent  = session.token || "-";

  sumTotalEl.textContent  = stats.total || 0;
  sumOkEl.textContent     = stats.ok || 0;
  sumLateEl.textContent   = stats.late || 0;
  sumAbsentEl.textContent = stats.absent || 0;
}

function renderTable(rows){
  tableBody.innerHTML = "";

  if (!rows.length){
    tableBody.innerHTML =
      `<tr><td colspan="4" class="empty">ไม่มีข้อมูลการเช็คชื่อ</td></tr>`;
    return;
  }

  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.studentId}</td>
      <td>${r.name || "-"}</td>
      <td>${fmtTime(r.time)}</td>
      <td class="${statusClass(r.status)}">${r.status}</td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ================= HELPERS ================= */
function fmtTime(ts){
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function statusClass(s){
  if (s === "OK") return "status-ok";
  if (s === "LATE") return "status-late";
  if (s === "ABSENT") return "status-absent";
  return "";
}

function setMsg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
