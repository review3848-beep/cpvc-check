// js/student-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const passwordInput  = document.getElementById("password");
  const loginBtn       = document.getElementById("loginBtn");
  const msgEl          = document.getElementById("msg");

  // --------------------------
  // ฟังก์ชันแสดงข้อความ
  // --------------------------
  function setMsg(text, type = "") {
    msgEl.textContent = text || "";
    msgEl.style.color =
      type === "error" ? "#f87171" :
      type === "ok"    ? "#4ade80" :
      "#e5e7eb";
  }

  // --------------------------
  // ป้องกันลูป redirect
  // --------------------------
  try {
    const rawLocal   = localStorage.getItem("cpvc_student");
    const rawSession = sessionStorage.getItem("student");
    const raw = rawLocal || rawSession;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.studentId) {
        // ถ้ามี session อยู่แล้วให้ไป dashboard ทันที
        window.location.href = "dashboard.html";
        return;
      }
    }
  } catch (err) {
    console.warn("Session error:", err);
    // ถ้า JSON พัง ลบ session
    localStorage.removeItem("cpvc_student");
    sessionStorage.removeItem("student");
  }

  // --------------------------
  // ปุ่มเข้าสู่ระบบ
  // --------------------------
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });

  // กด Enter เพื่อเข้าสู่ระบบ
  [studentIdInput, passwordInput].forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });

  // --------------------------
  // ฟังก์ชันเข้าสู่ระบบ
  // --------------------------
  async function handleLogin() {
    const studentId = studentIdInput.value.trim();
    const password  = passwordInput.value.trim();

    if (!studentId || !password) {
      setMsg("กรุณากรอกรหัสนักเรียนและรหัสผ่าน", "error");
      return;
    }

    setMsg("กำลังเข้าสู่ระบบ...");
    loginBtn.disabled = true;

    try {
      const res = await callApi("loginStudent", {
        studentId,
        password
      });

      console.log("loginStudent >", res);

      if (!res?.success) {
        setMsg(res?.message || "รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง", "error");
        loginBtn.disabled = false;
        return;
      }

      // --------------------------
      // บันทึก session
      // --------------------------
      const student = {
        studentId: res.student.studentId,
        name: res.student.name,
      };

      localStorage.setItem("cpvc_student", JSON.stringify(student));
      sessionStorage.setItem("student", JSON.stringify(student));

      setMsg("เข้าสู่ระบบสำเร็จ ✓", "ok");

      // redirect
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 300);

    } catch (err) {
      console.error("Login Error:", err);
      setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
    }

    loginBtn.disabled = false;
  }
});
