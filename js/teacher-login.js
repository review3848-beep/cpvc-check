// js/teacher-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");      // id จากหน้า login.html ของครู
  const passInput  = document.getElementById("password");
  const btn        = document.getElementById("loginBtn");
  const msgEl      = document.getElementById("msg");

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  // ถ้ามี session ครูอยู่แล้ว → เด้งไปหน้าเปิดคาบเลย
  const existing = sessionStorage.getItem("teacher");
  if (existing) {
    try {
      const t = JSON.parse(existing);
      if (t && t.email) {
        window.location.href = "open-session.html";
        return;
      }
    } catch (e) {
      sessionStorage.removeItem("teacher");
    }
  }

  btn.addEventListener("click", async () => {
    const email = (emailInput.value || "").trim();
    const password = (passInput.value || "").trim();

    if (!email || !password) {
      setMsg("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังเข้าสู่ระบบ...";
    setMsg("");

    try {
      // Code.gs: loginTeacher → { success, name, email }
      const res = await callApi("loginTeacher", { email, password });

      const teacher = {
        name:  res.name,
        email: res.email
      };
      sessionStorage.setItem("teacher", JSON.stringify(teacher));

      setMsg("เข้าสู่ระบบสำเร็จ กำลังไปหน้าเปิดคาบ...", true);
      window.location.href = "open-session.html";
    } catch (err) {
      console.error(err);
      setMsg(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      btn.disabled = false;
      btn.textContent = "เข้าสู่ระบบ";
    }
  });

  // กด Enter เพื่อ login
  [emailInput, passInput].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  });
});
