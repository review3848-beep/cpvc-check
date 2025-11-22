// js/student-scan.js
import { API_BASE } from "./api.js";

const nameSpan = document.getElementById("studentName");
const idSpan = document.getElementById("studentId");
const readerDiv = document.getElementById("reader");
const tokenInput = document.getElementById("tokenInput");
const scanBtn = document.getElementById("scanBtn");
const msg = document.getElementById("msg");

let html5QrInstance = null;

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

document.addEventListener("DOMContentLoaded", () => {
  const studentId = sessionStorage.getItem("studentId");
  const studentName = sessionStorage.getItem("studentName");

  // ยังไม่ล็อกอิน → เด้งกลับ
  if (!studentId || !studentName) {
    window.location.href = "login.html";
    return;
  }

  if (nameSpan) nameSpan.textContent = studentName;
  if (idSpan) idSpan.textContent = studentId;

  initQrReader();
});

function initQrReader() {
  if (!readerDiv) return;
  if (!window.Html5Qrcode) {
    console.warn("Html5Qrcode ยังไม่โหลด");
    return;
  }

  html5QrInstance = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: 220
  };

  html5QrInstance
    .start(
      { facingMode: "environment" },
      config,
      onQrSuccess,
      (err) => {
        // error ตอนสแกน (จะขึ้นถี่ ๆ) ไม่ต้องสนใจ
      }
    )
    .catch((err) => {
      console.error("เปิดกล้องไม่สำเร็จ:", err);
      show("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือกรอก TOKEN เอง", "error");
    });
}

function onQrSuccess(decodedText) {
  console.log("QR decoded:", decodedText);

  if (!tokenInput) return;

  // ถ้า QR เป็น URL ที่มี ?token=XXXX
  try {
    const url = new URL(decodedText);
    const t = url.searchParams.get("token");
    tokenInput.value = t || decodedText;
  } catch {
    // ถ้าไม่ใช่ URL ก็ใช้ค่าตรง ๆ
    tokenInput.value = decodedText;
  }

  show("อ่าน QR สำเร็จ กรุณากดปุ่มเช็คชื่อ", "success");
}

async function handleCheckin() {
  const studentId = sessionStorage.getItem("studentId");
  const studentName = sessionStorage.getItem("studentName");
  const token = tokenInput.value.trim();

  if (!studentId || !studentName) {
    show("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่", "error");
    setTimeout(() => (window.location.href = "login.html"), 800);
    return;
  }

  if (!token) {
    return show("กรุณากรอก TOKEN หรือสแกน QR ก่อน", "error");
  }

  scanBtn.disabled = true;
  scanBtn.textContent = "กำลังเช็คชื่อ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "markAttendance",
        studentId,
        studentName,
        token,
      }),
    });

    const data = await res.json();
    console.log("markAttendance >", data);

    if (!data.success) {
      show(data.message || "เช็คชื่อไม่สำเร็จ", "error");
    } else {
      let text = "เช็คชื่อสำเร็จ";
      if (data.status === "LATE") text += " (สาย)";
      show(text, "success");
    }
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error");
  }

  scanBtn.disabled = false;
  scanBtn.textContent = "เช็คชื่อ";
}

if (scanBtn) {
  scanBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleCheckin();
  });
}
