import { callApi } from "../api.js";

const tbody = document.getElementById("tbody");
const q = document.getElementById("q");
const countEl = document.getElementById("count");
const msg = document.getElementById("msg");
const btnAdd = document.getElementById("btnAdd");
const btnExport = document.getElementById("btnExport");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const btnClose = document.getElementById("btnClose");
const btnSave = document.getElementById("btnSave");

const fId = document.getElementById("fId");
const fName = document.getElementById("fName");
const fPass = document.getElementById("fPass");

let rows = [];
let editingId = null;
let filteredCache = [];

document.addEventListener("DOMContentLoaded", init);

/* ================== GUARD ================== */
function guardAdmin(){
  const raw = localStorage.getItem("adminSession");
  if(!raw){ location.href = "./login.html"; return null; }
  try{ return JSON.parse(raw); }catch{ location.href="./login.html"; return null; }
}

/* ================== INIT ================== */
async function init(){
  guardAdmin();

  // actions
  btnAdd.addEventListener("click", () => openModal());
  btnClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });
  btnSave.addEventListener("click", save);
  q.addEventListener("input", render);
  btnExport.addEventListener("click", exportCsv);

  // UX: enter to save
  [fId,fName,fPass].forEach(el=>{
    el.addEventListener("keydown",(e)=>{
      if(e.key === "Enter") save();
      if(e.key === "Escape") closeModal();
    });
  });

  await load();
}

/* ================== DATA ================== */
async function load(){
  setStatus("Loading...", "info");
  const res = await callApi("adminGetStudents", {});
  if(!res.success){
    setStatus(res.message || "โหลดไม่สำเร็จ", "danger");
    return;
  }
  rows = res.rows || res.data?.rows || res.data || [];
  setStatus("", "clear");
  render();
}

/* ================== RENDER ================== */
function norm(v){ return String(v ?? "").toLowerCase().trim(); }

