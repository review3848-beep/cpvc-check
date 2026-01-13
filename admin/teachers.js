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
const fEmail = document.getElementById("fEmail");
const fPass = document.getElementById("fPass");

let rows = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", init);

function guardAdmin(){
  const raw = localStorage.getItem("adminSession");
  if(!raw){ location.href = "./login.html"; return null; }
  try{ return JSON.parse(raw); }catch{ location.href="./login.html"; return null; }
}

async function init(){
  guardAdmin();
  btnAdd.addEventListener("click", () => openModal());
  btnClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });
  btnSave.addEventListener("click", save);
  q.addEventListener("input", render);
  btnExport.addEventListener("click", exportCsv);

  await load();
}

async function load(){
  msg.textContent = "Loading...";
  const res = await callApi("adminGetTeachers", {});
  if(!res.success){ msg.textContent = res.message || "โหลดไม่สำเร็จ"; return; }
  rows = res.rows || res.data?.rows || res.data || res.rows || []; // กันหลายรูปแบบ
  msg.textContent = "";
  render();
}

function norm(v){ return String(v ?? "").toLowerCase().trim(); }

function render(){
  const key = norm(q.value);
  const filtered = !key ? rows : rows.filter(r=>{
    return norm(r.TEACHER_ID).includes(key)
      || norm(r.NAME).includes(key)
      || norm(r.EMAIL).includes(key);
  });

  countEl.textContent = `${filtered.length} รายการ`;
  tbody.innerHTML = filtered.map(r => {
    const id = esc(r.TEACHER_ID);
    const name = esc(r.NAME);
    const email = esc(r.EMAIL);
    const created = esc(r.CREATED_AT || "");
    return `
      <tr>
        <td class="muted">${id}</td>
        <td>${name}</td>
        <td class="muted">${email}</td>
        <td class="muted">${created}</td>
        <td>
          <div class="right">
            <button class="btn" data-edit="${id}">แก้ไข</button>
            <button class="btn danger" data-del="${id}">ลบ</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach(b=>{
    b.addEventListener("click", ()=> {
      const id = b.getAttribute("data-edit");
      const r = rows.find(x => String(x.TEACHER_ID) === String(id));
      openModal(r);
    });
  });
  tbody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=> del(b.getAttribute("data-del")));
  });
}

function openModal(r=null){
  editingId = r ? String(r.TEACHER_ID) : null;
  modalTitle.textContent = r ? "แก้ไขครู" : "เพิ่มครู";

  fId.value = r ? (r.TEACHER_ID || "") : "";
  fId.disabled = !!r; // edit ห้ามเปลี่ยน id กันดราม่า
  fName.value = r ? (r.NAME || "") : "";
  fEmail.value = r ? (r.EMAIL || "") : "";
  fPass.value = ""; // ไม่โชว์รหัสเดิม
  modal.classList.add("show");
}

function closeModal(){
  modal.classList.remove("show");
}

async function save(){
  const TEACHER_ID = fId.value.trim();
  const NAME = fName.value.trim();
  const EMAIL = fEmail.value.trim();
  const PASSWORD = fPass.value.trim();

  if(!NAME) return toast("กรอก NAME");
  if(!EMAIL) return toast("กรอก EMAIL");

  // create ต้องมีรหัส
  if(!editingId && !PASSWORD) return toast("เพิ่มครูต้องใส่ PASSWORD");
  btnSave.disabled = true;

  const payload = { action:"adminUpsertTeacher", TEACHER_ID, NAME, EMAIL };
  if(PASSWORD) payload.PASSWORD = PASSWORD; // เว้นว่าง = ไม่เปลี่ยน

  const res = await callApi("adminUpsertTeacher", payload);
  btnSave.disabled = false;

  if(!res.success) return toast(res.message || "บันทึกไม่สำเร็จ");
  closeModal();
  await load();
  toast("บันทึกแล้ว ✅");
}

async function del(id){
  if(!confirm(`ลบครู ${id} ?`)) return;
  const res = await callApi("adminDeleteTeacher", { TEACHER_ID:id });
  if(!res.success) return toast(res.message || "ลบไม่สำเร็จ");
  await load();
  toast("ลบแล้ว 🧹");
}

function exportCsv(){
  // headers ตามชีต
  const headers = ["TEACHER_ID","NAME","EMAIL","PASSWORD","CREATED_AT"];
  const lines = [headers.join(",")];

  rows.forEach(r=>{
    const row = headers.map(h => csvCell(r[h] ?? ""));
    lines.push(row.join(","));
  });

  download(`teachers_${Date.now()}.csv`, lines.join("\n"));
}

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

function toast(t){ msg.textContent = t; setTimeout(()=>{ if(msg.textContent===t) msg.textContent=""; }, 2500); }
function esc(s){ return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
