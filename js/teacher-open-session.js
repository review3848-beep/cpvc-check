// teacher-open-session.js
import { callApi } from "../js/api.js";

/* ================= DOM ================= */
const subjectInput = document.getElementById("subject");
const roomInput    = document.getElementById("room");

const openBtn      = document.getElementById("btnOpenSession");
const closeBtn     = document.getElementById("closeSessionBtn");

const tokenBox     = document.getElementById("tokenBox");
const tokenEl      = document.getElementById("token");

const statusEl     = document.getElementById("sessionStatus");
const teacherNameEl= document.getElementById("teacherName");

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

async function loadCurrentSession() {
  try {
    const res = await callApi("teacherGetCurrentSession", {});
    if (!res || !res.active) {
      setIdleUI();
      return;
    }

    tokenBox.style.display = "block";
    tokenEl.textContent = res.token;

    statusEl.textContent = "สถานะคาบ: กำลังเปิดเรียน";

    openBtn.disabled  = true;
    closeBtn.disabled = false;
  } catch (err) {
    console.warn("loadCurrentSession failed", err);
    setIdleUI();
  }
}

async function openSession() {
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

    tokenBox.style.display = "block";
    tokenEl.textContent = res.token;

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
  tokenBox.style.display = "none";
  tokenEl.textContent = "------";

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
