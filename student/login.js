// student/login.js
import { callApi } from "../api.js";

/* ================= DOM ================= */
const idInput = document.getElementById("studentId");
const pwInput = document.getElementById("password");
const btn     = document.getElementById("loginBtn");
const msgEl   = document.getElementById("msg");

/* ================= INIT ================= */
btn.addEventListener("click", login);

pwInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

idInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

/* ================= LOGIN ================= */
async function login(){
  const studentId = idInput.value.trim();
  const password  = pwInput.value.trim();

  msg("");

  if (!studentId || !password){
    msg("⚠️ กรุณากรอกรหัสนักเรียนและรหัสผ่านให้ครบ", "#fbbf24");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try{
    const res = await callApi("studentLogin", {
      studentId,
      password
    });

    if (!res || !res.success){
      throw new Error(res?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }

    // 🔐 เก็บ session นักเรียน
    localStorage.setItem("cpvc_student", JSON.stringify({
      studentId: res.student.studentId,
      name: res.student.name
    }));

    msg("✅ เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า Dashboard...", "#4ade80");

    setTimeout(()=>{
      location.href = "dashboard.html";
    }, 600);

  }catch(err){
    msg("❌ " + err.message, "#f87171");
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
}

/* ================= HELPERS ================= */
function msg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
