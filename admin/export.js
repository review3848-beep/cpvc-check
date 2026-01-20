// ../js/admin-export.js
import { callApi } from "../api.js";

/* ================== CONFIG ================== */
const ACTIONS = {
  counts: "adminGetExportCounts",
  export: {
    teachers: "adminExportTeachers",
    students: "adminExportStudents",
    sessions: "adminExportSessions",
    attendance: "adminExportAttendance",
  }
};

/* ================== DOM ================== */
const msgEl = document.getElementById("msg");
const exportButtons = document.querySelectorAll("[data-export]");
const countEls = {
  teachers: document.querySelector('[data-count="teachers"]'),
  students: document.querySelector('[data-count="students"]'),
  sessions: document.querySelector('[data-count="sessions"]'),
  attendance: document.querySelector('[data-count="attendance"]'),
};

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  bindEvents();
  await loadCounts();
}

/* ================== EVENTS ================== */
function bindEvents(){
  exportButtons.forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const key = btn.getAttribute("data-export");
      if(!key || !ACTIONS.export[key]) return;
      await exportCsv(key, btn);
    });
  });
}

/* ================== COUNTS ================== */
async function loadCounts(){
  setMsg("กำลังโหลดจำนวนรายการ…");
  try{
    const res = await callApi(ACTIONS.counts, {});
    if(!res?.success) throw new Error(res?.message || "โหลดจำนวนไม่สำเร็จ");

    const c = res.counts || {};
    setCount("teachers", c.teachers);
    setCount("students", c.students);
    setCount("sessions", c.sessions);
    setCount("attendance", c.attendance);

    setMsg("");
  }catch(err){
    setMsg(`โหลดจำนวนไม่สำเร็จ: ${err.message || err}`);
  }
}

function setCount(key, value){
  if(!countEls[key]) return;
  const n = Number(value);
  countEls[key].textContent = Number.isFinite(n) ? n.toLocaleString("th-TH") : "—";
}

/* ================== EXPORT ================== */
async function exportCsv(key, btn){
  const action = ACTIONS.export[key];

  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "กำลังดาวน์โหลด…";
  setMsg("กำลังสร้างไฟล์…");

  try{
    const res = await callApi(action, {});
    if(!res?.success) throw new Error(res?.message || "ส่งออกไม่สำเร็จ");

    const csv = res.csv;
    if(!csv || typeof csv !== "string") throw new Error("ไม่พบข้อมูล CSV");

    const filename = `${key}_${stamp()}.csv`;
    downloadText(csv, filename, "text/csv;charset=utf-8;");
    setMsg("ดาวน์โหลดแล้ว");
    clearMsgSoon();
  }catch(err){
    setMsg(`ส่งออกไม่สำเร็จ: ${err.message || err}`);
  }finally{
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

/* ================== UI HELPERS ================== */
function setMsg(text){
  if(!msgEl) return;
  msgEl.textContent = text || "";
}

function clearMsgSoon(){
  clearTimeout(clearMsgSoon._t);
  clearMsgSoon._t = setTimeout(()=>setMsg(""), 2400);
}

/* ================== FILE HELPERS ================== */
function downloadText(content, filename, mime){
  // ใส่ BOM ให้ Excel ไทยเปิด UTF-8 สวย
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: mime || "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp(){
  const d = new Date();
  const pad = (n)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
