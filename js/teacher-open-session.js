// teacher-dashboard.js (REALTIME)
import { callApi } from "../js/api.js";

/* ================= CONFIG ================= */
const REFRESH_INTERVAL = 5000; // 5 วิ (กำลังดี ไม่ถี่ ไม่หน่วง)

/* ================= DOM ================= */
const nameEl   = document.getElementById("teacherName");
const emailEl  = document.getElementById("teacherEmail");

const statTotalEl  = document.getElementById("statTotalSessions");
const statOpenEl   = document.getElementById("statOpenSessions");
const statAttendEl = document.getElementById("statTotalAttendance");

const tableBody = document.getElementById("recentSessionsBody");

/* ================= STATE ================= */
let lastSnapshot = null;
let refreshTimer = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const teacher = getTeacherSession();
  if(!teacher){
    location.href = "login.html";
    return;
  }

  nameEl.textContent  = teacher.name  || "-";
  emailEl.textContent = teacher.email || "-";

  await loadDashboard(true);

  refreshTimer = setInterval(() => {
    loadDashboard(false);
  }, REFRESH_INTERVAL);
}

/* ================= SESSION ================= */
function getTeacherSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  }catch{
    return null;
  }
}

/* ================= LOAD ================= */
async function loadDashboard(force){
  const res = await callApi("teacherGetDashboard", {});
  if(!res.success) return;

  const snapshot = JSON.stringify(res);

  // ถ้าไม่เปลี่ยน ไม่ต้อง render ใหม่ (กันกระพริบ)
  if(!force && snapshot === lastSnapshot) return;
  lastSnapshot = snapshot;

  statTotalEl.textContent  = res.stats.totalSessions ?? 0;
  statOpenEl.textContent   = res.stats.openSessions ?? 0;
  statAttendEl.textContent = res.stats.totalAttendance ?? 0;

  renderTable(res.sessions || []);
}

/* ================= TABLE ================= */
function renderTable(sessions){
  tableBody.innerHTML = "";

  if(sessions.length === 0){
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:.6">
          ยังไม่มีข้อมูลคาบเรียน
        </td>
      </tr>
    `;
    return;
  }

  sessions.forEach(s => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.subject || "-"}</td>
      <td>${s.token || "-"}</td>
      <td>${formatDate(s.startTime)}</td>
      <td>${renderStatus(s.status)}</td>
      <td>
        <button class="btn small" onclick="goDetail('${s.id}')">
          ดูรายละเอียด
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

/* ================= HELPERS ================= */
function renderStatus(status){
  if(status === "OPEN")   return `<span style="color:#22c55e">เปิดอยู่</span>`;
  if(status === "CLOSED") return `<span style="color:#f87171">ปิดแล้ว</span>`;
  return "-";
}

function formatDate(ts){
  if(!ts) return "-";
  return new Date(ts).toLocaleString("th-TH");
}

/* ================= ACTIONS ================= */
window.goDetail = function(id){
  location.href = `session-detail.html?id=${id}`;
};
