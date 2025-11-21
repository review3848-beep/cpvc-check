// js/admin-dashboard.js

const name = sessionStorage.getItem("adminName");

if (!name) {
  // ถ้าไม่มี session → ให้เด้งกลับหน้า login
  window.location.href = "login.html";
}

document.getElementById("adminName").textContent = name;