function render(){
  const key = norm(q.value);
  const filtered = !key ? rows : rows.filter(r=>{
    return norm(r.STUDENT_ID).includes(key) || norm(r.NAME).includes(key);
  });

  filteredCache = filtered;
  countEl.textContent = `${filtered.length} รายการ`;

  if(filtered.length === 0){
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="muted" style="padding:18px 14px;">
          ไม่พบข้อมูลที่ค้นหา
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const id = esc(r.STUDENT_ID);
    const name = esc(r.NAME);

    return `
      <tr>
        <td class="muted">${id}</td>
        <td>${name}</td>
        <td>
          <div class="right">
            <button class="btn icon" data-edit="${id}" title="แก้ไข">
              ✏️ <span class="btnTxt">แก้ไข</span>
            </button>
            <button class="btn danger icon" data-del="${id}" title="ลบ">
              🗑️ <span class="btnTxt">ลบ</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach(b=>{
    b.addEventListener("click", ()=> {
      const id = b.getAttribute("data-edit");
      const r = rows.find(x => String(x.STUDENT_ID) === String(id));
      openModal(r);
    });
  });

  tbody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=> del(b.getAttribute("data-del")));
  });
}

/* ================== MODAL ================== */
function openModal(r=null){
  editingId = r ? String(r.STUDENT_ID) : null;

  modalTitle.textContent = r ? "แก้ไขนักเรียน" : "เพิ่มนักเรียน";

  fId.value = r ? (r.STUDENT_ID || "") : "";
  fId.disabled = !!r;
  fName.value = r ? (r.NAME || "") : "";
  fPass.value = "";

  modal.classList.add("show");

  // focus ที่เหมาะ
  setTimeout(()=>{
    if(r) fName.focus();
    else fId.focus();
  }, 50);
}

function closeModal(){
  modal.classList.remove("show");
}

/* ================== SAVE ================== */
async function save(){
  const STUDENT_ID = fId.value.trim();
  const NAME = fName.value.trim();
  const PASSWORD = fPass.value.trim();

  if(!STUDENT_ID) return toast("กรอก STUDENT_ID", "warn");
  if(!NAME) return toast("กรอก NAME", "warn");
  if(!editingId && !PASSWORD) return toast("เพิ่มนักเรียนต้องใส่ PASSWORD", "warn");

  btnSave.disabled = true;
  btnSave.textContent = "กำลังบันทึก...";

  const payload = { action:"adminUpsertStudent", STUDENT_ID, NAME };
  if(PASSWORD) payload.PASSWORD = PASSWORD;

  const res = await callApi("adminUpsertStudent", payload);

  btnSave.disabled = false;
  btnSave.textContent = "บันทึก";

  if(!res.success) return toast(res.message || "บันทึกไม่สำเร็จ", "danger");

  closeModal();
  await load();
  toast("บันทึกแล้ว ✅", "success");
}

/* ================== DELETE ================== */
async function del(id){
  const ok = await confirmModal({
    title: "ยืนยันการลบ",
    text: `ลบนักเรียนรหัส ${esc(id)} ?`,
    confirmText: "ลบเลย",
    danger: true
  });
  if(!ok) return;

  setStatus("กำลังลบ...", "info");
  const res = await callApi("adminDeleteStudent", { STUDENT_ID:id });
  if(!res.success){
    setStatus("", "clear");
    return toast(res.message || "ลบไม่สำเร็จ", "danger");
  }
  await load();
  toast("ลบแล้ว 🧹", "success");
}

/* ================== EXPORT ================== */
function exportCsv(){
  // export เฉพาะที่เห็นหลังค้นหา (ดูโปรกว่า)
  const data = filteredCache?.length ? filteredCache : rows;

  const headers = ["STUDENT_ID","NAME","PASSWORD"];
  const lines = [headers.join(",")];

  data.forEach(r=>{
    const row = headers.map(h => csvCell(r[h] ?? ""));
    lines.push(row.join(","));
  });

  download(`students_${Date.now()}.csv`, lines.join("\n"));
  toast(`Export ${data.length} รายการแล้ว 📦`, "success");
}

/* ================== UI HELPERS ================== */
function csvCell(v){
  const s = String(v ?? "").replaceAll(`"`,`""`);
  return `"${s}"`;
}
function download(filename, content){
  const blob = new Blob([content], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function setStatus(t, type="info"){
  // ใช้พื้นที่ msg เป็น status bar แบบสุภาพ
  msg.textContent = t || "";
  msg.classList.remove("status-info","status-danger","status-clear");
  if(type==="danger") msg.classList.add("status-danger");
  else if(type==="info") msg.classList.add("status-info");
  else msg.classList.add("status-clear");
}

/* toast ลอย */
function toast(text, type="info"){
  const el = ensureToast();
  el.textContent = text;
  el.dataset.type = type;
  el.classList.add("show");

  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove("show"), 2600);
}

function ensureToast(){
  let el = document.getElementById("toast");
  if(el) return el;

  el = document.createElement("div");
  el.id = "toast";
  el.className = "toast";
  document.body.appendChild(el);
  return el;
}

/* confirm modal แบบสวย ไม่ใช้ confirm() */
function confirmModal({ title="Confirm", text="", confirmText="ยืนยัน", cancelText="ยกเลิก", danger=false } = {}){
  return new Promise((resolve)=>{
    const wrap = document.createElement("div");
    wrap.className = "modal show";
    wrap.innerHTML = `
      <div class="card modalCard" style="max-width:520px">
        <div class="row" style="justify-content:space-between;margin-bottom:8px">
          <div style="font-weight:900">${esc(title)}</div>
          <button class="btn" data-x>✕</button>
        </div>
        <div class="muted" style="margin:6px 0 14px">${esc(text)}</div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn" data-cancel>${esc(cancelText)}</button>
          <button class="btn ${danger ? "danger" : "primary"}" data-ok>${esc(confirmText)}</button>
        </div>
      </div>
    `;

    const close = (v)=>{
      wrap.remove();
      resolve(v);
    };

    wrap.addEventListener("click", (e)=>{
      if(e.target === wrap) close(false);
    });

    wrap.querySelector("[data-x]").addEventListener("click", ()=> close(false));
    wrap.querySelector("[data-cancel]").addEventListener("click", ()=> close(false));
    wrap.querySelector("[data-ok]").addEventListener("click", ()=> close(true));

    document.body.appendChild(wrap);
  });
}

function esc(s){
  return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
