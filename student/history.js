import { callApi } from "../api.js";

/* ================= DOM ================= */

const nameEl = document.getElementById("studentNameDisplay");
const idEl   = document.getElementById("studentIdDisplay");

const tbody  = document.getElementById("historyBody");
const msgEl  = document.getElementById("historyMsg");

const searchInput = document.getElementById("searchInput");

const btnExportCSV  = document.getElementById("btnExportCSV");
const btnExportXLSX = document.getElementById("btnExportXLSX");

const countAll    = document.getElementById("countAll");
const countOK     = document.getElementById("countOK");
const countLATE   = document.getElementById("countLATE");
const countABSENT = document.getElementById("countABSENT");

const dateBtns   = [...document.querySelectorAll("[data-date]")];
const statusBtns = [...document.querySelectorAll("[data-status]")];

/* ================= STATE ================= */

let allRows = [];

let currentDateFilter   = "ALL";
let currentStatusFilter = "ALL";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", init);

async function init(){

  const session = getStudentSession();
  if(!session){
    setMsg("ยังไม่ได้เข้าสู่ระบบ");
    return;
  }

  hydrateHeader(session);

  wireFilterButtons();
  wireSearch();
  wireExport();

  await loadHistory(session.studentId);
}

/* ================= SESSION ================= */

function getStudentSession(){

  const raw =
    localStorage.getItem("studentSession") ||
    localStorage.getItem("cpvc_student") ||
    localStorage.getItem("student") ||
    "";

  if(!raw) return null;

  try{
    const s = JSON.parse(raw);

    if(s.student){
      return {
        studentId: s.student.studentId || s.student.id || s.student.code,
        name: s.student.name || s.student.studentName
      };
    }

    return {
      studentId: s.studentId || s.id || s.code,
      name: s.name || s.studentName
    };

  }catch{
    return null;
  }
}

/* ================= UI ================= */

function hydrateHeader(s){
  if(nameEl) nameEl.textContent = s.name || "-";
  if(idEl)   idEl.textContent   = s.studentId || "-";
}

function setMsg(t){
  if(msgEl) msgEl.textContent = t || "";
}

/* ================= LOAD ================= */

async function loadHistory(studentId){

  try{
    setMsg("กำลังโหลดข้อมูล...");

    // 👉 action ฝั่ง GAS
    const res = await callApi("studentGetHistory", { studentId });

    if(!res || res.success !== true){
      throw new Error(res?.message || "โหลดไม่สำเร็จ");
    }

    allRows =
      res.rows ||
      res.data?.rows ||
      res.history ||
      res.data?.history ||
      [];

    updateCounters();
    render();

    setMsg("");

  }catch(err){
    setMsg("โหลดข้อมูลไม่ได้");
    console.error(err);
  }
}

/* ================= FILTER / SEARCH ================= */

function wireFilterButtons(){

  dateBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      dateBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentDateFilter = btn.dataset.date;
      render();
    });
  });

  statusBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      statusBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentStatusFilter = btn.dataset.status;
      render();
    });
  });
}

function wireSearch(){
  if(!searchInput) return;

  searchInput.addEventListener("input", ()=>{
    render();
  });
}

/* ================= EXPORT ================= */

function wireExport(){

  btnExportCSV?.addEventListener("click", ()=>{
    exportCSV(getFilteredRows());
  });

  btnExportXLSX?.addEventListener("click", ()=>{
    exportXLSX(getFilteredRows());
  });
}

/* ================= COUNTERS ================= */

function updateCounters(){

  let ok=0, late=0, absent=0;

  for(const r of allRows){
    const s = String(r.status || "").toUpperCase();
    if(s==="OK") ok++;
    else if(s==="LATE") late++;
    else if(s==="ABSENT") absent++;
  }

  if(countAll)    countAll.textContent    = allRows.length;
  if(countOK)     countOK.textContent     = ok;
  if(countLATE)   countLATE.textContent   = late;
  if(countABSENT) countABSENT.textContent = absent;
}

/* ================= RENDER ================= */

