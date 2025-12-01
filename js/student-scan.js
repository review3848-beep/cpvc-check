// js/student-scan.js
import { API_BASE } from "./api.js";

/* --------------------------
   DOM ELEMENTS
-------------------------- */
const tokenInput       = document.getElementById("tokenInput");
const submitTokenBtn   = document.getElementById("submitTokenBtn");
const scanMsg          = document.getElementById("scanMsg");
const lastStatusBox    = document.getElementById("lastStatus");
const lastStatusText   = document.getElementById("lastStatusText");

const pillUserName     = document.getElementById("pillUserName");
const sessionStatusDot = document.getElementById("sessionStatusDot");
const sessionStatusTxt = document.getElementById("sessionStatusText");

const historyCard      = document.getElementById("historyCard");
const historyList      = document.getElementById("historyList");
const historyCount     = document.getElementById("historyCount");

const logoutBtn        = document.getElementById("logoutBtn");

/* --------------------------
   HELPER: หา student จาก localStorage
   (ลองหลาย key เผื่อไฟล์ login ใช้อันใดอันหนึ่ง)
-------------------------- */
function getStoredStudent() {
  const keys = [
    "nexattend_student",
    "nexAttend_student",
    "nexAttendStudent",
    "cpvc_student",
    "cpvc_student_info",
    "studentInfo"
  ];

  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj && obj.id) {
        return { ...obj, _key: k };
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

const student = getStoredStudent();

/* --------------------------
   POPUP (สร้างด้วย JS)
-------------------------- */
let popupEl = null;
let popupTitleEl = null;
let popupBodyEl = null;
let popupCloseBtn = null;

function ensurePopup() {
  if (popupEl) return;

  popupEl = document.createElement("div");
  popupEl.id = "scanPopup";
  popupEl.style.position = "fixed";
  popupEl.style.inset = "0";
  popupEl.style.display = "flex";
  popupEl.style.alignItems = "center";
  popupEl.style.justifyContent = "center";
  popupEl.style.background = "rgba(15,23,42,0.78)";
  popupEl.style.zIndex = "9999";
  popupEl.style.backdropFilter = "blur(4px)";
  popupEl.style.opacity = "0";
  popupEl.style.pointerEvents = "none";
  popupEl.style.transition = "opacity 0.15s ease-out";

  const box = document.createElement("div");
  box.style.minWidth = "260px";
  box.style.maxWidth = "320px";
  box.style.borderRadius = "18px";
  box.style.padding = "16px 18px 14px";
  box.style.background = "linear-gradient(145deg,#020617,#020617)";
  box.style.border = "1px solid rgba(56,189,248,0.6)";
  box.style.boxShadow = "0 22px 60px rgba(0,0,0,0.9)";
  box.style.color = "#e5e7eb";
  box.style.fontFamily = '"Prompt",system-ui,sans-serif';
  box.style.fontSize = "0.9rem";
  box.style.display = "flex";
  box.style.flexDirection = "column";
  box.style.gap = "6px";

  popupTitleEl = document.createElement("div");
  popupTitleEl.style.display = "flex";
  popupTitleEl.style.alignItems = "center";
  popupTitleEl.style.gap = "8px";
  popupTitleEl.innerHTML = `<span style="font-size:1.1rem;">✅</span><span>เช็คชื่อสำเร็จ</span>`;

  popupBodyEl = document.createElement("div");
  popupBodyEl.style.fontSize = "0.8rem";
  popupBodyEl.style.color = "#cbd5f5";

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.justifyContent = "flex-end";
  btnRow.style.marginTop = "6px";

  popupCloseBtn = document.createElement("button");
  popupCloseBtn.textContent = "ปิด";
  popupCloseBtn.style.border = "none";
  popupCloseBtn.style.borderRadius = "999px";
  popupCloseBtn.style.padding = "6px 14px";
  popupCloseBtn.style.fontSize = "0.78rem";
  popupCloseBtn.style.cursor = "pointer";
  popupCloseBtn.style.background =
    "linear-gradient(135deg, #38bdf8, #2563eb)";
  popupCloseBtn.style.color = "#f9fafb";
  popupCloseBtn.addEventListener("click", hidePopup);

  btnRow.appendChild(popupCloseBtn);

  box.appendChild(popupTitleEl);
  box.appendChild(popupBodyEl);
  box.appendChild(btnRow);

  popupEl.appendChild(box);
  popupEl.addEventListener("click", (e) => {
    if (e.target === popupEl) hidePopup();
  });

  document.body.appendChild(popupEl);
}

function showPopup({ token, statusLabel }) {
  ensurePopup();
  if (!popupEl || !popupBodyEl) return;

  popupBodyEl.innerHTML = `
    <div>รหัส TOKEN: <strong>${token}</strong></div>
    <div>สถานะ: <strong>${statusLabel}</strong></div>
    <div style="margin-top:4px;font-size:0.75rem;color:#9ca3af">
      ระบบบันทึกเวลาเข้าเรียนเรียบร้อยแล้ว
    </div>
  `;

  popupEl.style.opacity = "1";
  popupEl.style.pointerEvents = "auto";
}

function hidePopup() {
  if (!popupEl) return;
  popupEl.style.opacity = "0";
  popupEl.style.pointerEvents = "none";
}

/* --------------------------
   STATUS BAR
-------------------------- */
function setStatusNeutral() {
  if (!sessionStatusDot || !sessionStatusTxt) return;
  sessionStatusDot.classList.remove("open", "error");
  sessionStatusTxt.textContent = "รอกรอก TOKEN เพื่อเช็คชื่อ";
}

function setStatusOpen(text) {
  if (!sessionStatusDot || !sessionStatusTxt) return;
  sessionStatusDot.classList.remove("error");
  sessionStatusDot.classList.add("open");
  sessionStatusTxt.textContent = text || "เช็คชื่อสำเร็จ";
}

function setStatusError(text) {
  if (!sessionStatusDot || !sessionStatusTxt) return;
  sessionStatusDot.classList.remove("open");
  sessionStatusDot.classList.add("error");
  sessionStatusTxt.textContent = text || "ไม่สามารถเช็คชื่อได้";
}

/* --------------------------
   SMALL HELPERS
-------------------------- */
function setMsg(text, ok = false) {
  if (!scanMsg) return;
  scanMsg.textContent = text || "";
  scanMsg.classList.toggle("scanMsg-success", !!ok);
}

function statusLabelFromCode(code) {
  if (code === "OK") return "มาเรียน";
  if (code === "LATE") return "มาสาย";
  if (code === "ABSENT") return "ขาดเรียน";
  return code || "-";
}

/* --------------------------
   LOAD HISTORY (ใช้ getStudentHistory เดิม)
   EXPECT: history = [ [teacherEmail, studentId, studentName, datetime, token, status], ... ]
-------------------------- */
async function loadHistory() {
  if (!student || !historyList) return;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getStudentHistory",
        studentId: student.id,
      }),
    });
    const data = await res.json();

    if (!data.success || !Array.isArray(data.history)) {
      historyList.innerHTML = "";
      if (historyCount) historyCount.textContent = "–";
      return;
    }

    const rows = data.history.slice().reverse(); // เอาอันล่าสุดขึ้นก่อน
    historyList.innerHTML = "";

    rows.forEach((r) => {
      // รองรับทั้งแบบ array ดิบ และ object (เผื่ออนาคตคุณไป join วิชาใน GAS)
      let dt, token, status;

      if (Array.isArray(r)) {
        dt     = r[3] || "";
        token  = r[4] || "";
        status = r[5] || "";
      } else if (typeof r === "object" && r !== null) {
        dt     = r.datetime || r.time || "";
        token  = r.token || "";
        status = r.status || "";
      }

      const li = document.createElement("li");

      const main = document.createElement("div");
      main.className = "hist-main";

      const line1 = document.createElement("div");
      line1.className = "hist-token";
      line1.textContent = token || "-";

      const line2 = document.createElement("div");
      line2.className = "hist-time";
      line2.textContent = dt || "";

      main.appendChild(line1);
      main.appendChild(line2);

      const chip = document.createElement("div");
      chip.className = "hist-chip";

      const label = statusLabelFromCode(status);
      chip.textContent = label;

      const upper = status.toUpperCase();
      if (upper === "OK") chip.classList.add("chip-ok");
      else if (upper === "LATE") chip.classList.add("chip-late");
      else if (upper === "ABSENT") chip.classList.add("chip-absent");

      li.appendChild(main);
      li.appendChild(chip);
      historyList.appendChild(li);
    });

    if (historyCount) {
      historyCount.textContent =
        rows.length ? `${rows.length} รายการ` : "ไม่มีประวัติ";
    }
  } catch (err) {
    console.error("loadHistory error:", err);
  }
}

