// student/login.js
import { callApi, clearAllSession } from "../api.js";

const idInput = document.getElementById("studentId");
const pwInput = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msgEl = document.getElementById("msg");

btn?.addEventListener("click", login);
pwInput?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") login(); });

async function login(){
  const studentId = String(idInput?.value || "").trim();
  const password = String(pwInput?.value || "").trim();

  setMsg("");

  if(!studentId || !password){
    setMsg("⚠️ กรุณากรอกข้อมูลให้ครบ", "#fbbf24");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try{
    const res = await callApi("studentLogin", { studentId, password });
    if(!res || !res.success) throw new Error(res?.message || "เข้าสู่ระบบไม่สำเร็จ");

    clearAllSession();
    localStorage.setItem("cpvc_student", JSON.stringify(res.student));
    location.href = "dashboard.html";
  }catch(err){
    setMsg("❌ " + (err.message || err), "#f87171");
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
}

function setMsg(t, color){
  if(!msgEl) return;
  msgEl.textContent = t || "";
  msgEl.style.color = color || "#e5e7eb";
}
