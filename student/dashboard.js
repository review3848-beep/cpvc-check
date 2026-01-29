// student/dashboard.js
import { callApi, getStudentSession, clearAllSession } from "../api.js";

/* ================= DOM ================= */
const nameEl = document.getElementById("studentName");
const idEl   = document.getElementById("studentId");

const msgEl  = document.getElementById("msg");

const totalEl = document.getElementById("totalSessions");
const okEl    = document.getElementById("attendedCount");
const lateEl  = document.getElementById("lateCount");
const absEl   = document.getElementById("absentCount");

const tbodyEl = document.getElementById("recentAttendance");
const chartCanvas = document.getElementById("attendanceChart");

const logoutBtn  = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

/* ================= STATE ================= */
let student = null;
let chartInstance = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  student = guardStudent();
  if (!student) return;

  hydrateHeader(student);

  logoutBtn?.addEventListener("click", logoutStudent);
  refreshBtn?.addEventListener("click", () => loadDashboard(false));

  await loadDashboard(false);

  // ✅ auto refresh ทุก 20 วิ (ให้ dashboard “ไม่เน่า”)
  setInterval(() => loadDashboard(true), 20000);
});

/* ================= AUTH ================= */
function guardStudent(){
  const s = getStudentSession(); // key: cpvc_student (ตาม api.js)
  if(!s || !s.studentId){
    clearAllSession();
    location.href = "login.html";
    return null;
  }
  return s;
}

function hydrateHeader(s){
  const name = s.name || "STUDENT";
  const sid  = s.studentId || "-";
  if(nameEl) nameEl.textContent = name;
  if(idEl)   idEl.textContent = `🆔 ${sid}`;
}

function logoutStudent(){
  clearAllSession();
  location.href = "login.html";
}

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard(silent=true){
  const studentId = String(student?.studentId || "").trim();
  if(!studentId) return;

  if(!silent) setMsg("กำลังโหลดข้อมูล...", "info");

  try{
    const res = await callApi("studentGetDashboard", { studentId });

    if(!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    if(!silent) setMsg("", "clear");

    const stats = res.stats || {};
    const recent = res.recent || [];

    renderStats(stats);
    renderRecent(recent);
    renderChart(stats);

  }catch(err){
    if(!silent) setMsg("❌ " + (err.message || err), "error");
  }
}

/* ================= RENDER ================= */
function renderStats(stats){
  const total = n(stats.total ?? 0);
  const ok    = n(stats.ok ?? 0);
  const late  = n(stats.late ?? 0);
  const abs   = n(stats.absent ?? 0);

  totalEl.textContent = total;
  okEl.textContent    = ok;
  lateEl.textContent  = late;
  absEl.textContent   = abs;
}

function renderRecent(rows){
  if(!Array.isArray(rows) || rows.length === 0){
    tbodyEl.innerHTML = `<tr><td colspan="3" class="empty">ยังไม่มีประวัติ</td></tr>`;
    return;
  }

  // GAS: recent = [{ time, subject, token, status, teacher }]
  const safe = rows.slice(0,10).map(r => ({
    time: r.time || "-",
    subject: r.subject || "-",
    status: String(r.status || "-").toUpperCase()
  }));

  tbodyEl.innerHTML = safe.map(x => `
    <tr>
      <td>${esc(x.time)}</td>
      <td>${esc(x.subject)}</td>
      <td>${statusBadgeHtml(x.status)}</td>
    </tr>
  `).join("");
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
      datasets: [{ data: [ok, late, abs], borderWidth: 0 }]
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
