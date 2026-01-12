// js/admin-login.js
import { callApi } from "../api.js";


const userEl = document.getElementById("username");
const passEl = document.getElementById("password");
const btnEl  = document.getElementById("loginBtn");
const msgEl  = document.getElementById("msg");

btnEl.addEventListener("click", login);
passEl.addEventListener("keydown", (e)=>{ if(e.key==="Enter") login(); });

function setMsg(text, type=""){
  msgEl.textContent = text || "";
  msgEl.classList.remove("is-error","is-ok");
  if(type) msgEl.classList.add(type);
}

async function login(){
  const username = (userEl.value || "").trim();
  const password = (passEl.value || "").trim();

  setMsg("");
  if(!username || !password){
    setMsg("กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ", "is-error");
    return;
  }

  btnEl.disabled = true;
  btnEl.textContent = "กำลังเข้าสู่ระบบ...";

  try{
    const r = await callApi("adminLogin", { username, password });

    if(!r?.success){
      setMsg(r?.message || "เข้าสู่ระบบไม่สำเร็จ", "is-error");
      return;
    }

    const admin = r.admin || r.data || { username };
    localStorage.setItem("admin", JSON.stringify(admin));

    setMsg("เข้าสู่ระบบสำเร็จ", "is-ok");
    setTimeout(()=> location.href = "dashboard.html", 350);

  }catch(err){
    setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (API/เน็ต/สิทธิ์ Web App)", "is-error");
  }finally{
    btnEl.disabled = false;
    btnEl.textContent = "เข้าสู่ระบบ";
  }
}
