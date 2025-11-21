// js/teacher-register.js
import { API_BASE } from "./api.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("registerBtn");
const msgEl = document.getElementById("msg");

function showMessage(text, type = "error") {
  msgEl.textContent = text;
  msgEl.style.marginTop = "0.8rem";
  msgEl.style.fontSize = "0.9rem";
  if (type === "success") {
    msgEl.style.color = "#4ade80"; // เขียว
  } else {
    msgEl.style.color = "#f87171"; // แดง
  }
}

async function handleRegister() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    showMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครใช้งาน...";
  showMessage("");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "registerTeacher",
        name,
        email,
        password,
      }),
    });

    if (!res.ok) {
      throw new Error("response_not_ok");
    }

    const data = await res.json();
    console.log("registerTeacher response:", data);

    if (data.success) {
      showMessage("สมัครใช้งานสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...", "success");

      // ล้างฟอร์ม
      nameInput.value = "";
      emailInput.value = "";
      passwordInput.value = "";

      // เว้นให้เขาอ่านข้อความก่อน แล้วค่อยเด้งไปหน้า login
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } else {
      // message จาก Code.gs เช่น "อีเมลนี้มีในระบบแล้ว"
      showMessage(data.message || "สมัครใช้งานไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  } finally {
    btn.disabled = false;
    btn.textContent = "สมัครใช้งาน";
  }
}

btn.addEventListener("click", handleRegister);
