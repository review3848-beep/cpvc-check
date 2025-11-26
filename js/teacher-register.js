// js/teacher-register.js
import { API_BASE } from "./api.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const msg = document.getElementById("msg");

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleRegister() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!name || !email || !password) {
    return show("กรุณากรอกข้อมูลให้ครบ");
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "กำลังสมัคร...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        action: "registerTeacher", // ต้องตรงกับ Code.gs
        name,
        email,
        password,
      }),
    });

    const data = await res.json();
    console.log("registerTeacher >", data);

    if (data.success) {
      show("สมัครสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...", "success");

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

  registerBtn.disabled = false;
  registerBtn.textContent = "สมัครใช้งาน";
}

// คลิกปุ่ม
registerBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleRegister();
});

// รองรับกด Enter
[nameInput, emailInput, passInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRegister();
    }
  });
});
