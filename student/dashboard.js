// student/dashboard.js
import { callApi, getStudentSession, clearAllSession } from "../api.js";

/* ================== DOM (ยืดหยุ่น ไม่มีก็ไม่พัง) ================== */
const nameEl   = document.getElementById("studentName") || document.getElementById("studentNameDisplay");
const emailEl  = document.getElementById("studentEmail") || document.getElementById("studentEmailDisplay");
const idEl     = document.getElementById("studentId") || document.getElementById("studentIdDisplay");

const msgEl    = document.getElementById("msg");

/* cards/stats */
const totalSessionsEl = document.getElementById("totalSessions");
const attendedEl      = document.getElementById("attendedCount") || document.getElementById("totalAttendance");
const lateEl          = document.getElementById("lateCount");
const absentEl        = document.getElementById("absentCount");

/* current session */
const statusEl = document.getElementById("sessionStatus");
const tokenEl  = document.getElementById("tokenDisplay") || document.getElementById("token");

/* recent table */
const tbodyEl  = document.getElementById("recentAttendance") || document.getElementById("historyTable") || document.getElementById("sessionTable");

/* chart */
const chartCanvas = document.getElementById("attendanceChart") || document.getElementById("sessionChart");

/* buttons (ถ้ามี) */
const logoutBtn = document.getElementById("logoutBtn");

/* ================== STATE ================== */
let chartInstance = null;

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", async () => {
  const student = guardStudent();   // ✅ ใช้ cpvc_student แล้ว
  if (!student) return;

  hydrateHeader(student);

  logoutBtn?.addEventListener("click", logoutStudent);

  await loadDashboard(student);
});

/* ================== AUTH ================== */
function guardStudent(){
  // ✅ ใช้ helper ที่อ่าน cpvc_student
  const s = getStudentSession();
  if(!s || !(s.studentId || s.id || s.code)){
    clearAllSession();
    location.href = "login.html";
    return null;
  }
  return s;
}

function hydrateHeader(student){
  const name  = student.name || student.fullname || student.displayName || "STUDENT";
  const email = student.email || "-";
  const sid   = student.studentId || student.id || student.code || "";

  if(nameEl)  nameEl.textContent = name;
  if(emailEl) emailEl.textContent = email;
  if(idEl)    idEl.textContent = sid ? `🆔 ${sid}` : "";
}

function logoutStudent(){
  clearAllSession(); // ✅ ลบ cpvc_student ด้วย
  location.href = "login.html";
}

/* ================== LOAD DASHBOARD ================== */
async function loadDashboard(student){
  setMsg("กำลังโหลดข้อมูล...", "info");

  const studentId = (student.studentId || student.id || student.code || "").toString().trim();
  if(!studentId){
    setMsg("ไม่พบ studentId ใน session", "error");
    return;
  }

  // ✅ ฝั่ง GAS ต้องรับ studentId
  const res = await callApi("studentGetDashboard", { studentId });

  if(!res || !res.success){
    setMsg(res?.message || "โหลดข้อมูลไม่สำเร็จ", "error");
    return;
  }

  setMsg("", "clear");

  renderStats(res.stats || {});
  renderCurrentSession(res.currentSession || res.session || null);
  renderRecent(res.recent || res.history || res.rows || []);
  renderChart(res.stats || {});
}

/* ================== RENDER: STATS ================== */
function renderStats(stats){
  const totalSessions = n(stats.totalSessions ?? stats.total ?? 0);
  const attended      = n(stats.attended ?? stats.ok ?? stats.present ?? 0);
  const late          = n(stats.late ?? 0);
  const absent        = n(stats.absent ?? 0);

  if(totalSessionsEl) totalSessionsEl.textContent = totalSessions;
  if(attendedEl)      attendedEl.textContent = attended;
  if(lateEl)          lateEl.textContent = late;
  if(absentEl)        absentEl.textContent = absent;
}

/* ================== RENDER: CURRENT SESSION ================== */
function renderCurrentSession(session){
  if(tokenEl) tokenEl.textContent = session?.token || "-";
  setStatusBadge(statusEl, session?.status);

  const subjectEl = document.getElementById("subjectDisplay");
  const roomEl    = document.getElementById("roomDisplay");
  if(subjectEl) subjectEl.textContent = session?.subject || "-";
  if(roomEl)    roomEl.textContent = session?.room || "-";
}

