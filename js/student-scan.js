// js/student-scan.js
import { API_BASE } from "./api.js";

const studentName = sessionStorage.getItem("studentName");
const studentId = sessionStorage.getItem("studentId");

const nameEl = document.getElementById("studentName");
const idEl = document.getElementById("studentId");
const tokenInput = document.getElementById("tokenInput");
const scanBtn = document.getElementById("scanBtn");
const msg = document.getElementById("msg");

if (!studentId) {
  // ถ้ายังไม่ได้ล็อกอิน ให้เด้งกลับ
  window.location.href = "login.html";
} else {
  nameEl.textContent = studentName || "-";
  idEl.textContent = studentId;
}

// QR
window.addEventListener("load", () => {
  const readerEl = document.getElementById("reader");
  // ใช้ html5-qrcode ถ้ามี
  if (window.Html5QrcodeScanner) {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 }
    );

    scanner.render((decodedText) => {
      console.log("QR scanned:", decodedText);
      // ถ้า qr เป็นลิงก์ เช่น https://...?token=XXXX
      try {
        const url = new URL(decodedText);
        const t = url.searchParams.get("token");
        tokenInput.value = t || decodedText;
      } catch {
        tokenInput.value = decodedText;
      }
      msg.textContent = "สแกนสำเร็จ! ตรวจสอบ TOKEN แล้วกดเช็คชื่อ";
      msg.style.color = "#4ade80";
    }, (err) => {
      console.log("QR error", err);
    });
  }
});

function show(text, type="error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleCheck() {
  const token = tokenInput.value.trim();

  if (!token) {
    return show("กรุณาใส่ TOKEN ก่อนเช็คชื่อ");
  }

  scanBtn.disabled = true;
  scanBtn.textContent = "กำลังเช็คชื่อ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "markAttendance",
        token,
        studentId,
      }),
    });

    const data = await res.json();
    console.log("markAttendance >", data);

    if (data.success) {
      show("เช็คชื่อสำเร็จ ✔","success");
    } else {
      show(data.message || "เช็คชื่อไม่สำเร็จ");
    }
  } catch(err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  scanBtn.disabled = false;
  scanBtn.textContent = "เช็คชื่อ";
}

scanBtn.addEventListener("click", handleCheck);
