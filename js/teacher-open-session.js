import { callApi, getTeacherSession } from "./api.js";

/* ===== DOM ===== */
const teacherNameEl   = document.getElementById("teacherName");

const subjectInput    = document.getElementById("subjectCode");
const roomInput       = document.getElementById("room");

const openBtn         = document.getElementById("btnOpenSession");
const closeBtn        = document.getElementById("closeSessionBtn");

const statusEl        = document.getElementById("sessionStatus");
const tokenBox        = document.getElementById("tokenBox");
const tokenEl         = document.getElementById("token");
const msgEl           = document.getElementById("msg");

/* modal */
const closeModal      = document.getElementById("closeModal");
const cancelCloseBtn  = document.getElementById("cancelClose");
const confirmCloseBtn = document.getElementById("confirmClose");

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



/* ================= LOAD CURRENT ================= */
async function loadCurrentSession(){
  const res = await callApi("teacherGetCurrentSession", {});
  if(res.success && res.session){
    currentSession = res.session;
    renderSession();
  }
}

/* ================= OPEN ================= */
async function openSession(){
  const subject = subjectInput.value.trim();
  const room    = roomInput.value.trim();

  msgEl.textContent = "";

  if(!subject || !room){
    msgEl.textContent = "⚠️ กรุณากรอกวิชาและห้องเรียน";
    msgEl.style.color = "#fbbf24";
    return;
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  const res = await callApi("teacherOpenSession", { subject, room });

  openBtn.disabled = false;
  openBtn.textContent = "เปิดคาบเรียน";

  if(res.success){
    currentSession = res.session;
    renderSession();
  }else{
    msgEl.textContent = res.message || "เปิดคาบไม่สำเร็จ";
    msgEl.style.color = "#f87171";
  }
}

/* ================= CLOSE ================= */
function showCloseModal(){
  closeModal.classList.add("show");
}

function hideCloseModal(){
  closeModal.classList.remove("show");
}

async function closeSession(){
  if(!currentSession) return;

  confirmCloseBtn.disabled = true;
  confirmCloseBtn.textContent = "กำลังปิดคาบ...";

  const res = await callApi("teacherCloseSession", {
    sessionId: currentSession.id
  });

  confirmCloseBtn.disabled = false;
  confirmCloseBtn.textContent = "ปิดคาบ";

  if(res.success){
    currentSession.status = "CLOSED";

    modalSummary.innerHTML = `
      ✅ มาเรียน: <b>${res.summary.ok}</b><br>
      ⏰ สาย: <b>${res.summary.late}</b><br>
      ❌ ขาด: <b>${res.summary.absent}</b>
    `;

    setTimeout(() => {
      hideCloseModal();
      renderSession();
    }, 1200);
  }
}

/* ================= RENDER ================= */
function renderSession(){
  if(!currentSession) return;

  if(currentSession.status === "OPEN"){
    statusEl.textContent = "สถานะคาบ: เปิดอยู่";
    statusEl.style.color = "#22c55e";

    tokenBox.style.display = "block";
    tokenEl.textContent = currentSession.token;

    closeBtn.disabled = false;
  }else{
    statusEl.textContent = "สถานะคาบ: ปิดแล้ว";
    statusEl.style.color = "#f87171";

    closeBtn.disabled = true;
  }
}
