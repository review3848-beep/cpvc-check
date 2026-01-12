import { callApi } from "../api.js";


const adminNameEl = document.getElementById("adminName");
const logoutBtn = document.getElementById("logoutBtn");

const stuCount = document.getElementById("stuCount");
const teaCount = document.getElementById("teaCount");
const sessCount = document.getElementById("sessCount");

const btnStudents = document.getElementById("btnStudents");
const btnTeachers = document.getElementById("btnTeachers");
const btnSessions = document.getElementById("btnSessions");

const tableTitle = document.getElementById("tableTitle");
const exportBtn = document.getElementById("exportBtn");
const msgEl = document.getElementById("msg");
const tableEl = document.getElementById("table");

let currentRows = [];
let currentName = "";

init();

function guard(){
  const raw = localStorage.getItem("admin");
  if(!raw){ location.href = "login.html"; return null; }
  try { return JSON.parse(raw); }
  catch { localStorage.removeItem("admin"); location.href="login.html"; return null; }
}

async function callApi(action, payload = {}){
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type":"text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { success:false, message:"API ตอบกลับไม่ถูกต้อง" }; }
}

function setMsg(t=""){ msgEl.textContent = t; }

function setActive(btn){
  [btnStudents, btnTeachers, btnSessions].forEach(b=>b.classList.remove("is-active"));
  if(btn) btn.classList.add("is-active");
}

async function init(){
  const admin = guard();
  if(!admin) return;

  adminNameEl.textContent = admin.name || admin.username || "Admin";

  logoutBtn.addEventListener("click", ()=>{
    localStorage.removeItem("admin");
    location.href = "login.html";
  });

  btnStudents.addEventListener("click", ()=>loadTable("นักเรียน","adminStudents",btnStudents));
  btnTeachers.addEventListener("click", ()=>loadTable("ครู","adminTeachers",btnTeachers));
  btnSessions.addEventListener("click", ()=>loadTable("คาบเรียน","adminSessions",btnSessions));
  exportBtn.addEventListener("click", exportCSV);

  await loadStats();
}

async function loadStats(){
  setMsg("กำลังโหลดสถิติ...");
  const r = await callApi("adminStats");

  if(!r?.success){ setMsg(r?.message || "โหลดสถิติไม่สำเร็จ"); return; }

  stuCount.textContent  = r.data?.students ?? "—";
  teaCount.textContent  = r.data?.teachers ?? "—";
  sessCount.textContent = r.data?.sessions ?? "—";
  setMsg("");
}

async function loadTable(title, action, btn){
  setActive(btn);
  setMsg("กำลังโหลดตาราง...");
  tableTitle.textContent = `ตาราง: ${title}`;
  exportBtn.disabled = true;
  tableEl.innerHTML = "";
  currentRows = [];
  currentName = title;

  const r = await callApi(action);
  if(!r?.success){ setMsg(r?.message || "โหลดตารางไม่สำเร็จ"); return; }

  const rows = r.data || [];
  if(!rows.length){ setMsg("ไม่มีข้อมูล"); return; }

  currentRows = rows;
  exportBtn.disabled = false;
  setMsg("");
  renderTable(rows);
}

function renderTable(rows){
  const cols = Object.keys(rows[0]);
  let html = "<table><thead><tr>";
  cols.forEach(c => html += `<th>${escapeHtml(c)}</th>`);
  html += "</tr></thead><tbody>";

  rows.forEach(r=>{
    html += "<tr>";
    cols.forEach(c => html += `<td>${escapeHtml(String(r[c] ?? ""))}</td>`);
    html += "</tr>";
  });

  html += "</tbody></table>";
  tableEl.innerHTML = html;
}

function exportCSV(){
  if(!currentRows.length) return;

  const cols = Object.keys(currentRows[0]);
  const esc = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;

  const lines = [
    cols.map(esc).join(","),
    ...currentRows.map(r => cols.map(c => esc(r[c])).join(","))
  ];

  const blob = new Blob([lines.join("\n")], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `CPVC-${currentName}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, (m)=>({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[m]));
}
