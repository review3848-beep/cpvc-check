// js/student-login.js
import { API_BASE } from "./api.js";

// ดึง Element จาก HTML
const idInput   = document.getElementById("studentId");
const passInput = document.getElementById("password");
const loginBtn  = document.getElementById("loginBtn");
const msgEl     = document.getElementById("msg");

// ฟังก์ชันแสดงข้อความแจ้งเตือน
function showMessage(text, type = "error") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  // ถ้าเป็น success ให้สีเขียว, ถ้าไม่ใช่ให้สีแดงชมพู
  msgEl.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

// ฟังก์ชันหลักสำหรับ Login
async function handleLogin() {
  // 1. ดึงค่าและตัดช่องว่างซ้ายขวาออก (Trim)
  const id   = (idInput?.value || "").trim();
  const pass = (passInput?.value || "").trim();

  // 2. เช็คว่ากรอกครบไหม (Client-side validation)
  if (!id || !pass) {
    showMessage("กรุณากรอกรหัสนักเรียนและรหัสผ่านให้ครบ");
    return;
  }

  // เคลียร์ข้อความเก่า และปิดปุ่มชั่วคราวกันกดซ้ำ
  showMessage("");
  if (loginBtn) loginBtn.disabled = true;

  try {
    // 3. ส่งข้อมูลไปที่ Google Apps Script (API)
    const res = await fetch(API_BASE, {
      method: "POST",
      // ใช้ text/plain เพื่อเลี่ยงปัญหา CORS ของ Google Apps Script (ถูกต้องแล้วครับ)
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
      body: JSON.stringify({ 
        action: "loginStudent", 
        id: id,
        password: pass  // <--- *** จุดที่แก้: ต้องส่งรหัสผ่านไปด้วยครับ ***
      }) 
    });

    const data = await res.json();

    // 4. ตรวจสอบผลลัพธ์จาก Server
    if (!data.success) {
      showMessage(data.message || "รหัสผ่านไม่ถูกต้อง หรือไม่พบผู้ใช้");
      return;
    }

    // 5. ถ้าสำเร็จ: บันทึกลง localStorage
    const studentInfo = {
      id:   data.id,
      name: data.name
    };
    localStorage.setItem("cpvc_student", JSON.stringify(studentInfo));

    showMessage("เข้าสู่ระบบสำเร็จ กำลังนำไปหน้าเช็คชื่อ...", "success");
    
    // หน่วงเวลาเล็กน้อยให้ผู้ใช้เห็นข้อความสำเร็จก่อนเปลี่ยนหน้า
    setTimeout(() => {
        window.location.href = "scan.html";
    }, 1000);

  } catch (err) {
    console.error("loginStudent error:", err);
    showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  } finally {
    // เปิดปุ่มให้กดได้อีกครั้ง (เผื่อกรณี Error)
    if (loginBtn) loginBtn.disabled = false;
  }
}

// ฟังก์ชันเริ่มต้นระบบ (Event Listeners)
function init() {
  // ดักจับการกดปุ่ม Login
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault(); // กัน Form submit แบบปกติ
      handleLogin();
    });
  }

  // ดักจับการกด Enter ในช่องกรอกข้อมูล
  [idInput, passInput].forEach((el) => {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });
}

// เริ่มทำงานเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", init);