// js/admin-dashboard.js

// ช่องโชว์ชื่อแอดมินบน navbar
const adminNameSpan = document.getElementById("adminName");

// การ์ดทั้งหมด (ปุ่ม "เปิดดู")
const cards = document.querySelectorAll(".card");

// เวลาเจอ error หรืออยากแจ้งเตือนอะไร ใช้ alert ไปก่อน
function guardAdmin() {
  const adminName = sessionStorage.getItem("adminName");
  const adminEmail = sessionStorage.getItem("adminEmail");

  // ถ้าไม่มี session แอดมิน -> เด้งกลับหน้า login admin
  if (!adminName || !adminEmail) {
    window.location.href = "login.html";
    return null;
  }

  if (adminNameSpan) {
    adminNameSpan.textContent = adminName;
  }

  return { adminName, adminEmail };
}

document.addEventListener("DOMContentLoaded", () => {
  const admin = guardAdmin();
  if (!admin) return;

  // ปุ่มแต่ละการ์ดยังไม่ทำหน้าแยก → ให้ขึ้น alert นิ่ม ๆ ไปก่อน
  cards.forEach((card, index) => {
    const btn = card.querySelector(".btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      switch (index) {
        case 0:
          alert("ฟีเจอร์: จัดการครู (ยังไม่ทำหน้าแยกให้)");
          break;
        case 1:
          alert("ฟีเจอร์: จัดการนักเรียน (ยังไม่ทำหน้าแยกให้)");
          break;
        case 2:
          alert("ฟีเจอร์: ดูคาบเรียนทั้งหมด (ยังไม่ทำหน้าแยกให้)");
          break;
        case 3:
          alert("ฟีเจอร์: ดูประวัติการเช็คชื่อทั้งหมด (ยังไม่ทำหน้าแยกให้)");
          break;
        default:
          alert("เมนูนี้ยังไม่เปิดใช้งาน");
      }
    });
  });
});