/* ================== STATUS BADGE ================== */
function setStatusBadge(el, statusRaw){
  if(!el) return;

  const s = String(statusRaw || "").toUpperCase();
  const isOpen = s === "OPEN";
  const isClosed = s === "CLOSED";

  if(isOpen || isClosed){
    el.innerHTML = `
      <span class="status-badge ${isOpen ? "status-open" : "status-closed"}">
        สถานะคาบ: ${isOpen ? "OPEN" : "CLOSED"}
      </span>
    `;
  }else{
    el.innerHTML = `<span class="status-badge">ยังไม่มีคาบที่เปิดอยู่</span>`;
  }
}

/* ================== RENDER: RECENT TABLE ================== */
function renderRecent(rows){
  if(!tbodyEl) return;

  if(!Array.isArray(rows) || rows.length === 0){
    tbodyEl.innerHTML = `<tr><td colspan="6" class="empty">ยังไม่มีประวัติ</td></tr>`;
    return;
  }

  const safe = rows.slice(0, 10).map(r => ({
    date:  r.date || r.createdAt || r.time || r.timestamp || "-",
    subject: r.subject || r.className || r.course || "-",
    room: r.room || r.classroom || "-",
    teacher: r.teacherName || r.teacher || r.owner || "-",
    status: String(r.status || r.attendance || r.result || "-").toUpperCase(),
    token: r.token || ""
  }));

  tbodyEl.innerHTML = safe.map(item => {
    const badge = statusBadgeHtml(item.status);
    const isAdminStyleTable = guessAdminStyleTable();

    if(isAdminStyleTable){
      return `
        <tr>
          <td>${esc(item.subject)}</td>
          <td>${esc(item.room)}</td>
          <td>${esc(item.teacher)}</td>
          <td>${esc(item.token || "-")}</td>
          <td>${badge}</td>
        </tr>
      `;
    }

    return `
      <tr>
        <td>${esc(item.date)}</td>
        <td>${esc(item.subject)}</td>
        <td>${esc(item.room)}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join("");
}

function guessAdminStyleTable(){
  const table = tbodyEl.closest("table");
  const ths = table?.querySelectorAll("thead th");
  if(!ths || ths.length === 0) return false;
  const text = Array.from(ths).map(x => (x.textContent || "").toUpperCase()).join(" | ");
  return text.includes("TOKEN") && ths.length >= 5;
}

function statusBadgeHtml(status){
  const s = String(status || "-").toUpperCase();

  const map = {
    OPEN:   ["status-open", "OPEN"],
    CLOSED: ["status-closed", "CLOSED"],

    OK:     ["status-open", "OK"],
    PRESENT:["status-open", "PRESENT"],
    ATTENDED:["status-open", "ATTENDED"],

    LATE:   ["status-closed", "LATE"],
    ABSENT: ["status-closed", "ABSENT"],
    MISS:   ["status-closed", "ABSENT"]
  };

  const [cls, label] = map[s] || ["status-badge", s];
  if(cls === "status-badge"){
    return `<span class="status-badge">${esc(label)}</span>`;
  }
  return `<span class="status-badge ${cls}">${esc(label)}</span>`;
}

/* ================== CHART ================== */
function renderChart(stats){
  if(!chartCanvas || !window.Chart) return;

  const attended = n(stats.attended ?? stats.ok ?? stats.present ?? 0);
  const late     = n(stats.late ?? 0);
  const absent   = n(stats.absent ?? 0);

  try{ chartInstance?.destroy(); }catch(e){}

  chartInstance = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: ["มาเรียน", "สาย", "ขาด"],
      datasets: [{
        data: [attended, late, absent],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      },
      cutout: "68%"
    }
  });
}

/* ================== UX ================== */
function setMsg(text, type){
  if(!msgEl) return;
  if(type === "clear"){ msgEl.textContent = ""; msgEl.className = ""; return; }

  msgEl.textContent = text || "";
  msgEl.className = type ? `msg-${type}` : "";
}

/* ================== UTIL ================== */
function n(v){
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function esc(s){
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
