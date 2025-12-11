// js/admin-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const form    = document.getElementById("adminLoginForm");
  const emailEl = document.getElementById("adminEmail");
  const passEl  = document.getElementById("adminPassword");
  const btn     = document.getElementById("adminLoginBtn");
  const msgEl   = document.getElementById("adminMsg");

  if (!form || !emailEl || !passEl || !btn || !msgEl) return;

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.classList.toggle("ok", !!ok);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl.value || "").trim();
    const pass  = (passEl.value  || "").trim();

    if (!email || !pass) {
      setMsg("กรุณากรอกอีเมลและรหัสผ่านให้ครบ");
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังเข้าสู่ระบบ...";
    setMsg("");

    try {
      const res = await callApi("loginAdmin", { email, password: pass });

      if (!res || !res.success) {
        throw new Error(res && res.message ? res.message : "เข้าสู่ระบบไม่สำเร็จ");
      }

      // เก็บ session แอดมิน
      sessionStorage.setItem("admin", JSON.stringify(res.admin || { email }));

      setMsg("เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ Dashboard...", true);

      // ไปหน้า dashboard แอดมิน
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("loginAdmin error:", err);
      setMsg(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      btn.disabled = false;
      btn.textContent = "🔐 เข้าสู่ระบบแอดมิน";
    }
  });
});
