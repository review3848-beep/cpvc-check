// js/student-scan.js
import { API_BASE } from "./api.js";

/* ---------------------------------
 * DOM
 * --------------------------------*/
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
const toastContainer   = document.getElementById("toastContainer");

/* ---------------------------------
 * STATE: student from localStorage
 * ใช้ key กลาง "cpvc_student"
 * --------------------------------*/
function getStudentFromStorage() {
  try {
    const raw = localStorage.getItem("cpvc_student");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.id) return null;
    return obj;
  } catch (e) {
    console.error("parse student error", e);
    return null;
  }
}
const student = getStudentFromStorage();

/* ---------------------------------
 * UI Helpers
 * --------------------------------*/
function setMsg(text, ok = false) {
  if (!scanMsg) return;
  scanMsg.textContent = text || "";
  scanMsg.classList.toggle("scanMsg-success", !!ok);
}

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

function statusLabelFromCode(code) {
  const upper = (code || "").toUpperCase();
  if (upper === "OK") return "มาเรียน";
  if (upper === "LATE") return "มาสาย";
  if (upper === "ABSENT") return "ขาดเรียน";
  return code || "-";
}

/* Toast เล็ก ๆ */
function showToast(message, type = "success") {
  if (!toastContainer) return;
  const div = document.createElement("div");
  div.className = "toast " + (type === "error" ? "toast-error" : "toast-success");
  div.textContent = message;
  toastContainer.appendChild(div);
  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 200);
  }, 2200);
}

/* Popup กลางจอ */
let popupEl, popupBodyEl;
function ensurePopup() {
  if (popupEl) return;

  popupEl = document.createElement("div");
  popupEl.style.position = "fixed";
  popupEl.style.inset = "0";
  popupEl.style.display = "flex";
  popupEl.style.alignItems = "center";
  popupEl.style.justifyContent = "center";
  popupEl.style.background = "rgba(15,23,42,0.78)";
  popupEl.style.backdropFilter = "blur(4px)";
  popupEl.style.zIndex = "9999";
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

  const titleRow = document.createElement("div");
  titleRow.style.display = "flex";
  titleRow.style.alignItems = "center";
  titleRow.style.gap = "8px";
  titleRow.innerHTML = `<span style="font-size:1.1rem;">✅</span><span>เช็คชื่อสำเร็จ</span>`;

  popupBodyEl = document.createElement("div");
  popupBodyEl.style.fontSize = "0.8rem";
  popupBodyEl.style.color = "#cbd5f5";

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.justifyContent = "flex-end";
  btnRow.style.marginTop = "6px";

  const btn = document.createElement("button");
  btn.textContent = "ปิด";
  btn.style.border = "none";
  btn.style.borderRadius = "999px";
  btn.style.padding = "6px 14px";
  btn.style.fontSize = "0.78rem";
  btn.style.cursor = "pointer";
  btn.style.background = "linear-gradient(135deg,#38bdf8,#2563eb)";
  btn.style.color = "#f9fafb";
  btn.onclick = hidePopup;

  btnRow.appendChild(btn);
  box.appendChild(titleRow);
  box.appendChild(popupBodyEl);
  box.appendChild(btnRow);

  popupEl.appendChild(box);
  popupEl.addEventListener("click", (e) => {
    if (e.target === popupEl) hidePopup();
  });

  document.body.appendChild(popupEl);
}

