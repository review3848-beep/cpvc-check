// teacher-register.js

// ใช้ URL /exec ของ Web App
const API_BASE = "https://script.google.com/macros/s/AKfycbxS5yjl5fXvkMeiwYKCtjNNtM897KtTcdOx.../exec";
// ↑ แก้ให้เป็นของโปรเจกต์เธอเองให้ครบทั้งบรรทัด

const form = document.getElementById("teacherRegisterForm");
const nameInput = document.getElementById("teacherName");
const emailInput = document.getElementById("teacherEmail");
const passwordInput = document.getElementById("teacherPassword");
const submitBtn = document.getElementById("registerBtn");
const statusText = document.getElementById("registerStatus");

function loading(state) {
  if (!submitBtn) return;
  submitBtn.disabled = state;
  submitBtn.textContent = state ? "กำลังสมัครใช้งาน..." : "สมัครใช้งาน";
}

function showStatus(msg, isError = false) {
  if (!statusText) return;
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
      // ❌ อย่าใส่ headers Content-Type
      // browser จะส่งเป็น text/plain ให้เอง (ไม่ต้อง preflight)
      body: JSON.stringify({
        action: "registerTeacher",
        name,
        email,
        password,
      }),
    });

    if (!res.ok) {
      throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (" + res.status + ")");
    }

    const data = await res.json();

    if (!data.success) {
      showStatus(data.message || "เกิดข้อผิดพลาด", true);
      return;
    }

    showStatus(data.message || "สมัครครูสำเร็จ 🎉", false);
    form.reset();
  } catch (err) {
    console.error(err);
    showStatus("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง", true);
  } finally {
    loading(false);
  }
}

if (form) {
  form.addEventListener("submit", registerTeacher);
}
