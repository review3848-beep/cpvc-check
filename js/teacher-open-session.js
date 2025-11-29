// js/teacher-open-session.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const teacherJson = sessionStorage.getItem("teacher");
  if (!teacherJson) {
    window.location.href = "login.html";
    return;
  }

  const teacher = JSON.parse(teacherJson);
  const teacherNameEl = document.getElementById("teacherName");
  const courseSelect  = document.getElementById("courseSelect");
  const statusEl      = document.getElementById("sessionStatus");
  const openBtn       = document.getElementById("openSessionBtn");
  const closeBtn      = document.getElementById("closeSessionBtn");
  const tokenBox      = document.getElementById("tokenBox");
  const tokenEl       = document.getElementById("token");
  const qrSection     = document.getElementById("qrSection");
  const qrBox         = document.getElementById("qrCode");
  const msgEl         = document.getElementById("msg");

  teacherNameEl.textContent = teacher.name || "-";

  let currentToken = null;

  // โหลดรายวิชาของครูจาก COURSES
  loadCourses(teacher.email);

  async function loadCourses(email) {
    try {
      const res = await callApi("getTeacherCourses", {
        teacherEmail: email,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "โหลดรายวิชาไม่สำเร็จ");
      }

      const courses = res.courses || [];
      if (courses.length === 0) {
        courseSelect.innerHTML = `
          <option value="">ยังไม่มีรายวิชาที่ผูกกับอีเมลนี้ใน COURSES</option>
        `;
        return;
      }

      courseSelect.innerHTML = `<option value="">เลือกวิชาที่ต้องการเปิดคาบ</option>`;

      courses.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.code;
        opt.textContent = `${c.code} – ${c.name} (${c.group})`;
        opt.dataset.subject = `${c.code} ${c.name}`;
        opt.dataset.room    = c.group || "";
        courseSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      courseSelect.innerHTML = `
        <option value="">เกิดข้อผิดพลาดในการโหลดรายวิชา</option>
      `;
    }
  }

  // เปิดคาบ
  openBtn.addEventListener("click", async () => {
    msgEl.textContent = "";
    const selected = courseSelect.value;

    if (!selected) {
      msgEl.textContent = "กรุณาเลือกวิชาที่ต้องการเปิดคาบ";
      msgEl.style.color = "#f97373";
      return;
    }

    const opt     = courseSelect.options[courseSelect.selectedIndex];
    const subject = opt.dataset.subject || selected;
    const room    = opt.dataset.room || "";

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
      msgEl.textContent = "เปิดคาบเรียบร้อย สามารถให้นักเรียนสแกนหรือกรอก TOKEN ได้แล้ว ✅";
      msgEl.style.color = "#4ade80";

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
  qrBox.innerHTML = "";

  new QRCode(qrBox, {
    text: token,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.H,
  });
}
