// js/student-scan.js
import { API_BASE } from "./api.js";

// เติมชื่อ/ID จาก sessionStorage
const stuName = sessionStorage.getItem("studentName") || "นักเรียน";
const stuId   = sessionStorage.getItem("studentId")   || "-";

document.getElementById("studentName").textContent = stuName;
document.getElementById("studentId").textContent   = "ID : " + stuId;

// ------- UI Tab สลับกล้อง / TOKEN -------
const tabCam   = document.getElementById("tabCam");
const tabToken = document.getElementById("tabToken");
const reader   = document.getElementById("reader");
const tokenBox = document.getElementById("tokenBox");
const msgEl    = document.getElementById("msg");

let qrScanner = null;
let currentToken = "";

// เริ่มกล้อง
async function startCamera() {
  try {
    if (qrScanner) return;
    reader.style.display = "block";
    tokenBox.style.display = "none";

    qrScanner = new Html5Qrcode("reader");
    await qrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decoded) => {
        currentToken = decoded.trim();
        document.getElementById("tokenInput").value = currentToken;
        msgEl.textContent = "อ่าน TOKEN สำเร็จ: " + currentToken;
      }
    );
  } catch (err) {
    console.error(err);
    msgEl.textContent = "เปิดกล้องไม่สำเร็จ";
  }
}

// หยุดกล้อง
async function stopCamera() {
  if (qrScanner) {
    try {
      await qrScanner.stop();
    } catch (_) {}
    qrScanner.clear();
    qrScanner = null;
  }
  reader.style.display = "none";
}

// คลิกแท็บกล้อง
tabCam.addEventListener("click", () => {
  tabCam.classList.add("active");
  tabToken.classList.remove("active");
  msgEl.textContent = "";
  startCamera();
});

// คลิกแท็บ TOKEN
tabToken.addEventListener("click", () => {
  tabToken.classList.add("active");
  tabCam.classList.remove("active");
  msgEl.textContent = "";
  stopCamera();
  tokenBox.style.display = "block";
});

// เริ่มต้นด้วยโหมดกล้อง
startCamera();

// ------- ปุ่มเช็คชื่อ -------
document.getElementById("scanBtn").addEventListener("click", async () => {
  const tokenInput = document.getElementById("tokenInput").value.trim();
  const token = tokenInput || currentToken;

  if (!token) {
    msgEl.textContent = "กรุณาสแกนหรือกรอก TOKEN ก่อน";
    return;
  }

  msgEl.textContent = "กำลังส่งข้อมูล...";
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "markAttendance",
        studentId: stuId,
        studentName: stuName,
        token
      })
    });

    const data = await res.json();
    console.log("markAttendance >", data);

    if (data.success) {
      msgEl.textContent = `เช็คชื่อสำเร็จ (${data.status || "OK"})`;
    } else {
      msgEl.textContent = data.message || "เช็คชื่อไม่สำเร็จ";
    }
  } catch (err) {
    console.error(err);
    msgEl.textContent = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
  }
});
