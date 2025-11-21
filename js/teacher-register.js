// teacher-register.js
// ===============================
// ใส่ลิงก์ Web App (แบบ /exec)
// ===============================
const API_BASE = "https://script.google.com/macros/s/XXXXX/exec"; 
// ← เปลี่ยนเป็น URL ของ Apps Script ตัวจริง

const form = document.getElementById("teacherRegisterForm");
const nameInput = document.getElementById("teacherName");
const emailInput = document.getElementById("teacherEmail");
const passwordInput = document.getElementById("teacherPassword");
const submitBtn = document.getElementById("registerBtn");
const statusText = document.getElementById("registerStatus");

function loading(state) {
  submitBtn.disabled = state;
  submitBtn.textContent = state ? "กำลังสมัครใช้งาน..." : "สมัครใช้งาน";
}

function showStatus(msg, isError = false) {
  statusText.textContent = msg;
  statusText.style.color = isError ? "#f87171" : "#4ade80";
}

async function registerTeacher(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    showStatus("กรุณากรอกข้อมูลให้ครบถ้วน", true);
    return;
  }

  loading(true);
  showStatus("");

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

    if (!res.ok) throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");

    const data = await res.json();

    if (!data.success) {
      showStatus(data.message || "เกิดข้อผิดพลาด", true);
      return;
    }

    showStatus("สมัครสำเร็จ! 🎉", false);
    form.reset();

  } catch (err) {
    console.error(err);
    showStatus("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่", true);
  } finally {
    loading(false);
  }
}

form.addEventListener("submit", registerTeacher);
