// js/admin-login.js
import { API_BASE } from "./api.js";

const form = document.querySelector("form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");
const btn = form ? form.querySelector("button[type=submit]") : null;

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function loginAdmin(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    return show("กรุณากรอกข้อมูลให้ครบ");
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "กำลังเข้าสู่ระบบ...";
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      // ❗ ไม่ต้องใส่ headers เพื่อเลี่ยง preflight/CORS
      body: JSON.stringify({
        action: "adminLogin",   // << ตรงกับ Code.gs แล้ว
        email,
        password,
      }),
    });

    const data = await res.json();
    console.log("adminLogin >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ", "success");
      sessionStorage.setItem("adminName", data.name);
      sessionStorage.setItem("adminEmail", data.email);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } else {
      show(data.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
}

if (form) {
  form.addEventListener("submit", loginAdmin);
}
if (btn) {
  btn.addEventListener("click", loginAdmin);
}
