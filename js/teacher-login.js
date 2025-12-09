// js/teacher-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passInput  = document.getElementById("password");
  const loginBtn   = document.getElementById("loginBtn");
  const msgEl      = document.getElementById("msg");

  const setMsg = (text, ok = false) => {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  async function doLogin() {
    const email = (emailInput.value || "").trim();
    const password = (passInput.value || "").trim();

    if (!email || !password) {
      setMsg("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setMsg("กำลังเข้าสู่ระบบ...", true);

    try {
      const data = await callApi("loginTeacher", { email, password });
      console.log("loginTeacher >", data);

      if (!data.success) {
        setMsg(data.message || "อีเมลหรือรหัสผ่านครูไม่ถูกต้อง");
        return;
      }

      // ✅ เก็บข้อมูลลง sessionStorage ให้ตรงกับ teacher-dashboard.js
      const t = data.teacher || {};
      const teacherObj = {
        name:  t.name  || "ครู",
        email: t.email || email,
        teacherId: t.teacherId || t.email || email,
      };

      // key ที่ dashboard ใช้
      sessionStorage.setItem("teacher", JSON.stringify(teacherObj));

      // เผื่อหน้าอื่นอนาคตอยากใช้แบบแยก field
      sessionStorage.setItem("teacherEmail", teacherObj.email);
      sessionStorage.setItem("teacherName", teacherObj.name);
      sessionStorage.setItem("teacherId", teacherObj.teacherId);

      setMsg("เข้าสู่ระบบสำเร็จ กำลังไปหน้า Dashboard...", true);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      doLogin();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doLogin();
    }
  });
});
