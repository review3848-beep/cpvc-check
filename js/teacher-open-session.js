// js/teacher-open-session.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl          = document.getElementById("teacherName");
  const subjectInput    = document.getElementById("subjectCode");
  const roomInput       = document.getElementById("room");
  const statusEl        = document.getElementById("sessionStatus");
  const openBtn         = document.getElementById("openSessionBtn");
  const closeBtn        = document.getElementById("closeSessionBtn");
  const tokenBox        = document.getElementById("tokenBox");
  const tokenEl         = document.getElementById("token");
  const msgEl           = document.getElementById("msg");
  const qrCanvas        = document.getElementById("qrCanvas");

  let currentToken = null;
  let qrInstance   = null;

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  // ✅ ดึงข้อมูลครูจาก sessionStorage
  let teacher = null;
  try {
    const raw = sessionStorage.getItem("teacher");
    if (raw) teacher = JSON.parse(raw);
  } catch (e) {
    teacher = null;
  }

  if (!teacher || !teacher.email) {
    // ถ้าไม่มี session ครู → เด้งกลับหน้า login
    window.location.href = "login.html";
    return;
  }

  nameEl.textContent = teacher.name || teacher.email;

  // ---------------- HELPER: สร้าง URL สำหรับฝั่งนักเรียนสแกน ----------------
  const buildScanUrl = (token) => {
    // base = "/cpvc-check" จาก "/cpvc-check/teacher/open-session.html"
    const path = window.location.pathname;
    const base = path.split("/teacher/")[0]; // "/cpvc-check"
    return `${window.location.origin}${base}/student/scan.html?token=${encodeURIComponent(token)}`;
  };

  // ---------------- HELPER: render QR ----------------
  const renderQR = (token) => {
    const url = buildScanUrl(token);

    if (!qrInstance) {
      qrInstance = new QRious({
        element: qrCanvas,
        size: 220,
        level: "H",
      });
    }
    qrInstance.value = url;
  };

  // ---------------- เปิดคาบ ----------------
  openBtn.addEventListener("click", async () => {
    const subject = (subjectInput.value || "").trim();
    const room    = (roomInput.value || "").trim();

    if (!subject || !room) {
      setMsg("กรุณากรอกรายวิชาและห้องให้ครบ");
      return;
    }

    openBtn.disabled  = true;
    closeBtn.disabled = true;
    setMsg("กำลังเปิดคาบเรียน...");

    try {
      const res = await callApi("openSession", {
        teacherEmail: teacher.email,
        subject,
        room,
      });

      currentToken = res.token;
      tokenEl.textContent = currentToken || "------";
      tokenBox.style.display = "block";

      statusEl.textContent = "สถานะคาบ: เปิดคาบแล้ว (OPEN)";
      setMsg("เปิดคาบสำเร็จ – TOKEN และ QR พร้อมใช้งาน", true);

      // ✅ สร้าง QR ทันทีเมื่อเปิดคาบสำเร็จ
      renderQR(currentToken);

      // เปิดสิทธิ์ให้ปิดคาบได้
      closeBtn.disabled = false;
    } catch (err) {
      console.error(err);
      setMsg(err.message || "เปิดคาบไม่สำเร็จ");
      currentToken = null;
      tokenBox.style.display = "none";
      statusEl.textContent = "สถานะคาบ: ยังไม่เปิดคาบ";
    } finally {
      openBtn.disabled = false;
    }
  });

  // ---------------- ปิดคาบ ----------------
  closeBtn.addEventListener("click", async () => {
    if (!currentToken) {
      setMsg("ยังไม่มี TOKEN สำหรับปิดคาบ");
      return;
    }

    closeBtn.disabled = true;
    openBtn.disabled  = true;
    setMsg("กำลังปิดคาบเรียน...");

    try {
      const res = await callApi("closeSession", { token: currentToken });
      setMsg(res.message || "ปิดคาบเรียบร้อย", true);
      statusEl.textContent = "สถานะคาบ: ปิดคาบแล้ว (CLOSED)";
    } catch (err) {
      console.error(err);
      setMsg(err.message || "ปิดคาบไม่สำเร็จ");
      closeBtn.disabled = false;
      openBtn.disabled  = false;
    }
  });
});
