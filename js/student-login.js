// js/student-login.js
import { API_BASE } from "./api.js";

const studentIdInput = document.getElementById("studentId");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function show(text, type="error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleLogin() {
  const studentId = studentIdInput.value.trim();
  const password = passwordInput.value.trim();

  if (!studentId || !password) {
    return show("กรุณากรอกรหัสนักเรียนและรหัสผ่าน");
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "loginStudent",
        studentId,
        password,
      }),
    });

    const data = await res.json();
    console.log("loginStudent >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ","success");
      // เก็บ session
      sessionStorage.setItem("studentId", data.studentId);
      sessionStorage.setItem("studentName", data.name);

      setTimeout(() => {
        window.location.href = "scan.html";
      }, 800);
    } else {
      show(data.message || "รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง");
    }

  } catch(err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  btn.disabled = false;
  btn.textContent = "เข้าสู่ระบบ";
}

btn.addEventListener("click", handleLogin);
