// student/login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const idInput  = document.getElementById("studentId");
  const pwInput  = document.getElementById("password");
  const btn      = document.getElementById("loginBtn");
  const msgEl    = document.getElementById("msg");

  btn.addEventListener("click", login);
  pwInput.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });

  async function login() {
    const studentId = idInput.value.trim();
    const password  = pwInput.value.trim();

    msgEl.textContent = "";
    if (!studentId || !password) {
      msgEl.textContent = "⚠️ กรุณากรอกข้อมูลให้ครบ";
      msgEl.style.color = "#fbbf24";
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังเข้าสู่ระบบ...";

    let res;
    try {
      res = await callApi("studentLogin", {
        studentId,
        password
      });
    } catch (e) {
      msgEl.textContent = "❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์";
      msgEl.style.color = "#f87171";
      resetBtn();
      return;
    }

    if (!res.success) {
      msgEl.textContent = res.message || "❌ รหัสไม่ถูกต้อง";
      msgEl.style.color = "#f87171";
      resetBtn();
      return;
    }

    // ✅ เก็บ session นักเรียน
    localStorage.setItem("cpvc_student", JSON.stringify({
      studentId: res.studentId,
      name: res.name
    }));

    // ✅ ไป dashboard
    window.location.href = "dashboard.html";
  }

  function resetBtn() {
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
});
