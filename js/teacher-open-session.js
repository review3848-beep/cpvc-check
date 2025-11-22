// js/teacher-open-session.js
import { API_BASE } from "./api.js";

const teacherNameSpan = document.getElementById("teacherName");

const subjectInput = document.getElementById("subjectCode");
const roomInput = document.getElementById("room");

const openBtn = document.getElementById("openSessionBtn");
const closeBtn = document.getElementById("closeSessionBtn");

const tokenBox = document.getElementById("tokenBox");
const tokenEl = document.getElementById("token");
const statusEl = document.getElementById("sessionStatus");
const msg = document.getElementById("msg");

let currentToken = null;

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

document.addEventListener("DOMContentLoaded", () => {
  const teacherName = sessionStorage.getItem("teacherName");
  const teacherEmail = sessionStorage.getItem("teacherEmail");

  if (!teacherName || !teacherEmail) {
    // ยังไม่ล็อกอิน → เด้งกลับหน้า login ครู
    window.location.href = "login.html";
    return;
  }

  teacherNameSpan.textContent = teacherName;
});

// ======================= เปิดคาบ =======================
async function handleOpenSession() {
  const teacherEmail = sessionStorage.getItem("teacherEmail");
  const subject = subjectInput.value.trim();
  const room = roomInput.value.trim();

  if (!teacherEmail) {
    show("ไม่พบข้อมูลครู กรุณาเข้าสู่ระบบใหม่", "error");
    setTimeout(() => (window.location.href = "login.html"), 800);
    return;
  }

  if (!subject || !room) {
    return show("กรุณากรอกวิชาและห้องเรียนให้ครบ", "error");
  }

  openBtn.disabled = true;
  closeBtn.disabled = true;
  show("กำลังเปิดคาบเรียน...", "success");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      // ไม่ใส่ headers เพื่อลด preflight/CORS
      body: JSON.stringify({
        action: "openSession",      // ต้องตรงกับ Code.gs
        teacherEmail,
        subject,
        room,
      }),
    });

    const data = await res.json();
    console.log("openSession >", data);

    if (!data.success) {
      show(data.message || "เปิดคาบไม่สำเร็จ", "error");
      openBtn.disabled = false;
      return;
    }

    currentToken = data.token;
    if (tokenBox) {
      tokenBox.style.display = "block";
      tokenEl.textContent = currentToken || "------";
    }

    if (statusEl) {
      statusEl.textContent = `สถานะคาบ: เปิดคาบแล้ว (TOKEN: ${currentToken})`;
    }

    show("เปิดคาบสำเร็จ! ส่ง TOKEN ให้นักเรียนได้เลย", "success");

    // เปิดให้ปิดคาบได้ / กันกดเปิดซ้ำ
    closeBtn.disabled = false;
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error");
    openBtn.disabled = false;
  }
}

// ======================= ปิดคาบ =======================
async function handleCloseSession() {
  const tokenFromUI = tokenEl.textContent.trim();
  const token = currentToken || (tokenFromUI && tokenFromUI !== "------" ? tokenFromUI : "");

  if (!token) {
    return show("ยังไม่มี TOKEN ของคาบนี้ ไม่สามารถปิดคาบได้", "error");
  }

  closeBtn.disabled = true;
  show("กำลังปิดคาบและสรุปมา/สาย/ขาด...", "success");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "closeSession",  // ต้องตรงกับ Code.gs
        token,
      }),
    });

    const data = await res.json();
    console.log("closeSession >", data);

    if (!data.success) {
      show(data.message || "ปิดคาบไม่สำเร็จ", "error");
      closeBtn.disabled = false;
      return;
    }

    if (statusEl) {
      statusEl.textContent = "สถานะคาบ: ปิดคาบเรียบร้อยแล้ว";
    }

    show(data.message || "ปิดคาบสำเร็จ", "success");

    // หลังปิดคาบ เสร็จ  → อนุญาตให้เปิดคาบใหม่
    openBtn.disabled = false;
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error");
    closeBtn.disabled = false;
  }
}

// ======================= Event Listeners =======================
if (openBtn) {
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleOpenSession();
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleCloseSession();
  });
}
