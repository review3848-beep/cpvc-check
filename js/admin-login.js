// admin-login.js
const API_BASE = "https://script.google.com/macros/s/XXXXXXXX/exec"; // ใช้ตัวเดียวกับระบบหลัก

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passInput = document.getElementById("adminPassword");
const statusText = document.getElementById("adminStatus");

function showStatus(msg, isError = false) {
  statusText.textContent = msg;
  statusText.style.color = isError ? "#f87171" : "#4ade80";
}

async function loginAdmin(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) {
    showStatus("กรุณากรอกข้อมูลให้ครบ", true);
    return;
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "loginAdmin",
        email,
        password,
      }),
    });

    if (!res.ok) throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");

    const data = await res.json();
    if (!data.success) {
      showStatus(data.message || "เข้าสู่ระบบไม่สำเร็จ", true);
      return;
    }

    // เก็บ session ใน localStorage
    localStorage.setItem("cpvc_admin", JSON.stringify(data.data));

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error(err);
    showStatus("เกิดข้อผิดพลาดในการเชื่อมต่อ", true);
  }
}

form.addEventListener("submit", loginAdmin);