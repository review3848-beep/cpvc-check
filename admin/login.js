import { callApi } from "../api.js";

const form = document.getElementById("loginForm");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msgEl = document.getElementById("msg");

function setMsg(t){ if(msgEl) msgEl.textContent = t || ""; }

document.addEventListener("DOMContentLoaded", () => {
  try{
    const a = JSON.parse(localStorage.getItem("admin"));
    if(a && (a.username || a.name)) location.replace("./dashboard.html");
  }catch{}
});

form?.addEventListener("submit", onSubmit);

async function onSubmit(e){
  e.preventDefault();

  const username = String(usernameEl?.value || "").trim();
  const password = String(passwordEl?.value || "").trim();

  if(!username || !password){
    setMsg("กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ");
    return;
  }

  btn.disabled = true;
  setMsg("กำลังเข้าสู่ระบบ...");

  try{
    const res = await callApi("adminLogin", { username, password });
    if(!res?.success) throw new Error(res?.message || "เข้าสู่ระบบไม่สำเร็จ");

    // ✅ คีย์เดียวทั้งระบบ
    localStorage.setItem("admin", JSON.stringify(res.admin));

    location.replace("./dashboard.html");
  }catch(err){
    console.error(err);
    setMsg(err.message || "เกิดข้อผิดพลาด");
    btn.disabled = false;
  }
}
