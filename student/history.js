// student/history.js
import { callApi } from "../js/api.js";

/* =========================
   DOM
========================= */
const nameEl = document.getElementById("studentNameDisplay");
const idEl   = document.getElementById("studentIdDisplay");

const tbody  = document.getElementById("historyBody");
const msgEl  = document.getElementById("historyMsg");

const searchInput = document.getElementById("searchInput");

const btnExportCSV  = document.getElementById("btnExportCSV");
const btnExportXLSX = document.getElementById("btnExportXLSX");

const dateBtns   = document.querySelectorAll('[data-date]');
const statusBtns = document.querySelectorAll('[data-status]');

const countAll    = document.getElementById("countAll");
const countOK     = document.getElementById("countOK");
const countLATE   = document.getElementById("countLATE");
const countABSENT = document.getElementById("countABSENT");

/* =========================
   STATE
========================= */
let rawData = [];
let viewData = [];

let activeDate   = "ALL";   // ALL | TODAY | WEEK
let activeStatus = "ALL";   // ALL | OK | LATE | ABSENT

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

  bindEvents();
  await loadHistory(student.studentId);
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
async function loadHistory(studentId){
  setMsg("กำลังโหลดข้อมูล...");
  try{
    const res = await callApi("studentGetHistory", { studentId });

    if (!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    rawData = res.records || [];
    applyFilters();

    setMsg(`โหลดข้อมูลทั้งหมด ${rawData.length} รายการ`);
  }catch(err){
    rawData = [];
    applyFilters();
    setMsg("❌ " + err.message);
  }
}

/* =========================
   FILTERS
========================= */
function bindEvents(){
  // date filter
  dateBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      dateBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      activeDate = btn.dataset.date;
      applyFilters();
    });
  });

  // status filter
  statusBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      statusBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      activeStatus = btn.dataset.status;
      applyFilters();
    });
  });

  // search
  searchInput.addEventListener("input", ()=>{
    applyFilters();
  });

  // export
  btnExportCSV.addEventListener("click", exportCSV);
  btnExportXLSX.addEventListener("click", exportXLSX);
}

function applyFilters(){
  const keyword = searchInput.value.trim().toLowerCase();
  const now = new Date();

  viewData = rawData.filter(r=>{
    // ---- date ----
    if (activeDate !== "ALL"){
      const d = new Date(r.time);
      if (activeDate === "TODAY"){
        if (!isSameDay(d, now)) return false;
      }
      if (activeDate === "WEEK"){
        if (!isSameWeek(d, now)) return false;
      }
    }

    // ---- status ----
    if (activeStatus !== "ALL"){
      if ((r.status || "").toUpperCase() !== activeStatus) return false;
    }

    // ---- search ----
    if (keyword){
      const hay = `
        ${r.subject || ""}
        ${r.teacher || ""}
        ${r.room || ""}
      `.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }

    return true;
  });

  updateBadges();
  renderTable();
}

/* =========================
   TABLE
========================= */
function renderTable(){
  tbody.innerHTML = "";

  if (!viewData.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td>
      </tr>
    `;
    return;
  }

  viewData.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="time-col">${fmtTime(r.time)}</td>
      <td>${safe(r.subject)}</td>
      <td>${safe(r.room)}</td>
      <td class="${statusClass(r.status)}">${safe(r.status)}</td>
      <td>${safe(r.teacher)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   BADGES
========================= */
function updateBadges(){
  const total = viewData.length;
  const ok    = viewData.filter(r=>r.status==="OK").length;
  const late  = viewData.filter(r=>r.status==="LATE").length;
  const abs   = viewData.filter(r=>r.status==="ABSENT").length;

  countAll.textContent    = total;
  countOK.textContent     = ok;
  countLATE.textContent   = late;
  countABSENT.textContent = abs;
}

/* =========================
   EXPORT
========================= */
function exportCSV(){
  if (!viewData.length) return;

  const header = ["เวลา","วิชา","ห้อง","สถานะ","ครู"];
  const rows = viewData.map(r=>[
    fmtTime(r.time),
    r.subject || "",
    r.room || "",
    r.status || "",
    r.teacher || ""
  ]);

  const csv = [header, ...rows]
    .map(r=>r.map(v=>`"${v}"`).join(","))
    .join("\n");

  downloadFile(csv, "history.csv", "text/csv");
}

function exportXLSX(){
  if (!viewData.length) return;

  const rows = viewData.map(r=>({
    เวลา: fmtTime(r.time),
    วิชา: r.subject || "",
    ห้อง: r.room || "",
    สถานะ: r.status || "",
    ครู: r.teacher || ""
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "History");
  XLSX.writeFile(wb, "history.xlsx");
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

function statusClass(s){
  s = (s || "").toUpperCase();
  if (s === "OK") return "status-ok";
  if (s === "LATE") return "status-late";
  if (s === "ABSENT") return "status-absent";
  return "";
}

function isSameDay(a,b){
  return a.toDateString() === b.toDateString();
}

function isSameWeek(a,b){
  const start = new Date(b);
  start.setDate(b.getDate() - b.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return a >= start && a <= end;
}

function safe(v){
  return v ?? "-";
}

function setMsg(t){
  msgEl.textContent = t || "";
}

function downloadFile(content, filename, type){
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
