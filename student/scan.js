// student/scan.js
import { callApi } from "../js/api.js";

/* ================= DOM ================= */
const tokenInput = document.getElementById("tokenInput");
const submitBtn  = document.getElementById("submitTokenBtn");
const msgEl      = document.getElementById("scanMsg");

const pillName   = document.getElementById("pillUserName");
const statusDot  = document.getElementById("sessionStatusDot");
const statusText = document.getElementById("sessionStatusText");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

function init(){
  const student = getStudentSession();
  if (!student){
    location.href = "login.html";
    return;
  }

  pillName.textContent = student.name || "นักเรียน";

  submitBtn.addEventListener("click", submitToken);
  tokenInput.addEventListener("keydown", e=>{
    if (e.key === "Enter") submitToken();
  });

  setIdle();
}

/* ================= SESSION ================= */
function getStudentSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_student"));
  }catch(e){
    return null;
  }
}

/* ================= MAIN ================= */
async function submitToken(){
  const token = tokenInput.value.trim().toUpperCase();
  msg("");

  if (!token){
    setError("⚠️ กรุณากรอก TOKEN");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังตรวจสอบ TOKEN...";
  setChecking();

  try{
    const student = getStudentSession();

    const res = await callApi("studentCheckin", {
      studentId: student.studentId,
      token
    });

    if (!res || !res.success){
      throw new Error(res?.message || "เช็คชื่อไม่สำเร็จ");
    }

    setSuccess(`✅ เช็คชื่อสำเร็จ (${res.status || "OK"})`);
    tokenInput.value = "";

    // UX: เด้งไป dashboard หลังสำเร็จ
    setTimeout(()=>{
      location.href = "dashboard.html";
    }, 1200);

  }catch(err){
    setError("❌ " + err.message);
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "ยืนยันเช็คชื่อ";
  }
}

/* ================= STATUS UI ================= */
function setIdle(){
  statusDot.className = "scan-status-dot";
  statusText.textContent = "รอกรอก TOKEN เพื่อเช็คชื่อ";
}

function setChecking(){
  statusDot.className = "scan-status-dot open";
  statusText.textContent = "กำลังตรวจสอบ TOKEN...";
}

function setSuccess(text){
  statusDot.className = "scan-status-dot open";
  statusText.textContent = "เช็คชื่อสำเร็จ";
  msg(text, true);
}

function setError(text){
  statusDot.className = "scan-status-dot error";
  statusText.textContent = "เกิดข้อผิดพลาด";
  msg(text, false);
}

/* ================= MESSAGE ================= */
function msg(text, success){
  msgEl.textContent = text || "";
  msgEl.classList.toggle("scanMsg-success", !!success);
}
