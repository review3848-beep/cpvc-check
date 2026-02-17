import { callApi } from "../api.js";

/* ================= DOM ================= */
const teacherNameEl   = document.getElementById("teacherName");
const subjectInput    = document.getElementById("subject");
const roomInput       = document.getElementById("room");

const openBtn         = document.getElementById("btnOpenSession");
const closeBtn        = document.getElementById("closeSessionBtn");

const tokenBox        = document.getElementById("tokenBox");
const tokenEl         = document.getElementById("token");
const statusEl        = document.getElementById("sessionStatus");
const msgEl           = document.getElementById("msg");

/* modal */
const modal           = document.getElementById("closeModal");
const modalSummary    = document.getElementById("modalSummary");
const cancelCloseBtn  = document.getElementById("cancelClose");
const confirmCloseBtn = document.getElementById("confirmClose");

/* back */
const backBtn = document.getElementById("backDashboardBtn");

/* ================= STATE ================= */
let currentToken = "";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const teacher = readTeacherSession_();
  if(!teacher){
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent = teacher.name || "-";

  openBtn?.addEventListener("click", openSession);
  closeBtn?.addEventListener("click", showCloseModal);
  cancelCloseBtn?.addEventListener("click", hideCloseModal);
  confirmCloseBtn?.addEventListener("click", closeSession);

  backBtn?.addEventListener("click", () => location.href = "dashboard.html");

  resetUI();
}

/* ================= SESSION ================= */
async function openSession(){
  const teacher = readTeacherSession_();
  const email   = (teacher?.email || "").trim();
  const subject = (subjectInput?.value || "").trim();
  const room    = (roomInput?.value || "").trim();

  if(!email){
    showMsg("❌ ไม่พบอีเมลครูในระบบ (ลอง logout/login ใหม่)", "err");
    return;
  }

  if(!subject || !room){
    showMsg("⚠️ กรุณากรอก วิชา และ ห้อง ให้ครบ", "warn");
    return;
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  try{
    const res = await callApi("teacherOpenSession", { email, subject, room });
    if(!res?.success) throw new Error(res?.message || "เปิดคาบไม่สำเร็จ");

    renderSession({
      token: res.session?.token,
      subject,
      room
    });

    showMsg("✅ เปิดคาบเรียนสำเร็จ", "ok");
  }catch(err){
    console.error(err);
    showMsg(err?.message || "เกิดข้อผิดพลาด", "err");
    resetUI();
  }finally{
    openBtn.disabled = false;
    openBtn.textContent = "เปิดคาบเรียน";
  }
}

function renderSession(session){
  currentToken = String(session.token || "").trim();

  tokenBox.style.display = "block";
  tokenEl.textContent    = currentToken || "------";
  statusEl.textContent   = "สถานะคาบ: เปิดอยู่";

  closeBtn.disabled = !currentToken;
  openBtn.disabled  = true;

  subjectInput.value = session.subject || "";
  roomInput.value    = session.room || "";
}

/* ================= CLOSE SESSION ================= */
function showCloseModal(){
  if(!currentToken){
    showMsg("ยังไม่มีคาบที่เปิดอยู่", "warn");
    return;
  }

  modalSummary.innerHTML = `
    <b>วิชา:</b> ${escapeHtml(subjectInput.value)}<br>
    <b>ห้อง:</b> ${escapeHtml(roomInput.value)}<br>
    <b>TOKEN:</b> ${escapeHtml(currentToken)}
  `;
  modal.classList.add("show");
}

function hideCloseModal(){
  modal.classList.remove("show");
}

async function closeSession(){
  if(!currentToken) return;

  confirmCloseBtn.disabled = true;
  confirmCloseBtn.textContent = "กำลังปิดคาบ...";

  try{
    const res = await callApi("teacherCloseSession", { token: currentToken });
    if(!res?.success) throw new Error(res?.message || "ปิดคาบไม่สำเร็จ");

    showMsg("✅ ปิดคาบเรียนเรียบร้อย", "ok");
    hideCloseModal();
    resetUI();
  }catch(err){
    console.error(err);
    showMsg(err?.message || "❌ ปิดคาบไม่สำเร็จ", "err");
  }finally{
    confirmCloseBtn.disabled = false;
    confirmCloseBtn.textContent = "ยืนยันปิดคาบ";
  }
}

/* ================= UI HELPERS ================= */
function resetUI(){
  currentToken = "";

  tokenBox.style.display = "none";
  tokenEl.textContent    = "------";
  statusEl.textContent   = "สถานะคาบ: ยังไม่เปิดคาบ";

  openBtn.disabled  = false;
  closeBtn.disabled = true;
}

function showMsg(text, type=""){
  msgEl.textContent = text;
  msgEl.style.color =
    type==="ok"  ? "#22c55e" :
    type==="err" ? "#ef4444" :
    "#facc15";
}

function escapeHtml(v){
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

/* ================= LOCAL SESSION (FIX เด้งกลับ) ================= */
function readTeacherSession_(){
  try{
    const raw = localStorage.getItem("teacherSession");
    if(!raw) return null;

    const obj = JSON.parse(raw);

    // normalize
    const teacherId = String(obj.teacherId ?? obj.id ?? "").trim();
    const name = String(obj.name ?? "").trim();
    const email = String(obj.email ?? "").trim();

    // มีอย่างน้อย 1 อย่างก็ถือว่า session ใช้ได้
    if(!teacherId && !email && !name) return null;

    return {
      ...obj,
      teacherId,
      id: teacherId || obj.id || "",
      name,
      email
    };
  }catch{
    return null;
  }
}
