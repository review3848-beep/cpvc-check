// js/student-login.js
import { API_BASE } from "./api.js";

const idInput   = document.getElementById("studentId");
const passInput = document.getElementById("password");
const loginBtn  = document.getElementById("loginBtn");
const msgEl     = document.getElementById("msg");

function showMessage(text, type = "error") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function handleLogin() {
  const id   = (idInput?.value || "").trim();
  const pass = (passInput?.value || "").trim();

  if (!id || !pass) {
    showMessage("กรุณากรอกรหัสนักเรียนและรหัสผ่านให้ครบ");
    return;
  }

  showMessage("");

  if (loginBtn) {
    loginBtn.disabled = true;
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "loginStudent",
        id: id,
        password: pass
      })
    });

    const data = await res.json();

    if (!data.success) {
      showMessage(data.message || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }

    // เก็บข้อมูลนักเรียนลง localStorage ใช้ key กลาง cpvc_student
    const studentInfo = {
      id:   data.id,
      name: data.name
    };
    localStorage.setItem("cpvc_student", JSON.stringify(studentInfo));

    showMessage("เข้าสู่ระบบสำเร็จ กำลังนำไปหน้าเช็คชื่อ...", "success");
    window.location.href = "scan.html";
  } catch (err) {
    console.error("loginStudent error:", err);
    showMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
    }
  }
}

function init() {
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  [idInput, passInput].forEach((el) => {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
