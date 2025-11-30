// js/teacher-login.js
// เปลี่ยนจาก callApi เป็นดึง API_BASE มาใช้แทน
import { API_BASE } from "./api.js"; 

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passInput  = document.getElementById("password");
  const btn        = document.getElementById("loginBtn");
  const msgEl      = document.getElementById("msg");

  function setMsg(text, ok = false) {
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f87171";
  }

  async function doLogin() {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
      setMsg("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังตรวจสอบ...";
    setMsg("");

    try {
      // -------------------------------------------------------
      // ✅ แก้ไขส่วนเชื่อมต่อ API ให้ใช้ text/plain แก้ CORS
      // -------------------------------------------------------
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "loginTeacher",
          email: email,
          password: password
        })
      });

      const data = await res.json();
      // -------------------------------------------------------

      if (!data.success) {
        setMsg(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        btn.disabled = false;
        btn.textContent = "เข้าสู่ระบบ";
        return;
      }

      // บันทึก session ครู
      sessionStorage.setItem("teacher", JSON.stringify({
        name:  data.name,
        email: data.email,
        id:    data.id // เผื่อต้องใช้ ID ครู
      }));

      setMsg("เข้าสู่ระบบสำเร็จ กำลังไป Dashboard...", true);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);

    } catch (err) {
      console.error(err);
      setMsg("ไม่สามารถเชื่อมต่อระบบได้");
      btn.disabled = false;
      btn.textContent = "เข้าสู่ระบบ";
    }
  }

  btn.addEventListener("click", doLogin);

  [emailInput, passInput].forEach((el) => {
    el.addEventListener("keypress", (e) => {
      if (e.key === "Enter") doLogin();
    });
  });
});