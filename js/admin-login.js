// js/admin-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passInput  = document.getElementById("password");
  const btn        = document.getElementById("loginBtn");
  const msgEl      = document.getElementById("msg");

  // ถ้า login อยู่แล้ว → เด้งเข้า Dashboard
  const existing = sessionStorage.getItem("admin");
  if (existing) {
    window.location.href = "dashboard.html";
    return;
  }

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.className = "";
    if (!text) return;
    msgEl.classList.add(ok ? "msg-ok" : "msg-err");
  };

  btn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
      setMsg("กรุณากรอกอีเมลและรหัสผ่าน", false);
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังเข้าสู่ระบบ...";
    setMsg("");

    try {
      const res = await callApi("loginAdmin", { email, password });

      if (res.success) {
        sessionStorage.setItem("admin", JSON.stringify(res));
        setMsg("เข้าสู่ระบบสำเร็จ กำลังนำทาง...", true);
        window.location.href = "dashboard.html";
      } else {
        setMsg(res.message || "เข้าสู่ระบบไม่สำเร็จ", false);
      }
    } catch (err) {
      console.error(err);
      setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", false);
    } finally {
      btn.disabled = false;
      btn.textContent = "เข้าสู่ระบบ";
    }
  });

  // Enter เพื่อ login
  [emailInput, passInput].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  });
});
