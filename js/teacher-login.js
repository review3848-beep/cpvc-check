// js/teacher-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passInput  = document.getElementById("password");
  const btn        = document.getElementById("loginBtn");
  const msgEl      = document.getElementById("msg");

  function setMsg(text) {
    msgEl.textContent = text || "";
  }

  async function doLogin() {
    const email = (emailInput.value || "").trim();
    const password = (passInput.value || "").trim();

    if (!email || !password) {
      setMsg("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setMsg("กำลังเข้าสู่ระบบ...");
    btn.disabled = true;

    const data = await callApi("loginTeacher", { email, password });
    console.log("loginTeacher >", data);

    btn.disabled = false;

    if (!data.success) {
      setMsg(data.message || "อีเมลหรือรหัสผ่านครูไม่ถูกต้อง");
      return;
    }

    // เก็บ session แล้วเด้งไป dashboard ครู
    sessionStorage.setItem("teacher", JSON.stringify(data.teacher));
    window.location.href = "dashboard.html";
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    doLogin();
  });

  [emailInput, passInput].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doLogin();
      }
    });
  });
});


  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doLogin();
    }
  });

