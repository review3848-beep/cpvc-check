// js/teacher-open-session.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const teacherJson = sessionStorage.getItem("teacher");
  if (!teacherJson) {
    // ถ้ายังไม่ล็อกอินครู ให้เด้งกลับหน้า login
    window.location.href = "../teacher/login.html";
    return;
  }

  const teacher = JSON.parse(teacherJson);
  const teacherNameEl   = document.getElementById("teacherName");
  const subjectInput    = document.getElementById("subjectCode");
  const roomInput       = document.getElementById("room");
  const statusEl        = document.getElementById("sessionStatus");
  const openBtn         = document.getElementById("openSessionBtn");
  const closeBtn        = document.getElementById("closeSessionBtn");
  const tokenBox        = document.getElementById("tokenBox");
  const tokenEl         = document.getElementById("token");
  const qrSection       = document.getElementById("qrSection");
  const qrBox           = document.getElementById("qrCode");
  const msgEl           = document.getElementById("msg");

  teacherNameEl.textContent = teacher.name || "-";

  let currentToken = null;

  // เปิดคาบ
  openBtn.addEventListener("click", async () => {
    msgEl.textContent = "";
    const subject = subjectInput.value.trim();
    const room    = roomInput.value.trim();

    if (!subject || !room) {
      msgEl.textContent = "กรุณากรอกวิชาและห้องให้ครบ";
      msgEl.style.color = "#f97373";
      return;
    }

    openBtn.disabled  = true;
    closeBtn.disabled = true;
    msgEl.textContent = "กำลังเปิดคาบ...";
    msgEl.style.color = "#e5e7eb";

    try {
      const res = await callApi("openSession", {
        teacherEmail: teacher.email,
        subject,
        room,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "เปิดคาบไม่สำเร็จ");
      }

      currentToken = res.token;
      tokenEl.textContent = currentToken;
      tokenBox.style.display = "block";

      statusEl.textContent = "สถานะคาบ: กำลังเปิดคาบ (OPEN)";
      msgEl.textContent = "เปิดคาบเรียบร้อย สามารถให้เด็กสแกนหรือกรอก TOKEN ได้แล้ว ✅";
      msgEl.style.color = "#4ade80";

      // แสดง QR CODE จาก TOKEN
      renderQr(currentToken, qrSection, qrBox);

      closeBtn.disabled = false;
    } catch (err) {
      console.error(err);
      msgEl.textContent = err.message || "เกิดข้อผิดพลาดในการเปิดคาบ";
      msgEl.style.color = "#f97373";
    } finally {
      openBtn.disabled = false;
    }
  });

  // ปิดคาบ
  closeBtn.addEventListener("click", async () => {
    msgEl.textContent = "";

    if (!currentToken) {
      msgEl.textContent = "ยังไม่มีคาบที่เปิดอยู่";
      msgEl.style.color = "#f97373";
      return;
    }

    openBtn.disabled  = true;
    closeBtn.disabled = true;
    msgEl.textContent = "กำลังปิดคาบและสรุปมา/ขาด...";
    msgEl.style.color = "#e5e7eb";

    try {
      const res = await callApi("closeSession", {
        token: currentToken,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "ปิดคาบไม่สำเร็จ");
      }

      statusEl.textContent = "สถานะคาบ: ปิดคาบแล้ว (CLOSED)";
      msgEl.textContent = res.message || "ปิดคาบและสรุปมา/ขาดเรียบร้อย ✅";
      msgEl.style.color = "#4ade80";

      // หลังปิดคาบจะยังเห็น TOKEN + QR ได้ เผื่อเช็กย้อนหลัง
      // ถ้าอยากให้หายไปเลย ก็สามารถซ่อน tokenBox / qrSection ตรงนี้ได้
      // tokenBox.style.display = "none";
      // qrSection.style.display = "none";
    } catch (err) {
      console.error(err);
      msgEl.textContent = err.message || "เกิดข้อผิดพลาดในการปิดคาบ";
      msgEl.style.color = "#f97373";
      closeBtn.disabled = false;
    } finally {
      openBtn.disabled = false;
    }
  });
});

// ฟังก์ชันสร้าง QR
function renderQr(token, qrSection, qrBox) {
  if (!window.QRCode) {
    console.error("QRCode library not loaded");
    return;
  }

  qrSection.style.display = "block";
  qrBox.innerHTML = ""; // เคลียร์ของเก่าเผื่อครูเปิดคาบใหม่

  new QRCode(qrBox, {
    text: token,          // ตอนนี้ให้ QR เก็บแค่ TOKEN
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.H,
  });
}
