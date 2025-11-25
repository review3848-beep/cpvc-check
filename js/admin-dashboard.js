// js/admin-login.js
import { callApi } from "./api.js";

const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const loginBtn   = document.getElementById("loginBtn");
const msgEl      = document.getElementById("msg");

function setMsg(text, type = "error") {
  msgEl.textContent = text || "";
  msgEl.style.color = type === "success" ? "#4ade80" : "#f97373";
}

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!email || !password) {
    setMsg("กรุณากรอกอีเมลและรหัสผ่านให้ครบ");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "กำลังเข้าสู่ระบบ...";
  setMsg("");

  try {
    const res = await callApi("loginAdmin", { email, password });

    if (!res.success) {
      setMsg(res.message || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }

    // เก็บ session แอดมิน
    sessionStorage.setItem("adminName",  res.name || "");
    sessionStorage.setItem("adminEmail", res.email || email);

    setMsg("เข้าสู่ระบบสำเร็จ", "success");

    // เด้งไป dashboard
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error(err);
    setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "เข้าสู่ระบบ";
  }
});
