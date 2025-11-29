// js/teacher-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passInput  = document.getElementById("password");
  const btn        = document.getElementById("loginBtn");
  const msgEl      = document.getElementById("msg");

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  // ถ้าเคยล็อกอินแล้ว → เด้งไป Dashboard เลย
  try {
    const existing = sessionStorage.getItem("teacher");
    if (existing) {
      const t = JSON.parse(existing);
      if (t && t.email) {
        window.location.href = "dashboard.html";
        return;
      }
    }
  } catch (e) {
    sessionStorage.removeItem("teacher");
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
      // เรียก Code.gs → loginTeacher
      const res = await callApi("loginTeacher", { email, password });

      if (!res.success) {
        setMsg(res.message || "เข้าสู่ระบบไม่สำเร็จ");
      } else {
        const teacher = {
          name:  res.name,
          email: res.email
        };
        sessionStorage.setItem("teacher", JSON.stringify(teacher));
        setMsg("เข้าสู่ระบบสำเร็จ กำลังไป Dashboard...", true);

        // ✅ เด้งไปหน้า Dashboard ครู
        window.location.href = "dashboard.html";
      }
    } catch (err) {
      console.error(err);
      setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", false);
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
