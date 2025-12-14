// student/register.js
import { callApi } from "../js/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const idInput   = document.getElementById("studentId");
  const nameInput = document.getElementById("name");
  const pwInput   = document.getElementById("password");
  const btn       = document.getElementById("registerBtn");
  const msgEl     = document.getElementById("msg");

  btn.addEventListener("click", register);
  pwInput.addEventListener("keydown", e => {
    if (e.key === "Enter") register();
  });

  async function register() {
    const studentId = idInput.value.trim();
    const name      = nameInput.value.trim();
    const password  = pwInput.value.trim();

    msgEl.textContent = "";
    msgEl.style.color = "#e5e7eb";

    // ===== VALIDATION =====
    if (!studentId || !name || !password) {
      showMsg("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง", "#fbbf24");
      return;
    }

    if (password.length < 4) {
      showMsg("⚠️ รหัสผ่านต้องอย่างน้อย 4 ตัวอักษร", "#fbbf24");
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังสมัครใช้งาน...";

    let res;
    try {
      res = await callApi("studentRegister", {
        studentId,
        name,
        password
      });
    } catch (e) {
      showMsg("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "#f87171");
      resetBtn();
      return;
    }

    if (!res.success) {
      showMsg(res.message || "❌ สมัครไม่สำเร็จ", "#f87171");
      resetBtn();
      return;
    }

    // ✅ สมัครสำเร็จ → ไปหน้า login
    showMsg("✅ สมัครเรียบร้อย กำลังพาไปหน้าเข้าสู่ระบบ...", "#4ade80");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  }

  function showMsg(text, color) {
    msgEl.textContent = text;
    msgEl.style.color = color;
  }

  function resetBtn() {
    btn.disabled = false;
    btn.textContent = "สมัครใช้งาน";
  }
});
