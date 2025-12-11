// js/student-scan.js
// ใช้ API กลางเดียวกับฝั่งครู
import { callApi } from "./api.js";

// ================= POPUP SUCCESS (inline style) =================
function showSuccessPopup(msg) {
  const overlay = document.createElement("div");
  overlay.className = "scan-success-overlay";

  // สไตล์ overlay
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(15, 23, 42, 0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
    backdropFilter: "blur(4px)",
  });

  const modal = document.createElement("div");
  modal.className = "scan-success-modal";
  Object.assign(modal.style, {
    background:
      "radial-gradient(circle at 0% 0%, rgba(34,197,94,0.25), #020617)",
    borderRadius: "20px",
    padding: "1.8rem 2rem",
    border: "1px solid rgba(34,197,94,0.7)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.65)",
    maxWidth: "360px",
    width: "90%",
    textAlign: "center",
    color: "#e5e7eb",
    transform: "scale(0.9)",
    opacity: "0",
    transition: "opacity 0.22s ease-out, transform 0.22s ease-out",
    fontFamily: '"Inter", system-ui, sans-serif',
  });

  const title = document.createElement("div");
  title.textContent = "เช็คชื่อสำเร็จ 🎉";
  Object.assign(title.style, {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.35rem",
  });

  const text = document.createElement("p");
  text.textContent = msg || "บันทึกการเข้าเรียนเรียบร้อยแล้ว";
  Object.assign(text.style, {
    fontSize: "0.95rem",
    marginBottom: "0.4rem",
  });

  const sub = document.createElement("p");
  sub.textContent = "กำลังพาไปหน้า Dashboard ...";
  Object.assign(sub.style, {
    fontSize: "0.8rem",
    opacity: "0.75",
  });

  modal.appendChild(title);
  modal.appendChild(text);
  modal.appendChild(sub);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // ทำให้ modal ค่อย ๆ โผล่
  requestAnimationFrame(() => {
    modal.style.opacity = "1";
    modal.style.transform = "scale(1)";
  });
}

// ===== จัดการ session นักเรียน =====
function getCurrentStudent() {
  try {
    const raw = localStorage.getItem("cpvc_student");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("อ่าน cpvc_student จาก localStorage ไม่ได้:", err);
    localStorage.removeItem("cpvc_student");
    return null;
  }
}

function requireStudentLogin() {
  const st = getCurrentStudent();
  if (!st) {
    window.location.href = "login.html";
    return null;
  }
  return st;
}

document.addEventListener("DOMContentLoaded", () => {
  const student = requireStudentLogin();
  if (!student) return;

  // ===== DOM refs =====
  const pillUserName   = document.getElementById("pillUserName");
  const tokenInput     = document.getElementById("tokenInput");
  const submitTokenBtn = document.getElementById("submitTokenBtn");
  const scanMsg        = document.getElementById("scanMsg");
  const statusDot      = document.getElementById("sessionStatusDot");
  const statusText     = document.getElementById("sessionStatusText");

  // ตั้งชื่อบน pill
  if (pillUserName) {
    const name =
      student.name ||
      student.studentName ||
      `${student.studentId || ""}`.trim() ||
      "นักเรียน";
    pillUserName.textContent = name;
  }

  // ฟังก์ชันช่วยปรับสถานะจุดด้านบน
  function setStatus(state, text) {
    if (statusText && text) {
      statusText.textContent = text;
    }

    if (!statusDot) return;

    statusDot.classList.remove("open", "error");

    switch (state) {
      case "open":
        statusDot.classList.add("open");
        break;
      case "error":
        statusDot.classList.add("error");
        break;
      default:
        break;
    }
  }

  function setScanMessage(text, type) {
    if (!scanMsg) return;
    scanMsg.textContent = text || "";
    scanMsg.classList.remove("scanMsg-success");

    if (type === "success") {
      scanMsg.classList.add("scanMsg-success");
    }
  }

  function setLoading(isLoading) {
    if (!submitTokenBtn) return;
    submitTokenBtn.disabled = isLoading;
    submitTokenBtn.textContent = isLoading ? "กำลังเช็คชื่อ..." : "ยืนยันเช็คชื่อ";
  }

  if (!tokenInput || !submitTokenBtn) {
    console.warn("เช็ก id: tokenInput, submitTokenBtn ใน HTML อีกที");
    return;
  }

  // ================= Handle Submit =================
  async function handleSubmitToken() {
    setScanMessage("", "");
    setStatus(null, "กำลังตรวจสอบ TOKEN...");
    setLoading(true);

    let token = (tokenInput.value || "").trim();
    if (!token) {
      setLoading(false);
      setStatus(null, "กรุณากรอก TOKEN เพื่อเช็คชื่อ");
      setScanMessage("กรุณากรอก TOKEN ที่ได้รับจากครู", "error");
      return;
    }

    token = token.toUpperCase();

    const payload = {
      studentId: student.studentId,
      studentName: student.name || student.studentName || "",
      studentEmail: student.email || "",
      token,
    };

    let resp;
    try {
      resp = await callApi("markAttendance", payload);
    } catch (err) {
      console.error("callApi error:", err);
      setLoading(false);
      setStatus("error", "ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ");
      setScanMessage("เช็คชื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
      return;
    }

    setLoading(false);

    if (!resp || !resp.success) {
      const msg =
        resp && resp.message
          ? resp.message
          : "เช็คชื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

      setStatus("error", msg);
      setScanMessage(msg, "error");
      return;
    }

    // ---------------- เช็คชื่อสำเร็จ ----------------
    const statusRaw = (resp.status || resp.attendanceStatus || "").toUpperCase();

    let statusLabel = "เช็คชื่อสำเร็จ";
    if (statusRaw === "LATE") statusLabel = "เช็คชื่อสำเร็จ (มาสาย)";
    if (statusRaw === "ABSENT") statusLabel = "บันทึกเป็นขาด";

    const finalMsg = resp.message || statusLabel;

    setStatus("open", "บันทึกการเข้าเรียนเรียบร้อย");
    setScanMessage(finalMsg, "success");

    // ⭐ แสดง Popup เท่ ๆ
    showSuccessPopup(finalMsg);

    tokenInput.value = "";

    // ⭐ เด้งไป Dashboard หลังจาก 1.5 วินาที
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  }

  submitTokenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleSubmitToken();
  });

  tokenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitToken();
    }
  });

  setStatus(null, "รอกรอก TOKEN เพื่อเช็คชื่อ");
});
