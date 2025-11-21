// js/teacher-open-session.js
import { API_BASE } from "./api.js";

const subjectInput = document.getElementById("subjectCode");
const openBtn = document.getElementById("openSessionBtn");
const tokenBox = document.getElementById("tokenBox");
const tokenEl = document.getElementById("token");
const msg = document.getElementById("msg");
const teacherNameEl = document.getElementById("teacherName");

const teacherEmail = sessionStorage.getItem("teacherEmail");
const teacherName = sessionStorage.getItem("teacherName");

// ถ้ายังไม่ได้ล็อกอิน → เด้งกลับหน้า login
if (!teacherEmail) {
  window.location.href = "login.html";
}

if (teacherNameEl) {
  teacherNameEl.textContent = teacherName || "Teacher";
}

function show(text, type="error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleOpenSession() {
  const subject = subjectInput.value.trim();

  if (!subject) {
    return show("กรุณากรอกรหัสวิชา / รายวิชา");
  }

  openBtn.disabled = true;
  openBtn.textContent = "กำลังเปิดคาบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "openSession",
        subject,
        teacherEmail,
      }),
    });

    const data = await res.json();
    console.log("openSession >", data);

    if (data.success) {
      tokenEl.textContent = data.token || "------";
      tokenBox.style.display = "block";
      show("เปิดคาบสำเร็จ! ส่ง TOKEN ให้นักเรียนได้เลย","success");
    } else {
      show(data.message || "เปิดคาบไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  openBtn.disabled = false;
  openBtn.textContent = "เปิดคาบเรียน";
}

openBtn.addEventListener("click", handleOpenSession);
