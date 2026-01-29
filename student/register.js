// student/register.js
import { callApi } from "../api.js";

/* ================= DOM ================= */
const idInput   = document.getElementById("studentId");
const nameInput = document.getElementById("name");
const pwInput   = document.getElementById("password");
const btn       = document.getElementById("registerBtn");
const msgEl     = document.getElementById("msg");

/* ================= STATE ================= */
let foundName = "";         // ชื่อที่ได้จากระบบ
let lookupTimer = null;
let lastLookupId = "";

/* ================= INIT ================= */
nameInput.readOnly = true;  // ✅ ล็อกชื่อ ไม่ให้พิมพ์เอง

idInput.addEventListener("input", onIdChange);
idInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") pwInput.focus();
});

btn.addEventListener("click", register);

pwInput.addEventListener("keydown", e => {
  if (e.key === "Enter") register();
});

/* ================= LOOKUP NAME ================= */
function onIdChange(){
  clearTimeout(lookupTimer);

  const studentId = idInput.value.trim();
  foundName = "";
  nameInput.value = "";

  setMsg("");

  if (!studentId){
    return;
  }

  // กันยิงถี่เกิน / พิมพ์ยังไม่ครบ
  if (studentId.length < 4){
    setMsg("ℹ️ กรอกรหัสนักเรียนให้ครบเพื่อดึงชื่ออัตโนมัติ", "#93c5fd");
    return;
  }

  lookupTimer = setTimeout(() => lookupStudentName(studentId), 350);
}

async function lookupStudentName(studentId){
  // กันยิงซ้ำ id เดิม
  if (studentId === lastLookupId) return;
  lastLookupId = studentId;

  // UI: กำลังค้นหา
  nameInput.value = "กำลังค้นชื่อ...";
  setMsg("🔎 กำลังตรวจสอบรหัสนักเรียน...", "#93c5fd");

  try{
    // ✅ ใช้ callApi แบบเดิมของโปรเจกต์ (น่าจะเป็น JSONP/GET อยู่แล้วใน api.js)
    const res = await callApi("studentFindById", { studentId });

    // ถ้าระหว่างรอ ผู้ใช้พิมพ์เปลี่ยน id แล้ว => ทิ้งผลลัพธ์
    if (idInput.value.trim() !== studentId) return;

    if (!res || !res.success){
      foundName = "";
      nameInput.value = "";
      setMsg("⚠️ ไม่พบรหัสนักเรียนในระบบ", "#fbbf24");
      return;
    }

    // รองรับรูปแบบตอบกลับหลายแบบ
    const name =
      (res.student && res.student.name) ||
      (res.data && res.data.student && res.data.student.name) ||
      "";

    foundName = String(name || "").trim();
    nameInput.value = foundName;

    if(foundName){
      setMsg("✅ พบชื่อในระบบแล้ว", "#4ade80");
    }else{
      // ถ้ารหัสมีจริงแต่ชื่อว่าง
      setMsg("⚠️ พบรหัส แต่ยังไม่มีชื่อในระบบ", "#fbbf24");
    }

  }catch(err){
    // ถ้าระหว่างรอ ผู้ใช้พิมพ์เปลี่ยน id แล้ว => ทิ้งผลลัพธ์
    if (idInput.value.trim() !== studentId) return;

    foundName = "";
    nameInput.value = "";
    setMsg("❌ ดึงชื่อไม่สำเร็จ: " + (err.message || err), "#f87171");
  }
}

/* ================= REGISTER ================= */
async function register(){
  const studentId = idInput.value.trim();
  const password  = pwInput.value.trim();

  setMsg("");

  if (!studentId || !password){
    setMsg("⚠️ กรุณากรอก รหัสนักเรียน และ รหัสผ่าน", "#fbbf24");
    return;
  }

  // ✅ ต้องดึงชื่อได้ก่อนถึงสมัครได้ (กันสมัครมั่ว)
  if (!foundName){
    setMsg("⚠️ กรุณากรอกรหัสนักเรียนให้ถูกต้อง เพื่อให้ระบบดึงชื่ออัตโนมัติ", "#fbbf24");
    return;
  }

  if (password.length < 4){
    setMsg("⚠️ รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร", "#fbbf24");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครใช้งาน...";

  try{
    const res = await callApi("studentRegister", {
      studentId,
      name: foundName,     // ✅ ส่งชื่อจากระบบเท่านั้น
      password
    });

    if (!res || !res.success){
      throw new Error(res?.message || "สมัครใช้งานไม่สำเร็จ");
    }

    setMsg("✅ สมัครสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...", "#4ade80");

    setTimeout(()=>{
      location.href = "login.html";
    }, 900);

  }catch(err){
    setMsg("❌ " + (err.message || err), "#f87171");
    btn.disabled = false;
    btn.textContent = "สมัครใช้งาน";
  }
}

/* ================= HELPERS ================= */
function setMsg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
