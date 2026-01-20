// ../js/admin-sessions.js
import { callApi } from "../api.js";

/* ================== CONFIG ================== */
const ACTIONS = {
  list:  "adminListSessions",
  open:  "adminOpenSession",
  close: "adminCloseSession",
  export:"adminExportSessions"
};

/* ================= DOM ================= */
const tbody     = document.getElementById("tbody");
const q         = document.getElementById("q");
const countEl   = document.getElementById("count");
const msgEl     = document.getElementById("msg");

const btnLogout = document.getElementById("btnLogout");
const btnExport = document.getElementById("btnExport");
const btnOpen   = document.getElementById("btnOpen");

/* open modal */
const openModal  = document.getElementById("openModal");
const openClose  = document.getElementById("openClose");
const openCancel = document.getElementById("openCancel");
const openSave   = document.getElementById("openSave");

const fTeacher = document.getElementById("fTeacher");
const fRoom    = document.getElementById("fRoom");
const fSubject = document.getElementById("fSubject");
const fNote    = document.getElementById("fNote");

/* close modal */
const closeModal   = document.getElementById("closeModal");
const closeClose   = document.getElementById("closeClose");
const closeCancel  = document.getElementById("closeCancel");
const closeConfirm = document.getElementById("closeConfirm");
const closeSummary = document.getElementById("closeSummary");

/* ================= STATE ================= */
let rows = [];
let filteredCache = [];
let closingSessionId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const admin = guardAdmin();
  if(!admin) return;

  bindEvents();
  await loadSessions();
  applyFilter();
}

/* ================= GUARD ================= */
function guardAdmin(){
  const raw = localStorage.getItem("adminSession");
  if(!raw){
    location.href = "./login.html";
    return null;
  }
  try{
    return JSON.parse(raw);
  }catch{
    location.href = "./login.html";
    return null;
  }
}

/* ================= EVENTS ================= */
function bindEvents(){
  btnLogout?.addEventListener("click", () => {
    localStorage.removeItem("adminSession");
    location.href = "./login.html";
  });

  q?.addEventListener("input", () => applyFilter());

  btnOpen?.addEventListener("click", openOpenModal);
  openClose?.addEventListener("click", closeOpenModal);
  openCancel?.addEventListener("click", closeOpenModal);
  openSave?.addEventListener("click", onOpenSave);

  closeClose?.addEventListener("click", closeCloseModal);
  closeCancel?.addEventListener("click", closeCloseModal);
  closeConfirm?.addEventListener("click", onCloseConfirm);

  btnExport?.addEventListener("click", onExport);
}

/* ================= DATA ================= */
async function loadSessions(){
  setMsg("กำลังโหลดคาบเรียน…");
  try{
    const res = await callApi(ACTIONS.list, {});
    if(!res?.success) throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    rows = normalizeSessions(res.rows || []);
    setMsg("");
  }catch(err){
    rows = [];
    setMsg(`โหลดข้อมูลไม่สำเร็จ: ${err.message || err}`);
  }
}

function normalizeSessions(list){
  return list.map(r => ({
    sessionId: r.ID || r.sessionId || "",
    token: r.TOKEN || r.token || "",
    subject: r.SUBJECT || r.subject || "",
    room: r.ROOM || r.room || "",
    teacher: r.TEACHER_EMAIL || r.teacher || "",
    status: String(r.STATUS || r.status || "").toLowerCase(),
    createdAt: r.START_TIME || r.createdAt || ""
  }));
}

/* ================= FILTER + RENDER ================= */
function applyFilter(){
  const text = (q?.value || "").trim().toLowerCase();
  filteredCache = !text ? [...rows] : rows.filter(r =>
    Object.values(r).join(" ").toLowerCase().includes(text)
  );
  renderTable(filteredCache);
  countEl.textContent = `${filteredCache.length} รายการ`;
}

function renderTable(list){
  if(!list.length){
    tbody.innerHTML = `<tr><td class="empty" colspan="6">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const st = r.status === "open" ? "open" : "closed";
    const badge = st === "open"
      ? `<span class="status status--open"><span class="dot"></span>OPEN</span>`
      : `<span class="status status--closed"><span class="dot"></span>CLOSED</span>`;

    return `
      <tr>
        <td class="mono">${r.sessionId}</td>
        <td class="mono">${r.token}</td>
        <td>${r.subject} / <span class="mono">${r.room}</span></td>
        <td>${r.teacher || "-"}</td>
        <td>${badge}</td>
        <td>
          <div class="right">
            <button class="btn btn--danger" data-id="${r.sessionId}" ${st!=="open"?"disabled":""}>ปิดคาบ</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.addEventListener("click",()=>openCloseConfirm(btn.dataset.id));
  });
}

/* ================= OPEN SESSION ================= */
function openOpenModal(){
  openModal.classList.add("show");
}
function closeOpenModal(){
  openModal.classList.remove("show");
  fTeacher.value = fRoom.value = fSubject.value = fNote.value = "";
}

async function onOpenSave(){
  const teacherId = fTeacher.value.trim();
  const room = fRoom.value.trim();
  const subject = fSubject.value.trim();
  if(!teacherId || !room || !subject){
    toast("กรอกข้อมูลให้ครบ");
    return;
  }

  try{
    const res = await callApi(ACTIONS.open,{ teacherId, room, subject });
    if(!res?.success) throw new Error(res.message);
    toast("เปิดคาบแล้ว");
    closeOpenModal();
    await loadSessions();
    applyFilter();
  }catch(e){
    setMsg(e.message);
  }
}

/* ================= CLOSE ================= */
function openCloseConfirm(id){
  closingSessionId = id;
  closeSummary.textContent = id;
  closeModal.classList.add("show");
}
function closeCloseModal(){
  closeModal.classList.remove("show");
  closingSessionId = null;
}
async function onCloseConfirm(){
  if(!closingSessionId) return;
  try{
    const res = await callApi(ACTIONS.close,{ sessionId: closingSessionId });
    if(!res?.success) throw new Error(res.message);
    toast("ปิดคาบแล้ว");
    closeCloseModal();
    await loadSessions();
    applyFilter();
  }catch(e){
    setMsg(e.message);
  }
}

/* ================= EXPORT ================= */
async function onExport(){
  try{
    const res = await callApi(ACTIONS.export,{});
    if(!res?.success) throw new Error(res.message);
    downloadText(res.csv,"sessions.csv","text/csv;charset=utf-8;");
    toast("Export CSV แล้ว");
  }catch(e){
    setMsg(`Export ไม่สำเร็จ: ${e.message}`);
  }
}

/* ================= HELPERS ================= */
function setMsg(t){ msgEl.textContent = t||""; }
function toast(t){ setMsg(t); setTimeout(()=>setMsg(""),2000); }

function downloadText(content, filename, mime){
  const blob = new Blob([content],{type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
