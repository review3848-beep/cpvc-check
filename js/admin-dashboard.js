import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const elStudents = document.getElementById("statStudents");
  const elTeachers = document.getElementById("statTeachers");
  const elSessions  = document.getElementById("statSessions");
  const elRate      = document.getElementById("statRate");

  const setText = (el, text) => { if (el) el.textContent = text; };

  // ---- helper: format percent ----
  function toPercent(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "–%";
    return `${Math.round(n)}%`;
  }

  // ---- auth: ดึง admin session (ถ้าคุณเก็บชื่อ key อื่น ปรับ 2 บรรทัดนี้) ----
  function getAdminSession() {
    // แนะนำให้เก็บตอน login: localStorage.setItem("adminSession", JSON.stringify({ email, token }))
    try {
      return JSON.parse(localStorage.getItem("adminSession") || "null");
    } catch {
      return null;
    }
  }

  function requireLoginIfNoSession() {
    const s = getAdminSession();
    // ถ้ายังไม่ทำระบบ session ก็ให้ผ่านไปก่อน (ไม่ redirect) เพื่อไม่ให้คุณงงตอนทดสอบ
    // ถ้าคุณพร้อมคุมเข้ม ให้ uncomment 3 บรรทัดนี้:
    // if (!s || !s.token) {
    //   window.location.href = "login.html";
    // }
    return s;
  }

  // ---- main load ----
  async function loadStats() {
    setText(elStudents, "…");
    setText(elTeachers, "…");
    setText(elSessions, "…");
    setText(elRate, "…");

    const session = requireLoginIfNoSession();

    try {
      // action นี้ต้องมีใน Code.gs ฝั่ง Admin
      // response ที่คาดหวัง:
      // { ok:true, data:{ students:123, teachers:9, todaySessions:12, todayAttendanceRate:87 } }
      const res = await callApi({
        action: "adminGetDashboardStats",
        // ส่ง session ไปเผื่อคุณเช็คสิทธิในอนาคต
        adminSession: session || null
      });

      if (!res || res.ok !== true) {
        throw new Error(res?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      const d = res.data || {};
      setText(elStudents, Number.isFinite(Number(d.students)) ? String(d.students) : "–");
      setText(elTeachers, Number.isFinite(Number(d.teachers)) ? String(d.teachers) : "–");
      setText(elSessions,  Number.isFinite(Number(d.todaySessions)) ? String(d.todaySessions) : "–");
      setText(elRate, toPercent(d.todayAttendanceRate));
    } catch (err) {
      console.error("[admin-dashboard] loadStats error:", err);
      setText(elStudents, "–");
      setText(elTeachers, "–");
      setText(elSessions, "–");
      setText(elRate, "–%");
    }
  }

  loadStats();

  // ---- optional: refresh ทุก 60 วิ (อยากได้ค่อยเปิด) ----
  // setInterval(loadStats, 60000);
});
