// js/teacher-open-session.js
import { callApi } from "./api.js";

/* ================= DOM ================= */
const teacherNameEl = document.getElementById("teacherName");

const subjectInput = document.getElementById("subjectCode");
const roomInput    = document.getElementById("room");

const openBtn  = document.getElementById("openSessionBtn");
const closeBtn = document.getElementById("closeSessionBtn");

const tokenBox   = document.getElementById("tokenBox");
const tokenEl    = document.getElementById("token");
const statusEl   = document.getElementById("sessionStatus");
const msgEl      = document.getElementById("msg");

/* ================= STATE ================= */
let currentSessionId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

function init(){
  const teacher = getTeacherSession();
  if (!teacher){
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent = teacher.name || "-";

  openBtn.addEventListener("click", openSession);
  closeBtn.addEventListener("click", closeSession);

  setIdle();
}

/* ================= SESSION ================= */
function getTeacherSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  }catch(e){
    return null;
  }
}

/* ================= OPEN SESSION ================= */
async function openSession(){
  const subject = subjectInput.value.trim();
  const room    = roomInput.value.trim();

  setMsg("");

  if (!subject){
    setMsg("⚠️ กรุณากรอกรายวิชา / รหัสวิชา", "#fbbf24");
    return;
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  try{
    const res = await callApi("teacherOpenSession", {
      subject,
      room
    });

    if (!res || !res.success){
      throw new Error(res?.message || "เปิดคาบไม่สำเร็จ");
    }

    currentSessionId = res.session.sessionId;

    tokenEl.textContent = res.session.token;
    tokenBox.style.display = "block";

    statusEl.textContent = "สถานะคาบ: เปิดอยู่";
    statusEl.style.color = "#4ade80";

    closeBtn.disabled = false;
    setMsg("✅ เปิดคาบเรียนเรียบร้อย", "#4ade80");

  }catch(err){
    setMsg("❌ " + err.message, "#f87171");
  }finally{
    openBtn.disabled = false;
    openBtn.textContent = "เปิดคาบเรียน";
  }
}

/* ================= CLOSE SESSION ================= */
async function closeSession(){
  if (!currentSessionId) return;

  closeBtn.disabled = true;
  closeBtn.textContent = "กำลังปิดคาบ...";

  try{
    const res = await callApi("teacherCloseSession", {
      sessionId: currentSessionId
    });

    if (!res || !res.success){
      throw new Error(res?.message || "ปิดคาบไม่สำเร็จ");
    }

    statusEl.textContent = "สถานะคาบ: ปิดแล้ว";
    statusEl.style.color = "#fca5a5";

    setMsg("🔒 ปิดคาบเรียนเรียบร้อย", "#fca5a5");

    tokenBox.style.display = "none";
    currentSessionId = null;

  }catch(err){
    setMsg("❌ " + err.message, "#f87171");
    closeBtn.disabled = false;
    closeBtn.textContent = "ปิดคาบเรียน";
  }
}

/* ================= UI HELPERS ================= */
function setIdle(){
  statusEl.textContent = "สถานะคาบ: ยังไม่เปิดคาบ";
  statusEl.style.color = "#e5e7eb";
  tokenBox.style.display = "none";
  closeBtn.disabled = true;
}

function setMsg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
