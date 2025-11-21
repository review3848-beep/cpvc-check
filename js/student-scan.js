// js/student-scan.js
import { callApi } from "./api.js";

const studentStr = sessionStorage.getItem("student");

const studentNameChip = document.getElementById("student-name");
const infoIdEl = document.getElementById("info-id");
const infoNameEl = document.getElementById("info-name");
const logoutBtn = document.getElementById("logout-btn");

const tokenInput = document.getElementById("tokenInput");
const checkinBtn = document.getElementById("checkin-btn");
const msgEl = document.getElementById("scan-message");

// ถ้าไม่ล็อกอิน → ส่งกลับ
if (!studentStr) {
  window.location.href = "login.html";
} else {
  const student = JSON.parse(studentStr);
  studentNameChip.textContent = `${student.name} (${student.id})`;
  infoIdEl.textContent = student.id;
  infoNameEl.textContent = student.name;
}

// ปุ่มออกจากระบบ
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("student");
  window.location.href = "login.html";
});

/*
  ฟังก์ชันเริ่มต้นการสแกน QR
*/
function startScanner() {
  const html5QrCode = new Html5Qrcode("reader");

  const config = { fps: 10, qrbox: 250 };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    qrCodeMessage => {
      // เมื่อสแกน QR ได้
      tokenInput.value = qrCodeMessage.trim();
      msgEl.textContent = "ดึง TOKEN จาก QR แล้ว กดปุ่มเช็คชื่อได้เลย";
      msgEl.className = "message-area success";
    },
    errorMessage => {
      // ignore scan error
    }
  ).catch(err => {
    console.error("Camera start error: ", err);
    msgEl.textContent = "ไม่สามารถเปิดกล้องได้ ให้ตรวจสอบสิทธิ์การใช้กล้อง";
    msgEl.className = "message-area error";
  });
}

setTimeout(startScanner, 300); // หน่วงเล็กน้อยให้ DOM โหลดครบ

/*
  ฟังก์ชันกดเช็คชื่อ
*/
checkinBtn.addEventListener("click", async () => {
  const student = JSON.parse(studentStr);
  const token = tokenInput.value.trim();

  if (!token) {
    msgEl.textContent = "กรุณากรอก TOKEN หรือสแกน QR ก่อน";
    msgEl.className = "message-area error";
    return;
  }

  msgEl.textContent = "กำลังตรวจสอบ…";
  msgEl.className = "message-area";

  try {
    const res = await callApi("markAttendance", {
      studentId: student.id,
      token: token
    });

    msgEl.className = "message-area";

    if (!res.success) {
      msgEl.textContent = res.message || "เกิดข้อผิดพลาด";
      msgEl.classList.add("error");
      return;
    }

    const msg = res.message;
    const data = res.data;

    // Case: ไม่พบคาบ
    if (msg === "ไม่พบคาบ") {
      msgEl.textContent = "❌ ไม่พบคาบเรียนสำหรับ TOKEN นี้";
      msgEl.classList.add("error");
      return;
    }

    // Case: คาบถูกปิดแล้ว
    if (msg === "คาบนี้ถูกปิดแล้ว") {
      msgEl.textContent = "⛔ คาบนี้ถูกปิดแล้ว";
      msgEl.classList.add("error");
      return;
    }

    // Case: เคยเช็คชื่อแล้ว
    if (msg === "คุณเช็คชื่อคาบนี้ไปแล้ว") {
      msgEl.textContent = "⚠️ คุณเช็คชื่อคาบนี้ไปแล้ว";
      msgEl.classList.add("error");
      return;
    }

    // Case: OK
    if (msg === "เช็คชื่อสำเร็จ") {
      msgEl.textContent = "✔ เช็คชื่อสำเร็จ!";
      msgEl.classList.add("success");
      tokenInput.value = "";
      return;
    }

    // fallback
    msgEl.textContent = msg;
    msgEl.classList.add("success");

  } catch (err) {
    msgEl.textContent = err.message || "เกิดข้อผิดพลาดในการเช็คชื่อ";
    msgEl.classList.add("error");
  }
});
