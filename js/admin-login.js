import { callApi } from "../api.js";


const form = document.getElementById("loginForm");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msgEl = document.getElementById("msg");

document.addEventListener("DOMContentLoaded", () => {
  // ถ้าเคยล็อกอินอยู่แล้ว ให้เด้งไป dashboard
  try {
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (admin && admin.username) {
      location.replace("./dashboard.html");
      return;
    }
  } catch {}
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = String(usernameEl.value || "").trim();
  const password = String(passwordEl.value || "").trim();

  if (!username || !password) {
    setMsg("กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ");
    return;
  }

  btn.disabled = true;
  setMsg("กำลังเข้าสู่ระบบ...");

  try {
    const res = await callApi("adminLogin", { username, password });

    if (!res || !res.success) {
      throw new Error(res?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }

    // เก็บ session admin
    const admin = res.admin || { username, name: "Admin" };
    localStorage.setItem("admin", JSON.stringify(admin));

    setMsg("เข้าสู่ระบบสำเร็จ");
    location.replace("./dashboard.html");
  } catch (err) {
    setMsg(err.message || "เกิดข้อผิดพลาด");
    btn.disabled = false;
  }
});

function setMsg(t) {
  msgEl.textContent = t;
}