function render(){

  const rows = getFilteredRows();

  tbody.innerHTML = "";

  if(!rows.length){
    tbody.innerHTML =
      `<tr><td colspan="5" class="empty">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  for(const r of rows){

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="time-col">${fmtTime(r.time || r.datetime || r.ts)}</td>
      <td>${safe(r.subject || "-")}</td>
      <td>${safe(r.room || "-")}</td>
      <td>${statusHTML(r.status)}</td>
      <td>${safe(r.teacher || r.teacherName || "-")}</td>
    `;

    tbody.appendChild(tr);
  }
}

function getFilteredRows(){

  const q = (searchInput?.value || "").trim().toLowerCase();

  return allRows.filter(r=>{

    /* status */
    if(currentStatusFilter !== "ALL"){
      if(String(r.status || "").toUpperCase() !== currentStatusFilter){
        return false;
      }
    }

    /* date */
    if(currentDateFilter !== "ALL"){
      if(!matchDateFilter(r.time || r.datetime || r.ts)){
        return false;
      }
    }

    /* search */
    if(q){
      const text = `
        ${r.subject||""}
        ${r.room||""}
        ${r.teacher||""}
        ${r.teacherName||""}
      `.toLowerCase();

      if(!text.includes(q)) return false;
    }

    return true;
  });
}

/* ================= DATE FILTER ================= */

function matchDateFilter(value){

  if(!value) return false;

  const d = new Date(value);
  if(isNaN(d)) return false;

  const now = new Date();

  if(currentDateFilter === "TODAY"){
    return sameDay(d, now);
  }

  if(currentDateFilter === "WEEK"){
    const start = startOfWeek(now);
    const end   = new Date(start);
    end.setDate(start.getDate()+7);
    return d >= start && d < end;
  }

  return true;
}

function sameDay(a,b){
  return a.getFullYear()===b.getFullYear()
      && a.getMonth()===b.getMonth()
      && a.getDate()===b.getDate();
}

function startOfWeek(d){
  const x = new Date(d);
  const day = x.getDay() || 7; // monday first
  if(day!==1) x.setDate(x.getDate()-day+1);
  x.setHours(0,0,0,0);
  return x;
}

/* ================= EXPORT ================= */

function exportCSV(rows){

  if(!rows.length) return;

  const head = ["เวลา","วิชา","ห้อง","สถานะ","ครูผู้สอน"];

  const data = rows.map(r=>[
    fmtTime(r.time || r.datetime || r.ts),
    r.subject || "",
    r.room || "",
    thStatus(r.status),
    r.teacher || r.teacherName || ""
  ]);

  const csv = [head, ...data]
    .map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);

  download(url,"attendance-history.csv");
}

function exportXLSX(rows){

  if(!rows.length) return;

  const data = rows.map(r=>({
    เวลา: fmtTime(r.time || r.datetime || r.ts),
    วิชา: r.subject || "",
    ห้อง: r.room || "",
    สถานะ: thStatus(r.status),
    ครูผู้สอน: r.teacher || r.teacherName || ""
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "History");

  XLSX.writeFile(wb,"attendance-history.xlsx");
}

/* ================= HELPERS ================= */

function download(url,filename){
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fmtTime(v){

  if(!v) return "-";

  const d = new Date(v);
  if(isNaN(d)) return safe(v);

  const dd = String(d.getDate()).padStart(2,"0");
  const mo = String(d.getMonth()+1).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");

  return `${dd}/${mo} ${hh}:${mm}`;
}

function thStatus(s){

  const x = String(s||"").toUpperCase();

  if(x==="OK") return "มาเรียน";
  if(x==="LATE") return "สาย";
  if(x==="ABSENT") return "ขาด";
  if(x==="DUPLICATE") return "เช็คแล้ว";

  return s || "-";
}

function statusHTML(s){

  const x = String(s||"").toUpperCase();

  if(x==="OK")      return `<span class="status-ok">OK</span>`;
  if(x==="LATE")    return `<span class="status-late">LATE</span>`;
  if(x==="ABSENT")  return `<span class="status-absent">ABSENT</span>`;

  return safe(s||"-");
}

function safe(t){
  return String(t||"").replace(/[<>]/g,"");
}
