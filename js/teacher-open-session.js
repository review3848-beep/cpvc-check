import { callApi } from "./api.js";

/* ================= DOM ================= */
const teacherNameEl   = document.getElementById("teacherName");
const subjectInput   = document.getElementById("subject");
const roomInput      = document.getElementById("room");

const openBtn        = document.getElementById("btnOpenSession");
const closeBtn       = document.getElementById("closeSessionBtn");

const tokenBox       = document.getElementById("tokenBox");
const tokenEl        = document.getElementById("token");
const statusEl       = document.getElementById("sessionStatus");
const msgEl          = document.getElementById("msg");

/* modal */
const modal          = document.getElementById("closeModal");
const modalSummary   = document.getElementById("modalSummary");
const cancelCloseBtn = document.getElementById("cancelClose");
const confirmCloseBtn= document.getElementById("confirmClose");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const teacher = getTeacherSession();
  if(!teacher){
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent = teacher.name || "-";

  openBtn.addEventListener("click", openSession);
  closeBtn.addEventListener("click", showCloseModal);
  cancelCloseBtn.addEventListener("click", hideCloseModal);
  confirmCloseBtn.addEventListener("click", closeSession);

  await loadCurrentSession();
}

/* ================= SESSION ================= */
async function openSession(){
  const subject = subjectInput.value.trim();
  const room    = roomInput.value.trim();

  if(!subject || !room){
    showMsg("⚠️ กรุณากรอกข้อมูลให้ครบ", "warn");
    return;
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  try{
    const res = await callApi("teacherOpenSession", {
      subject,
      room
    });

    if(!res.success) throw res.message;

    renderSession(res.session);
    showMsg("✅ เปิดคาบเรียนสำเร็จ", "ok");

  }catch(err){
    showMsg(err || "เกิดข้อผิดพลาด", "err");
  }

  openBtn.disabled = false;
  openBtn.textContent = "เปิดคาบเรียน";
}

async function loadCurrentSession(){
  try{
    const res = await callApi("teacherGetCurrentSession", {});
    if(res && res.session){
      renderSession(res.session);
    }
  }catch(e){}
}

function renderSession(session){
  tokenBox.style.display = "block";
  tokenEl.textContent   = session.token;
  statusEl.textContent  = "สถานะคาบ: เปิดอยู่";

  closeBtn.disabled = false;
  openBtn.disabled  = true;

  subjectInput.value = session.subject;
  roomInput.value    = session.room;
}

/* ================= CLOSE SESSION ================= */
function showCloseModal(){
  modalSummary.innerHTML = `
    <b>วิชา:</b> ${subjectInput.value}<br>
    <b>ห้อง:</b> ${roomInput.value}
  `;
  modal.classList.add("show");
}

function hideCloseModal(){
  modal.classList.remove("show");
}

async function closeSession(){
  if(!confirm("ปิดคาบเรียนใช่ไหม?")) return;

  try{
    const res = await callApi("teacherCloseSession", {});

    if(!res.success) throw res.message;

    alert("✅ ปิดคาบเรียนเรียบร้อย");

    // รีเซ็ตหน้า
    tokenBox.style.display = "none";
    tokenEl.textContent = "------";
    statusEl.textContent = "สถานะคาบ: ยังไม่เปิดคาบ";

    openBtn.disabled = false;
    closeBtn.disabled = true;

  }catch(err){
    alert("❌ ปิดคาบไม่สำเร็จ");
  }
}




  confirmCloseBtn.disabled = false;
  hideCloseModal();

/* ================= UI HELPERS ================= */
function resetUI(){
  tokenBox.style.display = "none";
  tokenEl.textContent    = "------";
  statusEl.textContent  = "สถานะคาบ: ยังไม่เปิดคาบ";

  openBtn.disabled  = false;
  closeBtn.disabled = true;

  subjectInput.value = "";
  roomInput.value    = "";
}

function showMsg(text, type=""){
  msgEl.textContent = text;
  msgEl.style.color =
    type==="ok"  ? "#22c55e" :
    type==="err" ? "#ef4444" :
    "#facc15";
}

/* ================= SESSION STORAGE ================= */
function getTeacherSession(){
  try{
    return JSON.parse(localStorage.getItem("teacherSession"));
  }catch{
    return null;
  }
}
