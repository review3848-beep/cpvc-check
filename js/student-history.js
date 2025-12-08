// js/student-history.js

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

  // DOM refs
  const histNameEl = document.getElementById("histName");
  const histIdEl = document.getElementById("histId");
  const historyTableBody = document.getElementById("historyTable");
  const msgBox = document.getElementById("msg");

  // แสดงชื่อ + รหัสบนแถบนำทาง
  if (histNameEl) {
    histNameEl.textContent =
      student.name || student.studentName || "นักเรียน";
  }
  if (histIdEl) {
    histIdEl.textContent = student.studentId || "";
  }

  function setMessage(text) {
    if (!msgBox) return;
    msgBox.textContent = text || "";
  }

  function clearTable() {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = "";
  }

  function statusToLabelAndClass(statusRaw) {
    const s = (statusRaw || "").toString().trim().toUpperCase();
    if (s === "OK" || s === "PRESENT" || s === "P") {
      return { label: "มาเรียน", className: "status-ok" };
    }
    if (s === "LATE") {
      return { label: "มาสาย", className: "status-late" };
    }
    if (s === "ABSENT" || s === "A") {
      return { label: "ขาดเรียน", className: "status-absent" };
    }
    return { label: statusRaw || "-", className: "" };
  }

  function renderHistory(rows) {
    if (!historyTableBody) return;
    clearTable();

    if (!rows || rows.length === 0) {
      setMessage("ยังไม่มีประวัติการเช็คชื่อ");
      return;
    }

    setMessage("");

    rows.forEach((item) => {
      const tr = document.createElement("tr");

      const subject =
        item.subjectName || item.subject || item.course || "-";

      const time =
        item.timestamp ||
        item.checkTime ||
        item.time ||
        item.dateTime ||
        "-";

      const statusRaw = item.status || item.attendanceStatus || "";
      const { label, className } = statusToLabelAndClass(statusRaw);

      const tdSubject = document.createElement("td");
      tdSubject.textContent = subject;

      const tdTime = document.createElement("td");
      tdTime.textContent = time;

      const tdStatus = document.createElement("td");
      tdStatus.textContent = label;
      if (className) {
        tdStatus.classList.add(className);
      }

      tr.appendChild(tdSubject);
      tr.appendChild(tdTime);
      tr.appendChild(tdStatus);

      historyTableBody.appendChild(tr);
    });
  }

  async function loadHistory() {
    setMessage("กำลังโหลดประวัติการเช็คชื่อ...");
    clearTable();

    const resp = await callStudentApi("getStudentHistory", {
      studentId: student.studentId,
    });

    if (!resp || !resp.success) {
      const msg =
        resp && resp.message
          ? resp.message
          : "ไม่สามารถโหลดประวัติการเข้าเรียนได้";
      setMessage(msg);
      return;
    }

    const history = resp.history || resp.data || [];
    renderHistory(history);
  }

  // โหลดครั้งแรก
  loadHistory();
});
