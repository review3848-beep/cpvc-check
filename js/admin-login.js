// js/admin-login.js
const GAS_WEBAPP_URL = "PUT_YOUR_GAS_WEBAPP_URL_HERE"; // <-- ใส่ลิงก์ Web App (ลงท้าย /exec)

const form = document.getElementById("loginForm");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const msgEl = document.getElementById("msg");
const btn = document.getElementById("loginBtn");

function setMsg(text, ok = false){
  msgEl.textContent = text || "";
  msgEl.style.color = ok ? "#86efac" : "#fca5a5";
}

function setLoading(loading){
  btn.disabled = loading;
  btn.textContent = loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
}

async function postJSON(url, data){
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(data)
  });

  // GAS บางทีตอบเป็น text
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error(text || "Invalid JSON response"); }
}

function saveAdminSession(admin){
  // เก็บแบบเบา ๆ พอใช้งานหน้าแดชบอร์ด/เช็คสิทธิ์
  localStorage.setItem("nexattend_admin", JSON.stringify({
    username: admin.username,
    name: admin.name || "Admin",
    ts: Date.now()
  }));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("");

  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();

  if(!GAS_WEBAPP_URL || GAS_WEBAPP_URL.includes("PUT_YOUR_GAS_WEBAPP_URL_HERE")){
    setMsg("ยังไม่ได้ตั้งค่า GAS_WEBAPP_URL ใน js/admin-login.js");
    return;
  }
  if(!username || !password){
    setMsg("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
    return;
  }

  setLoading(true);
  try{
    const data = await postJSON(GAS_WEBAPP_URL, {
      action: "adminLogin",
      username,
      password
    });

    if(!data || !data.success){
      throw new Error(data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }

    saveAdminSession(data.admin);
    setMsg("เข้าสู่ระบบสำเร็จ", true);

    // ไปหน้าแดชบอร์ดแอดมิน
    window.location.href = "./dashboard.html";
  }catch(err){
    setMsg(err.message || "เกิดข้อผิดพลาด");
  }finally{
    setLoading(false);
  }
});
