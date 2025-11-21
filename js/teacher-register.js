// js/teacher-register.js
import { API_BASE } from "./api.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("registerBtn");
const msgEl = document.getElementById("msg");

function showMessage(text, type = "error") {
  msgEl.textContent = text;
  if (type === "success") {
    msgEl.style.color = "#4ade80";
  } else {
    msgEl.style.color = "#fb7185";
  }
}

async function registerTeacher() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    showMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครใช้งาน...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "registerTeacher",
        name,
        email,
        password,
      }),
    });

    const data = await res.json();
    console.log("registerTeacher >", data);

    if (data.success) {
      showMessage("สมัครสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } else {
      showMessage(data.message || "สมัครไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    showMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  } finally {
    btn.disabled = false;
    btn.textContent = "สมัครใช้งาน";
  }
}

btn.addEventListener("click", registerTeacher);
