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
async function closeSession(){
  if (!currentSessionId) return;

  const modal = document.getElementById("closeModal");
  const summaryBox = document.getElementById("modalSummary");
  const btnConfirm = document.getElementById("confirmClose");
  const btnCancel  = document.getElementById("cancelClose");

  modal.classList.add("show");

  // 📊 โหลดสรุปล่วงหน้า
  const detail = await callApi("teacherGetSessionDetail", {
    sessionId: currentSessionId
  });

  if (detail.success){
    const s = detail.stats;
    summaryBox.innerHTML = `
      ✅ มาเรียน: ${s.ok}<br>
      ⏰ สาย: ${s.late}<br>
      ❌ ขาด: ${s.absent}
    `;
  }

  btnCancel.onclick = () => modal.classList.remove("show");

  btnConfirm.onclick = async () => {
    btnConfirm.disabled = true;
    btnConfirm.textContent = "กำลังปิดคาบ...";

    // ปิดคาบ
    await callApi("teacherCloseSession", { sessionId: currentSessionId });

    // 📥 export CSV อัตโนมัติ
    const csvRes = await callApi("teacherExportSession", {
      sessionId: currentSessionId
    });

    if (csvRes.success){
      downloadCSV(csvRes.csv, "attendance-session.csv");
    }

    // ล้างสถานะ
    localStorage.removeItem("cpvc_open_session");

    modal.classList.remove("show");

    setMsg("🔒 ปิดคาบแล้ว กำลังกลับ Dashboard...", "#fca5a5");

    setTimeout(()=>{
      location.href = "dashboard.html";
    }, 2000);
  };
}
