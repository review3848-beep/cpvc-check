// student/dashboard.js (พร้อมใช้กับ GAS ของเธอ)
import { callApi, getStudentSession, clearAllSession } from "../api.js";

/* ================= DOM ================= */
const nameEl   = document.getElementById("studentName") || document.getElementById("studentNameDisplay");
const idEl     = document.getElementById("studentId")   || document.getElementById("studentIdDisplay");
const emailEl  = document.getElementById("studentEmail")|| document.getElementById("studentEmailDisplay");

const msgEl    = document.getElementById("msg");

/* stats */
const totalEl  = document.getElementById("totalSessions") || document.getElementById("totalCount");
const okEl     = document.getElementById("attendedCount") || document.getElementById("okCount") || document.getElementById("presentCount");
const lateEl   = document.getElementById("lateCount");
const absEl    = document.getElementById("absentCount");

/* recent table */
const tbodyEl  = document.getElementById("recentAttendance") || document.getElementById("historyTable");

/* chart */
const chartCanvas = document.getElementById("attendanceChart") || document.getElementById("sessionChart");

/* logout */
const logoutBtn = document.getElementById("logoutBtn");

/* ================= STATE ================= */
let chartInstance = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const student = guardStudent();
  if (!student) return;

  hydrateHeader(student);

  logoutBtn?.addEventListener("click", logoutStudent);

  loadDashboard(student);
});

/* ================= AUTH ================= */
function guardStudent(){
  const student = getStudentSession(); // api.js ใช้ key cpvc_student อยู่แล้ว
  if(!student || !student.studentId){
    clearAllSession();
    location.href = "login.html";
    return null;
  }
  return student;
}

function hydrateHeader(student){
  const name = student.name || "STUDENT";
  const sid  = student.studentId || "";
  const email = student.email || "-";

  if(nameEl) nameEl.textContent = name;
  if(idEl)   idEl.textContent = sid ? `🆔 ${sid}` : "";
  if(emailEl) emailEl.textContent = email;
}

function logoutStudent(){
  clearAllSession();
  location.href = "login.html";
}

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard(student){
  setMsg("กำลังโหลดข้อมูล...", "info");

  const studentId = String(student.studentId || "").trim();

  try{
    // ✅ ของ GAS เธอต้องส่ง studentId
    const res = await callApi("studentGetDashboard", { studentId });

    if(!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    setMsg("", "clear");

    renderStats(res.stats || {});
    renderRecent(res.recent || []);
    renderChart(res.stats || {});
  }catch(err){
    setMsg("❌ " + (err.message || err), "error");
  }
}

/* ================= RENDER: STATS ================= */
function renderStats(stats){
  const total = n(stats.total ?? 0);
  const ok    = n(stats.ok ?? 0);
  const late  = n(stats.late ?? 0);
  const abs   = n(stats.absent ?? 0);

  if(totalEl) totalEl.textContent = total;
  if(okEl)    okEl.textContent = ok;
  if(lateEl)  lateEl.textContent = late;
  if(absEl)   absEl.textContent = abs;
}

/* ================= RENDER: RECENT ================= */
function renderRecent(rows){
  if(!tbodyEl) return;

  if(!Array.isArray(rows) || rows.length === 0){
    tbodyEl.innerHTML = `<tr><td colspan="4" class="empty">ยังไม่มีประวัติ</td></tr>`;
    return;
  }

  // GAS: recent = [{ time, subject, token, status, teacher }]
  const safe = rows.slice(0, 10).map(r => ({
    time: r.time || "-",
    subject: r.subject || "-",
    room: r.room || "-",          // เผื่ออนาคตเพิ่ม
    status: String(r.status || "-").toUpperCase(),
    teacher: r.teacher || "-",
    token: r.token || ""
  }));

  // รองรับทั้งตาราง 4 ช่อง (เวลา/วิชา/ห้อง/สถานะ) และ 5 ช่อง
  const colCount = guessColCount();

  tbodyEl.innerHTML = safe.map(x => {
    const badge = statusBadgeHtml(x.status);

    if(colCount >= 5){
      return `
        <tr>
          <td>${esc(x.time)}</td>
          <td>${esc(x.subject)}</td>
          <td>${esc(x.teacher)}</td>
          <td>${esc(x.token || "-")}</td>
          <td>${badge}</td>
        </tr>
      `;
    }

    return `
      <tr>
        <td>${esc(x.time)}</td>
        <td>${esc(x.subject)}</td>
        <td>${esc(x.room)}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join("");
}

function guessColCount(){
  const table = tbodyEl.closest("table");
  const ths = table?.querySelectorAll("thead th");
  if(!ths || ths.length === 0) return 4;
  return ths.length;
}

function statusBadgeHtml(status){
  const s = String(status || "-").toUpperCase();

  const map = {
    OK:     ["status-badge status-open", "มาเรียน"],
    LATE:   ["status-badge status-closed", "สาย"],
    ABSENT: ["status-badge status-closed", "ขาด"],
  };

  const m = map[s];
  if(!m) return `<span class="status-badge">${esc(s)}</span>`;
  return `<span class="${m[0]}">${esc(m[1])}</span>`;
}

/* ================= CHART ================= */
function renderChart(stats){
  if(!chartCanvas || !window.Chart) return;

  const ok   = n(stats.ok ?? 0);
  const late = n(stats.late ?? 0);
  const abs  = n(stats.absent ?? 0);

  try{ chartInstance?.destroy(); }catch{}

  chartInstance = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: ["มาเรียน", "สาย", "ขาด"],
      datasets: [{
        data: [ok, late, abs],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      cutout: "68%"
    }
  });
}

/* ================= UX ================= */
function setMsg(text, type){
  if(!msgEl) return;
  if(type === "clear"){
    msgEl.textContent = "";
    msgEl.className = "";
    return;
  }
  msgEl.textContent = text || "";
  msgEl.className = type ? `msg-${type}` : "";
}

/* ================= UTIL ================= */
function n(v){
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
