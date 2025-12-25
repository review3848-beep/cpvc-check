// teacher-open-session.js
import { callApi } from "../js/api.js";

/* ================= DOM ================= */
const subjectInput   = document.getElementById("subjectInput");
const roomInput      = document.getElementById("roomInput");

const statusEl       = document.getElementById("sessionStatus");
const tokenEl        = document.getElementById("tokenDisplay");

const openBtn        = document.getElementById("openBtn");
const closeBtn       = document.getElementById("closeBtn");

const teacherNameEl  = document.getElementById("teacherName");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  const teacher = getTeacherSession();
  if (!teacher) {
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent = teacher.name || "-";

  openBtn.addEventListener("click", openSession);
  closeBtn.addEventListener("click", closeSession);

  await loadCurrentSession();
}

/* ================= SESSION ================= */

// ⭐ สำคัญ: ฟังก์ชันนี้ “เคยหาย” ตอนนี้มีแล้ว
async function loadCurrentSession() {
  try {
    const res = await callApi("teacherGetCurrentSession", {});
    if (!res || !res.active) {
      setIdleUI();
      return;
    }

    tokenEl.textContent  = res.token;
    statusEl.textContent = "สถานะคาบ: กำลังเปิดเรียน";

    openBtn.disabled  = true;
    closeBtn.disabled = false;
  } catch (err) {
    console.warn("loadCurrentSession failed", err);
    setIdleUI();
  }
}

async function openSession() {
  if (!subjectInput || !roomInput) {
    alert("DOM not ready");
    return;
  }

  const subject = subjectInput.value.trim();
  const room    = roomInput.value.trim();

  if (!subject || !room) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  try {
    const res = await callApi("teacherOpenSession", {
      subject,
      room
    });

    tokenEl.textContent  = res.token;
    statusEl.textContent = "สถานะคาบ: กำลังเปิดเรียน";

    closeBtn.disabled = false;
  } catch (err) {
    alert("เปิดคาบไม่สำเร็จ");
    console.error(err);
    openBtn.disabled = false;
  } finally {
    openBtn.textContent = "เปิดคาบเรียน";
  }
}

async function closeSession() {
  if (!confirm("ยืนยันปิดคาบเรียน?")) return;

  closeBtn.disabled = true;

  try {
    await callApi("teacherCloseSession", {});
    setIdleUI();
  } catch (err) {
    alert("ปิดคาบไม่สำเร็จ");
    console.error(err);
    closeBtn.disabled = false;
  }
}

/* ================= UI ================= */

function setIdleUI() {
  tokenEl.textContent  = "-";
  statusEl.textContent = "สถานะคาบ: ยังไม่เปิดคาบ";

  openBtn.disabled  = false;
  closeBtn.disabled = true;
}

/* ================= SESSION STORAGE ================= */

function getTeacherSession() {
  try {
    return JSON.parse(localStorage.getItem("teacherSession"));
  } catch {
    return null;
  }
}
