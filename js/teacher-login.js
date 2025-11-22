// js/teacher-login.js
import { API_BASE } from "./api.js";

// element จาก HTML เดิมของคุณ
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

// ฟังก์ชันโชว์ข้อความ
function show(text, type = "error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#f87171";
}

// กดปุ่มเข้าสู่ระบบ
btn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    show("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "loginTeacher",
        email,
        password,
      }),
    });

    const data = await res.json();
    console.log("loginTeacher >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ!", "success");

      // บันทึกข้อมูลครู
      sessionStorage.setItem("teacherName", data.name);
      sessionStorage.setItem("teacherEmail", data.email);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } else {
      show(data.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  } catch (err) {
    show("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }

  btn.disabled = false;
  btn.textContent = "เข้าสู่ระบบ";
});
