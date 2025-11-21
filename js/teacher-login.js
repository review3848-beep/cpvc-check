// js/teacher-login.js
import { API_BASE } from "./api.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function show(text, type = "error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    return show("กรุณากรอกอีเมลและรหัสผ่าน");
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "loginTeacher",
        email,
        password,
      }),
    });

    const data = await res.json();
    console.log("loginTeacher >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ","success");

      // เก็บ session ครู
      sessionStorage.setItem("teacherEmail", data.email);
      sessionStorage.setItem("teacherName", data.name);

      setTimeout(() => {
        window.location.href = "dashboard.html";

      }, 900);
    } else {
      show(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  btn.disabled = false;
  btn.textContent = "เข้าสู่ระบบ";
}

btn.addEventListener("click", handleLogin);
