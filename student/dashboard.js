// teacher-open-session.js
import { callApi } from "../api.js";

/* ================== STATE ================== */
let currentSession = null;
let isClosingSession = false;

/* ================== DOM ================== */
const subjectInput = document.getElementById("subject");
const roomInput    = document.getElementById("room");

const openBtn  = document.getElementById("openSessionBtn");
const closeBtn = document.getElementById("closeSessionBtn");

const statusEl = document.getElementById("sessionStatus");
const tokenEl  = document.getElementById("tokenDisplay");

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", () => {
  loadCurrentSession();
  openBtn?.addEventListener("click", openSession);
  closeBtn?.addEventListener("click", confirmCloseSession);
});

/* ================== LOAD SESSION ================== */
async function loadCurrentSession() {
  const res = await callApi("teacherGetCurrentSession", {});
  if (res.success && res.session) {
    currentSession = res.session;
    renderSession();
  }
}

/* ================== OPEN SESSION ================== */
async function openSession() {
  const subject = subjectInput.value.trim();
  const room    = roomInput.value.trim();

  if (!subject || !room) {
    alert("กรุณากรอกวิชาและห้องให้ครบ");
    return;
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  const res = await callApi("teacherOpenSession", { subject, room });

  openBtn.disabled = false;
  openBtn.textContent = "เปิดคาบเรียน";

  if (res.success) {
    currentSession = res.session;
    renderSession();
  } else {
    alert(res.message || "เปิดคาบไม่สำเร็จ");
  }
}

/* ================== CONFIRM CLOSE ================== */
function confirmCloseSession() {
  showConfirmPopup(
    "ปิดคาบเรียน?",
    "ระบบจะสรุปผลการเข้าเรียนทันที",
    closeSession
  );
}

/* ================== CLOSE SESSION ================== */
async function closeSession() {
  if (!currentSession) return;

  isClosingSession = true;
  closeBtn.disabled = true;
  closeBtn.textContent = "กำลังปิดคาบ...";

  const res = await callApi("teacherCloseSession", {
    sessionId: currentSession.id
  });

  closeBtn.disabled = false;
  closeBtn.textContent = "ปิดคาบเรียน";

  if (res.success) {
    currentSession.status = "CLOSED";
    renderSession();
    showSummaryPopup(res.summary);
  } else {
    alert(res.message || "ปิดคาบไม่สำเร็จ");
  }
}

/* ================== RENDER ================== */
function renderSession() {
  if (!currentSession) return;

  tokenEl.textContent = currentSession.token || "-";

  if (currentSession.status === "OPEN") {
    statusEl.textContent = "สถานะคาบ: เปิดอยู่";
    statusEl.style.color = "#22c55e";
    closeBtn.style.display = "inline-flex";
  } else {
    statusEl.textContent = "สถานะคาบ: ปิดแล้ว";
    statusEl.style.color = "#f87171";
    closeBtn.style.display = "none";
  }
}

/* ================== POPUPS ================== */
function showConfirmPopup(title, desc, onConfirm) {
  const html = `
    <div class="popup-backdrop">
      <div class="popup-card">
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="popup-actions">
          <button class="btn ghost" onclick="closePopup()">ยกเลิก</button>
          <button class="btn danger" onclick="popupConfirm()">ยืนยัน</button>
        </div>
      </div>
    </div>
  `;
  injectPopup(html, onConfirm);
}

function showSummaryPopup(summary) {
  const html = `
    <div class="popup-backdrop">
      <div class="popup-card">
        <h3>📊 สรุปการเข้าเรียน</h3>
        <ul class="summary-list">
          <li>✅ มาเรียน: <b>${summary.ok}</b></li>
          <li>⏰ สาย: <b>${summary.late}</b></li>
          <li>❌ ขาด: <b>${summary.absent}</b></li>
        </ul>
        <div class="popup-actions">
          <button class="btn" onclick="stayHere()">อยู่หน้านี้</button>
          <button class="btn primary" onclick="goDashboard()">กลับ Dashboard</button>
        </div>
      </div>
    </div>
  `;
  injectPopup(html);
}

/* ================== POPUP HELPERS ================== */
let popupCallback = null;

function injectPopup(html, cb) {
  popupCallback = cb || null;
  document.body.insertAdjacentHTML("beforeend", html);
}

function closePopup() {
  document.querySelector(".popup-backdrop")?.remove();
}

function popupConfirm() {
  closePopup();
  popupCallback && popupCallback();
}

function goDashboard() {
  window.location.href = "dashboard.html";
}

function stayHere() {
  closePopup(); // ไม่ redirect 😎
}