/* --------------------------
   HANDLE MARK ATTENDANCE
-------------------------- */
async function handleSubmitToken() {
  if (!student) return;

  const raw = (tokenInput?.value || "").trim();
  const token = raw.toUpperCase();

  if (!token) {
    setMsg("กรุณากรอกรหัส TOKEN", false);
    setStatusError("กรอกรหัส TOKEN ก่อนเช็คชื่อ");
    return;
  }

  setMsg("");
  setStatusNeutral();

  if (submitTokenBtn) {
    submitTokenBtn.classList.add("is-loading");
    submitTokenBtn.disabled = true;
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "markAttendance",
        studentId: student.id,
        studentName: student.name,
        token: token,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      const msg = data.message || "เช็คชื่อไม่สำเร็จ";
      setMsg(msg, false);
      setStatusError(msg);
      return;
    }

    const statusCode = (data.status || "").toUpperCase();
    const label = statusLabelFromCode(statusCode);

    setMsg(`เช็คชื่อสำเร็จ: ${label}`, true);
    setStatusOpen(`เช็คชื่อสำเร็จ (${label})`);

    if (lastStatusBox && lastStatusText) {
      lastStatusBox.style.display = "block";
      lastStatusText.textContent = `${label} · TOKEN ${token}`;
    }

    // แสดง popup หลังเช็คชื่อเสร็จ
    showPopup({ token, statusLabel: label });

    // โหลดประวัติใหม่
    await loadHistory();
  } catch (err) {
    console.error("markAttendance error:", err);
    setMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", false);
    setStatusError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
  } finally {
    if (submitTokenBtn) {
      submitTokenBtn.classList.remove("is-loading");
      submitTokenBtn.disabled = false;
    }
  }
}

/* --------------------------
   INIT
-------------------------- */
function init() {
  if (!student) {
    // ถ้าไม่มีข้อมูล login ให้เด้งกลับหน้า login ของนักเรียน
    window.location.href = "login.html";
    return;
  }

  if (pillUserName) {
    // แสดงชื่อ + รหัส
    const raw = `${student.name || "นักเรียน"}${
      student.id ? ` (${student.id})` : ""
    }`;
    pillUserName.textContent = raw;
  }

  setStatusNeutral();

  if (submitTokenBtn) {
    submitTokenBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSubmitToken();
    });
  }

  if (tokenInput) {
    tokenInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitToken();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // ล้างทุก key ที่อาจใช้เก็บ student
      ["nexattend_student","nexAttend_student","nexAttendStudent","cpvc_student","cpvc_student_info","studentInfo"].forEach(
        (k) => localStorage.removeItem(k)
      );
      window.location.href = "login.html";
    });
  }

  loadHistory();
}

// รอ DOM พร้อม
document.addEventListener("DOMContentLoaded", init);
