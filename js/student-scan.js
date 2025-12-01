// js/student-scan.js
import { API_BASE } from "./api.js";

// ====== SESSION GUARD ======
const studentId = sessionStorage.getItem("studentId");
const studentName = sessionStorage.getItem("studentName");

if (!studentId || !studentName) {
  window.location.href = "login.html";
}

// DOM
const pillUserName   = document.getElementById("pillUserName");
const tokenInput     = document.getElementById("tokenInput");
const submitTokenBtn = document.getElementById("submitTokenBtn");
const scanMsg        = document.getElementById("scanMsg");
const logoutBtn      = document.getElementById("logoutBtn");
const startScanBtn   = document.getElementById("startScanBtn");
const lastStatusBox  = document.getElementById("lastStatus");
const lastStatusText = document.getElementById("lastStatusText");

const btnModeQr    = document.getElementById("btnModeQr");
const btnModeToken = document.getElementById("btnModeToken");
const cardQr       = document.getElementById("cardQr");
const cardToken    = document.getElementById("cardToken");

let html5QrcodeInstance = null;
let currentMode = "qr"; // "qr" | "token"

// แสดงชื่อบน pill
if (pillUserName) {
  pillUserName.textContent = `${studentName} (${studentId})`;
}

function setScanMessage(text, type = "error") {
  if (!scanMsg) return;
  scanMsg.textContent = text || "";
  scanMsg.classList.remove("scanMsg-success");
  if (type === "success") {
    scanMsg.classList.add("scanMsg-success");
  }
}

// ====== LOGOUT ======
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("studentId");
    sessionStorage.removeItem("studentName");
    window.location.href = "login.html";
  });
}

// ====== markAttendance ======
async function submitToken(rawToken) {
  const token = (rawToken || "").trim();
  if (!token) {
    setScanMessage("กรุณากรอกรหัส TOKEN", "error");
    return;
  }

  if (submitTokenBtn) {
    submitTokenBtn.disabled = true;
    submitTokenBtn.textContent = "กำลังเช็คชื่อ...";
  }

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

    if (data.success) {
      const statusText =
        data.status === "OK"
          ? "มาเรียน (ON TIME)"
          : data.status === "LATE"
          ? "มาเรียนสาย (LATE)"
          : data.status || "-";

      setScanMessage(`เช็คชื่อสำเร็จ: ${statusText}`, "success");

      if (lastStatusBox && lastStatusText) {
        lastStatusText.textContent = `${statusText} / TOKEN: ${token}`;
        lastStatusBox.style.display = "block";
      }
    } else {
      setScanMessage(data.message || "เช็คชื่อไม่สำเร็จ", "error");
    }
  } catch (err) {
    console.error(err);
    setScanMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
  }

  if (submitTokenBtn) {
    submitTokenBtn.disabled = false;
    submitTokenBtn.textContent = "ยืนยันเช็คชื่อ";
  }
}

// ปุ่มยืนยัน TOKEN
if (submitTokenBtn) {
  submitTokenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    submitToken(tokenInput.value);
  });
}

// กด Enter ในช่อง token
if (tokenInput) {
  tokenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitToken(tokenInput.value);
    }
  });
}

// ====== QR SCANNER ======
function stopScanner() {
  if (html5QrcodeInstance) {
    html5QrcodeInstance
      .stop()
      .then(() => {
        html5QrcodeInstance.clear();
        html5QrcodeInstance = null;
      })
      .catch((err) => {
        console.error("Stop scanner error:", err);
      });
  }
}

function startScanner() {
  const scannerId = "qrScanner";
  const el = document.getElementById(scannerId);
  if (!el) return;

  const initScanner = () => {
    try {
      html5QrcodeInstance = new Html5Qrcode(scannerId);
      html5QrcodeInstance
        .start(
          { facingMode: "environment" },       // กล้องหลัง
          { fps: 10, qrbox: 230 },
          (decodedText) => {
            console.log("QR decoded:", decodedText);
            const token = decodedText.trim();
            if (tokenInput) tokenInput.value = token;
            submitToken(token);
          },
          () => { /* ignore per-frame error */ }
        )
        .catch((err) => {
          console.error("Start scanner error:", err);
          setScanMessage("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง", "error");
        });
    } catch (e) {
      console.error(e);
      setScanMessage("ไม่พบตัวสแกน QR (html5-qrcode)", "error");
    }
  };

  if (html5QrcodeInstance) {
    html5QrcodeInstance
      .stop()
      .then(() => {
        html5QrcodeInstance.clear();
        html5QrcodeInstance = null;
        initScanner();
      })
      .catch((err) => {
        console.error("Stop scanner error:", err);
        initScanner();
      });
  } else {
    initScanner();
  }
}

if (startScanBtn) {
  startScanBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentMode !== "qr") {
      setMode("qr");
    } else {
      startScanner();
    }
  });
}

// ====== MODE SWITCH (QR / TOKEN) ======
function setMode(mode) {
  currentMode = mode;

  if (mode === "qr") {
    cardQr?.classList.remove("hidden");
    cardToken?.classList.add("hidden");

    btnModeQr?.classList.add("active");
    btnModeToken?.classList.remove("active");

    startScanner();          // เปิดกล้องอัตโนมัติเมื่อเลือกโหมดสแกน
  } else {
    cardQr?.classList.add("hidden");
    cardToken?.classList.remove("hidden");

    btnModeQr?.classList.remove("active");
    btnModeToken?.classList.add("active");

    stopScanner();           // ปิดกล้องเมื่อเปลี่ยนไปโหมดกรอก token
  }
}

if (btnModeQr) {
  btnModeQr.addEventListener("click", () => setMode("qr"));
}
if (btnModeToken) {
  btnModeToken.addEventListener("click", () => setMode("token"));
}

// default: เปิดด้วยโหมดสแกน
window.addEventListener("load", () => {
  setMode("qr");
});
