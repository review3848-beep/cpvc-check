// js/teacher-login.js
import { callApi } from "./api.js";

/* ================= DOM ================= */
const emailInput = document.getElementById("email");
const pwInput    = document.getElementById("password");
const btn        = document.getElementById("loginBtn");
const msgEl      = document.getElementById("msg");

/* ================= INIT ================= */
btn.addEventListener("click", login);

pwInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});
emailInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

/* ================= LOGIN ================= */
async function login(){
  const email    = emailInput.value.trim();
  const password = pwInput.value.trim();

  setMsg("");

  if (!email || !password){
    setMsg("⚠️ กรุณากรอกอีเมลและรหัสผ่านให้ครบ", "#fbbf24");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try{
    const res = await callApi("teacherLogin", {
      email,
      password
    });

    if (!res || !res.success){
      throw new Error(res?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }

    // 🔐 เก็บ session ครู
    localStorage.setItem("cpvc_teacher", JSON.stringify({
      teacherId: res.teacher.teacherId,
      name: res.teacher.name,
      email: res.teacher.email
    }));

    setMsg("✅ เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า Dashboard...", "#4ade80");

    setTimeout(()=>{
      location.href = "dashboard.html";
    }, 600);

  }catch(err){
    setMsg("❌ " + err.message, "#f87171");
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
}

/* ================= HELPERS ================= */
function setMsg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
