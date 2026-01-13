import { callApi } from "../api.js";

const userEl = document.getElementById("username");
const passEl = document.getElementById("password");
const btnEl  = document.getElementById("loginBtn");
const msgEl  = document.getElementById("msg");

const ADMIN_KEY = "admin";

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

    const admin = r.admin || r.data || { username, name: "Admin" };

    // ✅ เซฟ session key ที่ dashboard อ่านจริง
    localStorage.setItem(ADMIN_KEY, JSON.stringify({
      username: admin.username || username,
      name: admin.name || "Admin",
      ts: Date.now()
    }));

    setMsg("เข้าสู่ระบบสำเร็จ", "is-ok");

    // ✅ สำคัญ: redirect ในโฟลเดอร์ admin
    setTimeout(()=> location.href = "./dashboard.html", 200);

  }catch(err){
    console.error(err);
    setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (API/เน็ต/สิทธิ์ Web App)", "is-error");
  }finally{
    btnEl.disabled = false;
    btnEl.textContent = "เข้าสู่ระบบ";
  }
}
