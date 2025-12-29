import { callApi } from "./api.js";

/* ================= DOM ================= */
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const loginBtn   = document.getElementById("loginBtn");
const msgEl      = document.getElementById("msg");

/* ================= INIT ================= */
loginBtn.addEventListener("click", login);

passInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

/* ================= LOGIN ================= */
async function login(){
  const email    = emailInput.value.trim();
  const password = passInput.value.trim();

  msgEl.textContent = "";
  msgEl.style.color = "#facc15";

  if(!email || !password){
    showMsg("⚠️ กรุณากรอกอีเมลและรหัสผ่าน");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "กำลังเข้าสู่ระบบ...";

  try{
    const res = await callApi("teacherLogin", {
      email,
      password
    });

    if(!res.success) throw res.message;

    /* === save session === */
    localStorage.setItem("teacherSession", JSON.stringify({
      id:    res.teacher.id,
      name:  res.teacher.name,
      email: res.teacher.email
    }));

    showMsg("✅ เข้าสู่ระบบสำเร็จ", "ok");

    setTimeout(() => {
      location.href = "open-session.html";
    }, 700);

  }catch(err){
    showMsg(err || "อีเมลหรือรหัสผ่านไม่ถูกต้อง", "err");
  }

  loginBtn.disabled = false;
  loginBtn.textContent = "เข้าสู่ระบบ";
}

/* ================= UI ================= */
function showMsg(text, type=""){
  msgEl.textContent = text;
  msgEl.style.color =
    type==="ok"  ? "#22c55e" :
    type==="err" ? "#ef4444" :
    "#facc15";
}
