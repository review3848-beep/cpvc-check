// js/student-login.js
import { API_BASE } from "./api.js";

const idInput = document.getElementById("studentId");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleLogin() {
  const studentId = idInput.value.trim();
  const password = passInput.value.trim();

  if (!studentId || !password) {
    return show("กรุณากรอกรหัสนักเรียนและรหัสผ่านให้ครบ");
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const res = await fetch(API_BASE, {
    method: "POST",
    // บรรทัดนี้สำคัญมาก! ต้องเปลี่ยนเป็น text/plain
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
        action: "loginStudent", // หรือ action ที่ไฟล์นั้นใช้
        id: studentId,
        password: password
    })
});

    const data = await res.json();
    console.log("loginStudent >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ", "success");
      // เก็บ session ไว้ให้หน้าอื่นใช้
      sessionStorage.setItem("studentId", data.id);
      sessionStorage.setItem("studentName", data.name);

      setTimeout(() => {
        window.location.href = "scan.html"; // หน้าเช็คชื่อ
      }, 800);
    } else {
      show(data.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    show("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
  }

  loginBtn.disabled = false;
  loginBtn.textContent = "เข้าสู่ระบบ";
}

// รองรับกดปุ่ม
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });
}

// รองรับกด Enter
[idInput, passInput].forEach((el) => {
  if (!el) return;
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });
});
