// js/student-scan.js

// ================= CONFIG API =================
// ถ้าใช้ไฟล์ api.js และมีตัวแปร API_BASE อยู่แล้ว จะใช้ API_BASE อัตโนมัติ
// ถ้าไม่ได้ใช้ api.js ให้แก้ "YOUR_GAS_WEB_APP_EXEC_URL" เป็น URL /exec ของ Web App GAS
const API_ENDPOINT =
  typeof API_BASE !== "undefined"
    ? API_BASE
    : "YOUR_GAS_WEB_APP_EXEC_URL"; // แก้ตรงนี้ถ้าไม่ได้ใช้ api.js

// helper เรียก API ฝั่ง GAS
async function callStudentApi(action, payload) {
  if (!API_ENDPOINT || API_ENDPOINT.startsWith("YOUR_GAS_WEB_APP")) {
    console.error("ยังไม่ได้ตั้งค่า API_ENDPOINT ให้ถูกต้อง");
    return { success: false, message: "API ยังไม่พร้อมใช้งาน (ยังไม่ได้ตั้งค่า URL)" };
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("callStudentApi error:", err);
    return { success: false, message: "ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ" };
  }
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
  const pillUserName = document.getElementById("pillUserName");
  const tokenInput = document.getElementById("tokenInput");
  const submitTokenBtn = document.getElementById("submitTokenBtn");
  const scanMsg = document.getElementById("scanMsg");
  const statusDot = document.getElementById("sessionStatusDot");
  const statusText = document.getElementById("sessionStatusText");

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
        // default = neutral grey ตาม CSS เดิม
        break;
    }
  }

  function setScanMessage(text, type) {
    if (!scanMsg) return;
    scanMsg.textContent = text || "";
    scanMsg.classList.remove("scanMsg-success");
    if (!text) return;

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

    const resp = await callStudentApi("markAttendance", payload);

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

    tokenInput.value = "";
  }

  // คลิกปุ่ม = ส่ง TOKEN
  submitTokenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleSubmitToken();
  });

  // กด Enter ในช่อง TOKEN = ส่งเหมือนกัน
  tokenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitToken();
    }
  });

  // สถานะเริ่มต้น
  setStatus(null, "รอกรอก TOKEN เพื่อเช็คชื่อ");
});
