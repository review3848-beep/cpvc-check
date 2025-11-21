// js/teacher-register.js
import { API_BASE } from "./api.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("registerBtn");
const msg = document.getElementById("msg");

function show(text, type="error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleRegister() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    return show("กรุณากรอกข้อมูลให้ครบ");
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครใช้งาน...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
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
      show("สมัครสำเร็จ! กรุณาเข้าสู่ระบบ","success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } else {
      show(data.message || "สมัครไม่สำเร็จ");
    }

  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  btn.disabled = false;
  btn.textContent = "สมัครใช้งาน";
}

btn.addEventListener("click", handleRegister);
