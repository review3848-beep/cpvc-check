// js/teacher-login.js
import { API_BASE } from "./api.js";

const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!email || !password) {
    return show("กรุณากรอกอีเมลและรหัสผ่านให้ครบ");
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      // ไม่ใส่ headers เพื่อลด preflight/CORS
      body: JSON.stringify({
        action: "loginTeacher",
        email,
        password,
      }),
    });

    const data = await res.json();
    console.log("loginTeacher >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ", "success");

      sessionStorage.setItem("teacherName", data.name);
      sessionStorage.setItem("teacherEmail", data.email);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } else {
      show(data.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  loginBtn.disabled = false;
  loginBtn.textContent = "เข้าสู่ระบบ";
}

loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleLogin();
});

// รองรับกด Enter
[emailInput, passInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });
});
