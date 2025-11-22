// js/teacher-login.js
// เข้าสู่ระบบครู CPVC-Check

import { API_BASE } from "./api.js";

const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("loginBtn");
const msgBox        = document.getElementById("msg");

function show(text, type = "error") {
  if (!msgBox) return;
  msgBox.textContent = text || "";
  msgBox.style.marginTop = text ? "1rem" : "0";
  if (type === "success") {
    msgBox.style.color = "#4ade80";
  } else {
    msgBox.style.color = "#f97373";
  }
}

async function loginTeacher() {
  const email = (emailInput.value || "").trim();
  const password = (passwordInput.value || "").trim();

  if (!email || !password) {
    show("กรุณากรอกอีเมลและรหัสผ่านให้ครบ");
    return;
  }

  // ปิดปุ่มกันกดรัว
  loginBtn.disabled = true;
  loginBtn.textContent = "กำลังเข้าสู่ระบบ...";
  show("");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

      // เก็บชื่อ + อีเมลครูไว้ใช้ในหน้าถัดไป
      sessionStorage.setItem("teacherName", data.name);
      sessionStorage.setItem("teacherEmail", data.email);

      // เด้งไป Dashboard ครู (หรือจะเปลี่ยนเป็น open-session.html ก็ได้)
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } else {
      show(data.message || "ข้อมูลไม่ถูกต้อง");
    }
  } catch (err) {
    console.error("loginTeacher error:", err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "เข้าสู่ระบบ";
  }
}

// ผูก event
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginTeacher();
  });
}

[emailInput, passwordInput].forEach((input) => {
  if (!input) return;
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      loginTeacher();
    }
  });
});
