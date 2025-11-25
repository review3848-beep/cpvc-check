// js/admin-dashboard.js
import { callApi } from "./api.js";

const adminName  = sessionStorage.getItem("adminName");
const adminEmail = sessionStorage.getItem("adminEmail");

// ถ้าไม่ได้ล็อกอิน -> เด้งกลับหน้า admin login
if (!adminEmail) {
  window.location.href = "login.html";
}

document.getElementById("adminName").textContent  = adminName || "Admin";
document.getElementById("adminEmail").textContent = adminEmail || "";

//ที่หน้า Dashboard ยังไม่ได้ดึงข้อมูลจาก GAS จริง ๆ
// เดี๋ยวรอบหน้าเราจะเพิ่ม action สำหรับ admin เช่น getAdminSummary ใน Code.gs
// ตอนนี้ให้ set ค่า mock ไว้ก่อน หรือดึงจาก API ถ้าพร้อมแล้ว

const totalTeachersEl   = document.getElementById("totalTeachers");
const totalStudentsEl   = document.getElementById("totalStudents");
const totalSessionsEl   = document.getElementById("totalSessions");
const totalAttendanceEl = document.getElementById("totalAttendance");
const msgTableBody      = document.getElementById("sessionTable");
const reloadBtn         = document.getElementById("reloadBtn");
const logoutBtn         = document.getElementById("logoutBtn");

// ฟังก์ชันโหลด summary จาก GAS (ต้องไปเพิ่ม action ใน Code.gs ชื่อ getAdminSummary)
async function loadSummary() {
  try {
    // ถ้า Code.gs ยังไม่มี getAdminSummary ให้ยังไม่เรียก
    // ถ้าพร้อมแล้ว เราจะใช้โค้ดแบบนี้:
    // const res = await callApi("getAdminSummary", {});
    // if (res.success) { ... }

    // ตอนนี้ขอใส่ mock data ชั่วคราวเพื่อให้ UI ดูมีชีวิต
    totalTeachersEl.textContent   = "—";
    totalStudentsEl.textContent   = "—";
    totalSessionsEl.textContent   = "—";
    totalAttendanceEl.textContent = "—";

    // ปล่อยตารางไว้ตาม placeholder เดิม
  } catch (err) {
    console.error(err);
  }
}

// ปุ่มรีเฟรช
reloadBtn.addEventListener("click", loadSummary);

// ปุ่มออกจากระบบ
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("adminName");
  sessionStorage.removeItem("adminEmail");
  window.location.href = "login.html";
});

// เรียกตอนเปิดหน้า
loadSummary();
