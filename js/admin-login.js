import { callApi } from "ใ./api.js"; // หรือ ../js/api.js ตามโครงจริง

const form = document.querySelector(".auth-form") || document.querySelector("form");
const userEl = document.getElementById("username");
const passEl = document.getElementById("password");
const msgEl  = document.getElementById("msg");
const btn    = document.getElementById("loginBtn");

function setMsg(t){ if(msgEl) msgEl.textContent = t || ""; }

btn?.addEventListener("click", login);

async function login(){
  const username = userEl.value.trim();
  const password = passEl.value.trim();
  if(!username || !password) return setMsg("กรอกชื่อผู้ใช้และรหัสผ่าน");

  btn.disabled = true;
  setMsg("กำลังเข้าสู่ระบบ...");

  try{
    const res = await callApi("adminLogin", { username, password });

    if(!res?.success) {
      setMsg(res?.message || "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }

    // ✅ สำคัญ: ต้องเก็บ key = "admin"
    localStorage.setItem("admin", JSON.stringify(res.admin));

    // ✅ ไปหน้าแดชบอร์ด
    window.location.href = "./dashboard.html";
  }catch(e){
    console.error(e);
    setMsg("เชื่อมต่อไม่สำเร็จ");
  }finally{
    btn.disabled = false;
  }
}
