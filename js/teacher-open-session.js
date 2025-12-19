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
function teacherCloseSession_({ sessionId }) {
  const shSess = ss(SHEET_SESSIONS);
  const shAtt  = ss(SHEET_ATTENDANCE);

  const sessRows = shSess.getDataRange().getValues();
  let sess;

  for (let i = 1; i < sessRows.length; i++) {
    if (sessRows[i][0] === sessionId) {
      sess = { row: i + 1, data: sessRows[i] };
      break;
    }
  }

  if (!sess) return fail("ไม่พบคาบ");

  const startTime = new Date(sess.data[6]);
  const closeTime = new Date();

  // ⏰ กำหนดเวลา
  const LATE_MIN   = 10; // นาที
  const ABSENT_MIN = 30;

  const lateTime   = new Date(startTime.getTime() + LATE_MIN * 60000);
  const absentTime = new Date(startTime.getTime() + ABSENT_MIN * 60000);

  // ปิดคาบ
  shSess.getRange(sess.row, 6).setValue("CLOSED");

  // หานักเรียนที่เช็คชื่อแล้ว
  const attRows = shAtt.getDataRange().getValues();
  const checked = attRows.slice(1)
    .filter(r => r[0] === sessionId)
    .map(r => String(r[1]));

  // preload STUDENTS
  const stuRows = ss(SHEET_STUDENTS).getDataRange().getValues().slice(1);

  stuRows.forEach(stu => {
    const studentId = String(stu[0]);
    if (checked.includes(studentId)) return;

    let status = "OK";
    if (closeTime >= absentTime) status = "ABSENT";
    else if (closeTime >= lateTime) status = "LATE";

    shAtt.appendRow([
      sessionId,
      studentId,
      sess.data[3], // subject
      sess.data[2], // token
      sess.data[1], // teacher
      status,
      closeTime,
      sess.data[4]  // room
    ]);
  });

  return ok({ closed: true });
}
