// js/teacher-register.js
import { callApi } from "../api.js";

/* ================= DOM ================= */
const nameInput  = document.getElementById("name");
const emailInput = document.getElementById("email");
const pwInput    = document.getElementById("password");
const btn        = document.getElementById("registerBtn");
const msgEl      = document.getElementById("msg");

/* ================= INIT ================= */
btn.addEventListener("click", register);

pwInput.addEventListener("keydown", e => {
  if (e.key === "Enter") register();
});
emailInput.addEventListener("keydown", e => {
  if (e.key === "Enter") register();
});
nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") register();
});

/* ================= REGISTER ================= */
async function register(){
  const name     = nameInput.value.trim();
  const email    = emailInput.value.trim();
  const password = pwInput.value.trim();

  setMsg("");

  if (!name || !email || !password){
    setMsg("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง", "#fbbf24");
    return;
  }

  if (password.length < 4){
    setMsg("⚠️ รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร", "#fbbf24");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครใช้งาน...";

  try{
    const res = await callApi("teacherRegister", {
      name,
      email,
      password
    });

    if (!res || !res.success){
      throw new Error(res?.message || "สมัครใช้งานไม่สำเร็จ");
    }

    setMsg("✅ สมัครครูสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...", "#4ade80");

    setTimeout(()=>{
      location.href = "login.html";
    }, 900);

  }catch(err){
    setMsg("❌ " + err.message, "#f87171");
    btn.disabled = false;
    btn.textContent = "สมัครใช้งาน";
  }
}

/* ================= HELPERS ================= */
function setMsg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
