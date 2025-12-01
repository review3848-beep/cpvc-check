// student-scan.js
// หน้านักเรียนเช็คชื่อด้วย TOKEN (ไม่ใช้ QR แล้ว)

import { API_BASE } from "./api.js";

// --------- DOM ELEMENTS ---------
const pillUserName      = document.getElementById("pillUserName");
const sessionStatusDot  = document.getElementById("sessionStatusDot");
const sessionStatusText = document.getElementById("sessionStatusText");

const tokenInput     = document.getElementById("tokenInput");
const submitTokenBtn = document.getElementById("submitTokenBtn");
const scanMsg        = document.getElementById("scanMsg");
const lastStatusBox  = document.getElementById("lastStatus");
const lastStatusText = document.getElementById("lastStatusText");

const historyCard  = document.getElementById("historyCard");
const historyList  = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");

const logoutBtn      = document.getElementById("logoutBtn");
const toastContainer = document.getElementById("toastContainer");

const STORAGE_KEY_STUDENT = "nexStudent"; // ต้องตรงกับตอน login ใช้เก็บ

// ================== helpers ==================

function loadStudent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadStudent error", e);
    return null;
  }
}

function setStudentPill() {
  const s = loadStudent();
  if (!s) {
    if (pillUserName) pillUserName.textContent = "-";
    return;
  }
  pillUserName.textContent = s.name || s.id || "-";
}

function setStatus(text, mode = "idle") {
  if (sessionStatusText) sessionStatusText.textContent = text;
  if (!sessionStatusDot) return;

  // reset class
  sessionStatusDot.className = "status-dot";
  if (mode === "open") sessionStatusDot.classList.add("status-open");
  else if (mode === "closed") sessionStatusDot.classList.add("status-closed");
  else if (mode === "error") sessionStatusDot.classList.add("status-error");
}

function setScanMsg(text, type = "error") {
  if (!scanMsg) return;
  scanMsg.textContent = text;
  scanMsg.classList.remove("scanMsg-success");
  if (type === "success") scanMsg.classList.add("scanMsg-success");
}

function showToast(message, type = "error") {
  if (!toastContainer) {
    // fallback
    console.log(message);
    return;
  }
  const div = document.createElement("div");
  div.className = "toast " + (type === "success" ? "toast-success" : "toast-error");
  div.textContent = message;
  toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = !!isLoading;
  btn.classList.toggle("is-loading", !!isLoading);
}

// call GAS backend
async function postToApi(body) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("HTTP " + res.status);
  }
  return await res.json();
}

// ================== handle token ==================

async function handleTokenSubmit() {
  const raw = tokenInput?.value || "";
  const token = String(raw).trim().toUpperCase();

  const student = loadStudent();
  if (!student || !student.id) {
    setScanMsg("ไม่พบนักเรียนในเครื่องนี้ กรุณาเข้าสู่ระบบใหม่");
    showToast("ไม่พบนักเรียน กรุณาเข้าสู่ระบบใหม่", "error");
    return;
  }

  if (!token) {
    setScanMsg("กรุณากรอกรหัส TOKEN");
    return;
  }

  setButtonLoading(submitTokenBtn, true);
  setScanMsg("กำลังเช็คชื่อ...");
  setStatus("กำลังส่งข้อมูลเช็คชื่อ...", "idle");

  try {
    const data = await postToApi({
      action: "markAttendance",
      studentId: student.id,
      studentName: student.name || "",
      token: token,
    });

    if (!data.success) {
      const msg = data.message || "เช็คชื่อไม่สำเร็จ";
      setScanMsg(msg);
      setStatus("เช็คชื่อไม่สำเร็จ", "error");
      showToast(msg, "error");
      return;
    }

    // status จาก backend: OK / LATE / ABSENT
    const st = String(data.status || "OK").toUpperCase();
    let textStatus = "";
    if (st === "OK") textStatus = "มาเรียน (ตรงเวลา)";
    else if (st === "LATE") textStatus = "มาเรียนสาย";
    else if (st === "ABSENT") textStatus = "ขาด";
    else textStatus = st;

    setScanMsg("เช็คชื่อสำเร็จ: " + textStatus, "success");
    setStatus("เช็คชื่อสำเร็จ", "open");
    showToast("เช็คชื่อสำเร็จ", "success");

    if (lastStatusBox && lastStatusText) {
      lastStatusText.textContent = textStatus + " | TOKEN: " + token;
      lastStatusBox.style.display = "block";
    }

    // โหลดประวัติใหม่
    await loadHistory();
  } catch (e) {
    console.error(e);
    setScanMsg("เช็คชื่อผิดพลาด: " + e.message);
    setStatus("เช็คชื่อผิดพลาด", "error");
    showToast("เช็คชื่อผิดพลาด", "error");
  } finally {
    setButtonLoading(submitTokenBtn, false);
  }
}

// ================== history ==================

async function loadHistory() {
  const student = loadStudent();
  if (!student || !student.id) {
    historyCard?.classList.add("hidden");
    return;
  }

  try {
    const data = await postToApi({
      action: "getStudentHistory",
      studentId: student.id,
    });

    if (!data.success) {
      historyCard?.classList.add("hidden");
      return;
    }

    const rows = data.history || [];
    if (!historyList || !historyCount) return;

    historyList.innerHTML = "";
    historyCount.textContent = rows.length
      ? rows.length + " รายการ"
      : "ยังไม่มีข้อมูล";

    // เอาแค่ 5 รายการล่าสุด
    rows.slice(-5).reverse().forEach((r) => {
      // r = [ TEACHER_EMAIL, STUDENT_ID, STUDENT_NAME, DATETIME, TOKEN, STATUS ]
      const dt     = r[3] || "";
      const token  = r[4] || "";
      const status = String(r[5] || "").toUpperCase();

      const li = document.createElement("li");
      li.className = "history-item";

      const left = document.createElement("div");
      left.className = "hist-main";

      const subj = document.createElement("div");
      subj.className = "hist-subject";
      subj.textContent = "TOKEN: " + token;

      const room = document.createElement("div");
      room.className = "hist-room";
      room.textContent = dt;

      left.appendChild(subj);
      left.appendChild(room);

      const right = document.createElement("div");
      right.className = "hist-meta";

      const chip = document.createElement("span");
      chip.className = "status-chip";

      if (status === "OK") chip.classList.add("chip-ok");
      else if (status === "LATE") chip.classList.add("chip-late");
      else if (status === "ABSENT") chip.classList.add("chip-absent");

      chip.textContent =
        status === "OK" ? "มา" :
        status === "LATE" ? "สาย" :
        status === "ABSENT" ? "ขาด" : status;

      right.appendChild(chip);

      li.appendChild(left);
      li.appendChild(right);
      historyList.appendChild(li);
    });

    historyCard?.classList.remove("hidden");
  } catch (e) {
    console.error("loadHistory error", e);
  }
}

// ================== logout ==================

logoutBtn?.addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY_STUDENT);
  } catch (e) {
    console.error(e);
  }
  window.location.href = "login.html";
});

// ================== events ==================

submitTokenBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  handleTokenSubmit();
});

tokenInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleTokenSubmit();
  }
});

// ================== init ==================

window.addEventListener("DOMContentLoaded", () => {
  setStudentPill();
  setStatus("รอกรอก TOKEN เพื่อเช็คชื่อ", "idle");
  loadHistory().catch((e) => console.error(e));
});