function showPopup(info) {
  ensurePopup();
  if (!popupEl || !popupBodyEl) return;
  const { token, statusLabel } = info;
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

/* ---------------------------------
 * โหลดประวัติการเช็คชื่อ (ถ้ามี student)
 * --------------------------------*/
async function loadHistory() {
  if (!student || !historyList) {
    if (historyCard) historyCard.style.display = "none";
    return;
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "getStudentHistory",
        studentId: student.id
      })
    });
    const data = await res.json();

    if (!data.success || !Array.isArray(data.history)) {
      historyList.innerHTML = "";
      if (historyCount) historyCount.textContent = "–";
      return;
    }

    const rows = data.history.slice().reverse(); // ล่าสุดอยู่บน
    historyList.innerHTML = "";

    rows.forEach((row) => {
      let dt, token, status;
      if (Array.isArray(row)) {
        dt     = row[3] || "";
        token  = row[4] || "";
        status = row[5] || "";
      } else {
        dt     = row.datetime || row.time || "";
        token  = row.token || "";
        status = row.status || "";
      }

      const li = document.createElement("li");

      const main = document.createElement("div");
      main.className = "hist-main";

      const tokenLine = document.createElement("div");
      tokenLine.className = "hist-token";
      tokenLine.textContent = token || "-";

      const timeLine = document.createElement("div");
      timeLine.className = "hist-time";
      timeLine.textContent = dt || "";

      main.appendChild(tokenLine);
      main.appendChild(timeLine);

      const chip = document.createElement("div");
      chip.className = "hist-chip";
      const label = statusLabelFromCode(status);
      chip.textContent = label;

      const upper = (status || "").toUpperCase();
      if (upper === "OK") chip.classList.add("chip-ok");
      else if (upper === "LATE") chip.classList.add("chip-late");
      else if (upper === "ABSENT") chip.classList.add("chip-absent");

      li.appendChild(main);
      li.appendChild(chip);
      historyList.appendChild(li);
    });

    if (historyCount) {
      historyCount.textContent = rows.length
        ? `${rows.length} รายการ`
        : "ไม่มีประวัติ";
    }
  } catch (err) {
    console.error("loadHistory error:", err);
  }
}

/* ---------------------------------
 * เช็คชื่อ markAttendance
 * --------------------------------*/
async function handleSubmitToken() {
  const raw   = (tokenInput?.value || "").trim();
  const token = raw.toUpperCase();

  if (!token) {
    setMsg("กรุณากรอกรหัส TOKEN ก่อนเช็คชื่อ", false);
    setStatusError("กรอกรหัส TOKEN ก่อน");
    return;
  }

  if (!student) {
    setMsg("ไม่พบข้อมูลนักเรียน กรุณาเข้าสู่ระบบใหม่", false);
    setStatusError("กรุณาเข้าสู่ระบบนักเรียนก่อนเช็คชื่อ");
    showToast("กรุณาเข้าสู่ระบบก่อนเช็คชื่อ", "error");
    return;
  }

  setMsg("");
  setStatusNeutral();

  if (submitTokenBtn) {
    submitTokenBtn.disabled = true;
    submitTokenBtn.classList.add("is-loading");
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "markAttendance",
        studentId: student.id,
        studentName: student.name,
        token: token
      })
    });

    const data = await res.json();

    if (!data.success) {
      const msg = data.message || "เช็คชื่อไม่สำเร็จ";
      setMsg(msg, false);
      setStatusError(msg);
      showToast(msg, "error");
      return;
    }

    const statusCode  = (data.status || "").toUpperCase();
    const statusLabel = statusLabelFromCode(statusCode);

    setMsg(`เช็คชื่อสำเร็จ: ${statusLabel}`, true);
    setStatusOpen(`เช็คชื่อสำเร็จ (${statusLabel})`);
    showToast(`เช็คชื่อสำเร็จ (${statusLabel})`, "success");

    if (lastStatusBox && lastStatusText) {
      lastStatusBox.style.display = "block";
      lastStatusText.textContent = `${statusLabel} · TOKEN ${token}`;
    }

    showPopup({ token, statusLabel });
    await loadHistory();
  } catch (err) {
    console.error("markAttendance error:", err);
    setMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", false);
    setStatusError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    showToast("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", "error");
  } finally {
    if (submitTokenBtn) {
      submitTokenBtn.disabled = false;
      submitTokenBtn.classList.remove("is-loading");
    }
  }
}

/* ---------------------------------
 * INIT
 * --------------------------------*/
function init() {
  // ตั้งชื่อบน pill จาก student
  if (student && pillUserName) {
    const label = `${student.name || "นักเรียน"}${student.id ? ` (${student.id})` : ""}`;
    pillUserName.textContent = label;
  } else if (pillUserName) {
    pillUserName.textContent = "นักเรียน";
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
      localStorage.removeItem("cpvc_student");
      window.location.href = "login.html";
    });
  }

  loadHistory();
}

document.addEventListener("DOMContentLoaded", init);
