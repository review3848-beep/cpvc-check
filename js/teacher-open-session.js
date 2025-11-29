// js/teacher-open-session.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl   = document.getElementById("teacherName");
  const subjectEl= document.getElementById("subjectCode");
  const roomEl   = document.getElementById("room");
  const openBtn  = document.getElementById("openSessionBtn");
  const closeBtn = document.getElementById("closeSessionBtn");
  const tokenBox = document.getElementById("tokenBox");
  const tokenEl  = document.getElementById("token");
  const statusEl = document.getElementById("sessionStatus");
  const msgEl    = document.getElementById("msg");

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  // ===== 1) อ่านข้อมูลครูจาก sessionStorage =====
  let teacher = null;
  const raw = sessionStorage.getItem("teacher");
  if (!raw) {
    // ไม่มี session → เด้งกลับไปหน้า login
    window.location.href = "login.html";
    return;
  }

  try {
    teacher = JSON.parse(raw);
  } catch (e) {
    sessionStorage.removeItem("teacher");
    window.location.href = "login.html";
    return;
  }

  if (!teacher || !teacher.email) {
    sessionStorage.removeItem("teacher");
    window.location.href = "login.html";
    return;
  }

  // แสดงชื่อครูบนหน้า
  nameEl.textContent = teacher.name || teacher.email;

  let currentToken = null;

  // ===== 2) เปิดคาบ =====
  openBtn.addEventListener("click", async () => {
    const subject = (subjectEl.value || "").trim();
    const room    = (roomEl.value || "").trim();

    if (!subject || !room) {
      setMsg("กรุณากรอกรายวิชาและห้องเรียนให้ครบ");
      return;
    }

    openBtn.disabled = true;
    closeBtn.disabled = true;
    setMsg("กำลังเปิดคาบ...", true);

    try {
      const res = await callApi("openSession", {
        teacherEmail: teacher.email,
        subject,
        room,
      });

      currentToken = res.token;

      tokenBox.style.display = "block";
      tokenEl.textContent = currentToken;
      statusEl.textContent = "สถานะคาบ: กำลังเปิด (OPEN)";

      openBtn.disabled = true;
      closeBtn.disabled = false;

      setMsg("เปิดคาบเรียบร้อย ส่ง TOKEN ให้นักเรียนได้เลย", true);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "เปิดคาบไม่สำเร็จ", false);
      openBtn.disabled = false;
      closeBtn.disabled = true;
    }
  });

  // ===== 3) ปิดคาบ =====
  closeBtn.addEventListener("click", async () => {
    if (!currentToken) {
      setMsg("ยังไม่พบ TOKEN ของคาบนี้", false);
      return;
    }

    openBtn.disabled = true;
    closeBtn.disabled = true;
    setMsg("กำลังปิดคาบและสรุปมา/ขาด...", true);

    try {
      const res = await callApi("closeSession", { token: currentToken });
      statusEl.textContent = "สถานะคาบ: ปิดคาบแล้ว (CLOSED)";
      setMsg(res.message || "ปิดคาบเรียบร้อย", true);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "ปิดคาบไม่สำเร็จ", false);
      closeBtn.disabled = false;
    }
  });
});
