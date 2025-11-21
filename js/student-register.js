// js/student-register.js
import { API_BASE } from "./api.js";

const idInput = document.getElementById("studentId");
const nameInput = document.getElementById("studentName");
const passInput = document.getElementById("password");
const msg = document.getElementById("msg");
const form = document.querySelector("form");
const submitBtn = form ? form.querySelector("button[type=submit]") : null;

function showMessage(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleRegister(e) {
  e.preventDefault();

  const id = idInput.value.trim();
  const name = nameInput.value.trim();
  const password = passInput.value.trim();

  if (!id || !name || !password) {
    return showMessage("กรุณากรอกข้อมูลให้ครบ");
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังสมัครใช้งาน...";
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      // ❗ สำคัญ: ไม่ต้องใส่ headers เลย จะได้ไม่โดน preflight
      body: JSON.stringify({
        action: "registerStudent",
        id,
        name,
        password,
      }),
    });

    const data = await res.json();
    console.log("registerStudent >", data);

    if (data.success) {
      showMessage("สมัครใช้งานสำเร็จ! ไปหน้าล็อกอินได้เลย", "success");
      // จะ redirect ก็ได้
      // setTimeout(() => window.location.href = "login.html", 1200);
    } else {
      showMessage(data.message || "สมัครไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    showMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "สมัครใช้งาน";
  }
}

if (form) {
  form.addEventListener("submit", handleRegister);
}
if (submitBtn) {
  submitBtn.addEventListener("click", handleRegister);
}