import { callApi } from "../api.js"; // ถ้า api.js อยู่ root
// ถ้า api.js อยู่ใน /js ให้ใช้: import { callApi } from "../js/api.js";

const statStudents = document.getElementById("statStudents");
const statTeachers = document.getElementById("statTeachers");
const statSessions = document.getElementById("statSessions");

const tableTitle = document.getElementById("tableTitle");
const tableWrap  = document.getElementById("tableWrap");
const exportBtn  = document.getElementById("exportBtn");
const logoutBtn  = document.getElementById("logoutBtn");

let currentTab = null;
let currentData = [];

function guardAdmin(){
  const admin = localStorage.getItem("admin");
  if(!admin) location.href = "login.html";
}

function setLoading(){
  tableWrap.innerHTML = `<div style="opacity:.7;padding:14px">กำลังโหลดข้อมูล...</div>`;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function renderTable(data){
  if(!data || data.length===0){
    tableWrap.innerHTML = `<div style="opacity:.7;padding:14px">ไม่มีข้อมูล</div>`;
    return;
  }

  const cols = Object.keys(data[0]);

  const thead = `<tr>${cols.map(c=>`<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
  const tbody = data.map(row => {
    return `<tr>${cols.map(c=>`<td>${escapeHtml(row[c])}</td>`).join("")}</tr>`;
  }).join("");

  tableWrap.innerHTML = `
    <div style="overflow:auto">
      <table class="data-table">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;
}

async function loadStats(){
  const r = await callApi("adminStats");
  if(!r.success) return;

  statStudents.textContent = r.students ?? "-";
  statTeachers.textContent = r.teachers ?? "-";
  const s = r.sessions ?? "-";
  const o = r.openSessions ?? 0;
  statSessions.textContent = `${s} (${o} เปิดอยู่)`;
}

async function loadTab(tab){
  currentTab = tab;
  setLoading();
  exportBtn.disabled = true;

  let action = "";
  let title = "";
  if(tab==="students"){ action="adminStudents"; title="นักเรียน"; }
  if(tab==="teachers"){ action="adminTeachers"; title="ครู"; }
  if(tab==="sessions"){ action="adminSessions"; title="คาบเรียน"; }

  tableTitle.textContent = `ตาราง: ${title}`;

  const r = await callApi(action);
  if(!r.success){
    tableWrap.innerHTML = `<div style="color:#ffb4b4;padding:14px">${escapeHtml(r.message||"โหลดข้อมูลไม่สำเร็จ")}</div>`;
    return;
  }

  currentData = r.data || [];
  renderTable(currentData);
  exportBtn.disabled = currentData.length===0;
}

function toCSV(rows){
  if(!rows || !rows.length) return "";
  const cols = Object.keys(rows[0]);

  const esc = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;
  const head = cols.map(esc).join(",");
  const body = rows.map(r => cols.map(c=>esc(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}

function downloadCSV(){
  const csv = toCSV(currentData);
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentTab||"data"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function bindTabs(){
  document.querySelectorAll("[data-tab]").forEach(btn=>{
    btn.addEventListener("click", ()=> loadTab(btn.dataset.tab));
  });
}

function bindActions(){
  exportBtn.addEventListener("click", downloadCSV);
  logoutBtn?.addEventListener("click", ()=>{
    localStorage.removeItem("admin");
    location.href = "login.html";
  });
}

(async function init(){
  guardAdmin();
  bindTabs();
  bindActions();
  await loadStats();
})();
