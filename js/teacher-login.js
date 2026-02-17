import { callApi } from "../api.js";

/* ================= DOM ================= */
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const loginBtn   = document.getElementById("loginBtn");
const msgEl      = document.getElementById("msg");

/* ================= INIT ================= */
loginBtn?.addEventListener("click", login);
passInput?.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

/* ================= LOGIN ================= */
async function login(){
  const email    = (emailInput?.value || "").trim();
  const password = (passInput?.value || "").trim();

  showMsg("", "");

  if(!email || !password){
    showMsg("⚠️ กรุณากรอกอีเมลและรหัสผ่าน");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "กำลังเข้าสู่ระบบ...";

  try{
    const res = await callApi("teacherLogin", { email, password });

    if(!res?.success) throw new Error(res?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");

    // ✅ รองรับทั้ง teacherId และ id เผื่อ backend เปลี่ยน
    const t = res.teacher || {};
    const teacherId = String(t.teacherId ?? t.id ?? "").trim();
    const name  = String(t.name ?? "").trim();
    const em    = String(t.email ?? email).trim();

    if(!teacherId){
      throw new Error("ระบบไม่ส่ง teacherId กลับมา (ตรวจ teacherLogin_ ที่ GAS)");
    }

    /* === save session === */
    localStorage.setItem("teacherSession", JSON.stringify({
      teacherId,      // ✅ ตัวจริง
      id: teacherId,  // ✅ เผื่อหน้าบางไฟล์ยังใช้ id
      name,
      email: em,
      loginAt: Date.now()
    }));

    showMsg("✅ เข้าสู่ระบบสำเร็จ", "ok");

    setTimeout(() => {
      location.href = "dashboard.html";
    }, 400);

  }catch(err){
    console.error(err);
    showMsg(err?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง", "err");
  }finally{
    loginBtn.disabled = false;
    loginBtn.textContent = "เข้าสู่ระบบ";
  }
}

/* ================= UI ================= */
function showMsg(text, type=""){
  if(!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color =
    type==="ok"  ? "#22c55e" :
    type==="err" ? "#ef4444" :
    "#facc15";
}
