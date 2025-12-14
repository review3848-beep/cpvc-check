// admin-login.js
const ADMIN_EMAIL = "admin@nexattend.com";
const ADMIN_PASSWORD = "admin123";

const form = document.getElementById("adminLoginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const btn = form.querySelector("button");

  btn.disabled = true;
  btn.textContent = "⏳ กำลังตรวจสอบ...";

  try {
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error("อีเมลหรือรหัสผ่านแอดมินไม่ถูกต้อง");
    }

    // login success
    localStorage.setItem("admin_login", "true");
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("loginAdmin error:", err);
    errorMsg.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔐 เข้าสู่ระบบแอดมิน";
  }
});
