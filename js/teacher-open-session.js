// js/teacher-open-session.js
import { API_BASE } from "./api.js";

const subjectInput = document.getElementById("subjectCode");
const roomInput = document.getElementById("room");
const openBtn = document.getElementById("openSessionBtn");
const closeBtn = document.getElementById("closeSessionBtn");
const tokenBox = document.getElementById("tokenBox");
const tokenEl = document.getElementById("token");
const msg = document.getElementById("msg");
const statusEl = document.getElementById("sessionStatus");
const teacherNameEl = document.getElementById("teacherName");

const teacherEmail = sessionStorage.getItem("teacherEmail");
const teacherName = sessionStorage.getItem("teacherName");

// ยังไม่ล็อกอิน → เด้งกลับ
if (!teacherEmail) {
  window.location.href = "login.html";
}

if (teacherNameEl) {
  teacherNameEl.textContent = teacherName || "Teacher";
}

let currentToken = null;

function show(text, type = "error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

function setStatus(text, color) {
  statusEl.textContent = "สถานะคาบ: " + text;
  if (color) statusEl.style.color = color;
}

// เปิดคาบ
async function handleOpenSession() {
  const subject = subjectInput.value.trim();
  const room = roomInput.value.trim();

  if (!subject) {
    return show("กรุณากรอกรหัสวิชา / รายวิชา");
  }

  if (!room) {
    return show("กรุณากรอกห้อง / กลุ่มเรียน");
  }

  openBtn.disabled = true;
  closeBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "openSession",
        teacher: teacherEmail,
        subject,
        room
      }),
    });

    const data = await res.json();
    console.log("openSession >", data);

    if (data.success) {
      currentToken = data.token;
      tokenEl.textContent = data.token || "------";
      tokenBox.style.display = "block";

      setStatus("กำลังเปิด (OPEN)", "#4ade80");
      show("เปิดคาบสำเร็จ! ส่ง TOKEN ให้นักเรียนได้เลย", "success");
      closeBtn.disabled = false;
    } else {
      show(data.message || "เปิดคาบไม่สำเร็จ");
      setStatus("ยังไม่เปิดคาบ", "#e5e7eb");
      currentToken = null;
      tokenBox.style.display = "none";
    }

  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    setStatus("ยังไม่เปิดคาบ", "#e5e7eb");
    currentToken = null;
    tokenBox.style.display = "none";
  }

  openBtn.disabled = false;
  openBtn.textContent = "เปิดคาบเรียน";
}

// ปิดคาบ
async function handleCloseSession() {
  if (!currentToken) {
    return show("ยังไม่มีคาบที่เปิดอยู่ หรือยังไม่ได้สร้าง TOKEN");
  }

  closeBtn.disabled = true;
  closeBtn.textContent = "กำลังปิดคาบ...";
  show("", "success");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "closeSession",
        token: currentToken
      }),
    });

    const data = await res.json();
    console.log("closeSession >", data);

    if (data.success) {
      setStatus("ปิดแล้ว (CLOSED)", "#f97316");
      show(data.message || "ปิดคาบและสรุปมา/ขาดเรียบร้อย", "success");
      // หลังปิดคาบแล้วไม่ให้กดปิดซ้ำ
      closeBtn.disabled = true;
    } else {
      show(data.message || "ปิดคาบไม่สำเร็จ");
      // ยังให้ลองกดปิดใหม่ได้
      closeBtn.disabled = false;
    }

  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    closeBtn.disabled = false;
  }

  closeBtn.textContent = "ปิดคาบเรียน";
}

openBtn.addEventListener("click", handleOpenSession);
closeBtn.addEventListener("click", handleCloseSession);
