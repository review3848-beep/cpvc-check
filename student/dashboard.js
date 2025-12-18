// student/dashboard.js
import { callApi } from "../js/api.js";

/* =========================
   DOM
========================= */
const nameEl   = document.getElementById("studentNameDisplay");
const idEl     = document.getElementById("studentIdDisplay");

const totalEl  = document.getElementById("totalRecords");
const okEl     = document.getElementById("okCount");
const lateEl   = document.getElementById("lateCount");
const okPctEl  = document.getElementById("okPercent");
const latePctEl= document.getElementById("latePercent");
const rateEl   = document.getElementById("ratePercent");

const tbody    = document.getElementById("recentTableBody");
const msgEl    = document.getElementById("msg");

let chart; // Chart.js instance

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const student = getStudentSession();
  if (!student){
    location.href = "login.html";
    return;
  }

  nameEl.textContent = student.name || "-";
  idEl.textContent   = student.studentId || "-";

  await loadDashboard(student.studentId);
}

/* =========================
   SESSION
========================= */
function getStudentSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_student"));
  }catch(e){
    return null;
  }
}

/* =========================
   LOAD DATA
========================= */
async function loadDashboard(studentId){
  setMsg("");
  try{
    const res = await callApi("studentGetDashboard", { studentId });

    if (!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    renderStats(res.stats);
    renderTable(res.recent || []);
    renderChart(res.stats);

  }catch(err){
    setMsg("❌ " + err.message);
    renderEmpty();
  }
}

/* =========================
   RENDER STATS
========================= */
function renderStats(stats){
  const total  = stats.total || 0;
  const ok     = stats.ok || 0;
  const late   = stats.late || 0;
  const absent = stats.absent || 0;

  totalEl.textContent = total;
  okEl.textContent    = ok;
  lateEl.textContent  = late;

  okPctEl.textContent   = total ? Math.round(ok / total * 100) + "%" : "0%";
  latePctEl.textContent = total ? Math.round(late / total * 100) + "%" : "0%";

  const rate = total ? Math.round((ok + late) / total * 100) : 0;
  rateEl.textContent = rate + "%";
}

/* =========================
   TABLE
========================= */
function renderTable(rows){
  tbody.innerHTML = "";

  if (!rows.length){
    renderEmpty();
    return;
  }

  rows.slice(0,10).forEach(r=>{
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${fmtTime(r.time)}</td>
      <td>${safe(r.subject)}</td>
      <td>${safe(r.token)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${safe(r.teacher)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderEmpty(){
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="empty">ยังไม่มีข้อมูลการเช็คชื่อ</td>
    </tr>
  `;
}

/* =========================
   CHART
========================= */
function renderChart(stats){
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  const data = [
    stats.ok || 0,
    stats.late || 0,
    stats.absent || 0
  ];

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["OK", "LATE", "ABSENT"],
      datasets: [{
        data,
        backgroundColor: [
          "#4ade80",
          "#fb923c",
          "#fca5a5"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            boxWidth: 12,
            font: { size: 12, weight: "600" }
          }
        }
      }
    }
  });
}

/* =========================
   HELPERS
========================= */
function fmtTime(ts){
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString("th-TH", {
    dateStyle:"short",
    timeStyle:"short"
  });
}

function statusBadge(status){
  const s = (status || "").toUpperCase();
  if (s === "OK")     return `<span style="color:#4ade80;font-weight:700">OK</span>`;
  if (s === "LATE")   return `<span style="color:#fb923c;font-weight:700">LATE</span>`;
  if (s === "ABSENT") return `<span style="color:#fca5a5;font-weight:700">ABSENT</span>`;
  return "-";
}

function safe(v){
  return v ?? "-";
}

function setMsg(t){
  msgEl.textContent = t || "";
}
