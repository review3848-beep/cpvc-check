import { guardAdmin } from "./js/admin-guard.js";

guardAdmin(); // ทุก role เข้าได้

const ADMIN_EMAIL = "admin@nexattend.com";
const ADMIN_PASSWORD = "123456";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

loginBtn.addEventListener("click", () => {
  msg.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    msg.textContent = "กรุณากรอกอีเมลและรหัสผ่าน";
    msg.style.color = "#f87171";
    return;
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem("adminLoggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    msg.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    msg.style.color = "#f87171";
  }
});
