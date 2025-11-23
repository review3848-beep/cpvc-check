// js/student-scan.js
import { callApi } from "./api.js";

// ------------------ ดึงข้อมูลนักเรียนจาก sessionStorage ------------------
const nameEl = document.getElementById("studentName");
const idEl   = document.getElementById("studentId");

const studentId   = sessionStorage.getItem("studentId");
const studentName = sessionStorage.getItem("studentName");

if (!studentId || !studentName) {
  // ถ้าไม่มี session ให้เด้งกลับไปหน้า login นักเรียน
  window.location.href = "login.html";
} else {
  nameEl.textContent = studentName;
  idEl.textContent   = studentId;
}

// ------------------ UI องค์ประกอบ ------------------
const btnCamera = document.getElementById("btnCamera");
const btnToken  = document.getElementById("btnToken");
const readerEl  = document.getElementById("reader");
const tokenBox  = document.getElementById("tokenBox");
const tokenInput = document.getElementById("tokenInput");
const statusMsg  = document.getElementById("statusMsg");
const checkBtn   = document.getElementById("checkBtn");

const successModal = document.getElementById("successModal");
const successText  = document.getElementById("successText");
const closeSuccess = document.getElementById("closeSuccess");

// ใช้เก็บ instance ของ Html5Qrcode
let qrInstance = null;
let currentMode = "camera"; // 'camera' | 'token'

// ------------------ Helper แสดงข้อความสถานะ ------------------
function setStatus(message, type = "info") {
  statusMsg.textContent = message || "";
  if (!message) return;

  if (type === "success") {
    statusMsg.style.color = "#4ade80";
  } else if (type === "error") {
    statusMsg.style.color = "#f97373";
  } else {
    statusMsg.style.color = "#e5e7eb";
  }
}

// ------------------ จัดการ Modal สำเร็จ ------------------
function showSuccess(text) {
  successText.textContent = text || "ระบบบันทึกสถานะของคุณแล้ว";
  successModal.style.display = "flex";
}

function hideSuccess() {
  successModal.style.display = "none";
}

closeSuccess.addEventListener("click", hideSuccess);

// ------------------ จัดการกล้อง ------------------
async function startCamera() {
  // ป้องกัน start ซ้ำ
  if (qrInstance) return;

  readerEl.style.display = "block";
  tokenBox.style.display = "none";

  try {
    qrInstance = new Html5Qrcode("reader");
    await qrInstance.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        // เมื่ออ่านได้จะเติม token ให้อัตโนมัติ
        const token = (decodedText || "").trim();
        tokenInput.value = token;
        setStatus("อ่าน TOKEN จาก QR แล้ว: " + token, "success");
      }
    );
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("เปิดกล้องไม่สำเร็จ / เบราว์เซอร์ไม่อนุญาตกล้อง", "error");
    // ถ้าเปิดกล้องไม่ได้ ให้สลับไปโหมด TOKEN เอง
    switchToTokenMode();
  }
}

async function stopCamera() {
  if (qrInstance) {
    try {
      await qrInstance.stop();
    } catch (e) {
      console.warn("stop camera error", e);
    }
    qrInstance.clear();
    qrInstance = null;
  }
  readerEl.style.display = "none";
}

// ------------------ สลับโหมด UI ------------------
async function switchToCameraMode() {
  currentMode = "camera";
  btnCamera.classList.add("active");
  btnToken.classList.remove("active");

  // ปิด input token
  tokenBox.style.display = "none";
  // เปิดกล้อง
  await startCamera();
}

async function switchToTokenMode() {
  currentMode = "token";
  btnToken.classList.add("active");
  btnCamera.classList.remove("active");

  // ปิดกล้อง
  await stopCamera();
  // โชว์ช่องกรอก token
  tokenBox.style.display = "block";
}

// ผูก event สลับโหมด
btnCamera.addEventListener("click", () => {
  switchToCameraMode();
});

btnToken.addEventListener("click", () => {
  switchToTokenMode();
});

// เริ่มต้นหน้าเป็นโหมดกล้อง
switchToCameraMode();

// ------------------ ยิงไปหา GAS: markAttendance ------------------
async function doCheckIn() {
  const token = tokenInput.value.trim();

  if (!token) {
    setStatus("กรุณาสแกนหรือกรอก TOKEN ก่อน", "error");
    return;
  }

  setStatus("กำลังเชื่อมต่อเซิร์ฟเวอร์...", "info");

  try {
    const res = await callApi("markAttendance", {
      studentId,
      studentName,
      token,
    });

    // คาดว่า GAS ส่ง { success, status, message }
    if (res.status === "LATE") {
      setStatus("เช็คชื่อสำเร็จ (มาสาย)", "success");
      showSuccess("เช็คชื่อสำเร็จ (มาสาย) • ระบบบันทึกแล้ว");
    } else {
      setStatus("เช็คชื่อสำเร็จ", "success");
      showSuccess("เช็คชื่อสำเร็จ • ระบบบันทึกสถานะของคุณแล้ว");
    }

    // ถ้าใช้โหมดกล้อง ให้ปิดกล้องชั่วคราว
    if (currentMode === "camera") {
      await stopCamera();
    }

  } catch (err) {
    console.error(err);
    setStatus(err.message || "เช็คชื่อไม่สำเร็จ", "error");
  }
}

// ปุ่มเช็คชื่อ
checkBtn.addEventListener("click", doCheckIn);
