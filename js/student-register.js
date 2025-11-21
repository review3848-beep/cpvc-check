// js/student-register.js
import { API_BASE } from "./api.js";

const idInput = document.getElementById("studentId");
const nameInput = document.getElementById("name");
const passInput = document.getElementById("password");
const btn = document.getElementById("registerBtn");
const msg = document.getElementById("msg");

function show(text, type="error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleRegister() {
  const studentId = idInput.value.trim();
  const name = nameInput.value.trim();
  const password = passInput.value.trim();

  if (!studentId || !name || !password) {
    return show("กรุณากรอกข้อมูลให้ครบ");
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครใช้งาน...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "registerStudent",
        studentId,
        name,
        password,
      }),
    });

    const data = await res.json();
    console.log("registerStudent >", data);

    if (data.success) {
      show("สมัครสำเร็จ! กรุณาเข้าสู่ระบบ","success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } else {
      show(data.message || "สมัครไม่สำเร็จ");
    }
  } catch(err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  btn.disabled = false;
  btn.textContent = "สมัครใช้งาน";
}

btn.addEventListener("click", handleRegister);
