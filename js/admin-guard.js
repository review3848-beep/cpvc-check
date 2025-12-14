import { callApi } from "./api.js";

/* =========================
   ROLE GUARD
========================= */

export async function guardAdmin(options = {}) {
  try {
    const me = await callApi("adminMe"); 
    // { role: "SUPER_ADMIN" | "ADMIN", name: "Admin A" }

    if (!me || !me.role) {
      redirectLogin();
      return;
    }

    // ตรวจ role หน้านี้
    if (options.requireRole && me.role !== options.requireRole) {
      alert("ไม่มีสิทธิ์เข้าหน้านี้");
      location.href = "dashboard.html";
      return;
    }

    applyRoleUI(me.role);
    showAdminName(me.name);

  } catch (e) {
    redirectLogin();
  }
}

/* =========================
   UI CONTROL
========================= */
function applyRoleUI(role) {
  // ซ่อน element ที่ไม่ใช่ SUPER_ADMIN
  document.querySelectorAll("[data-role='super']").forEach(el => {
    if (role !== "SUPER_ADMIN") {
      el.style.display = "none";
    }
  });

  // ซ่อน element ที่ไม่ใช่ ADMIN
  document.querySelectorAll("[data-role='admin']").forEach(el => {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      el.style.display = "none";
    }
  });
}

function showAdminName(name) {
  const el = document.getElementById("adminName");
  if (el && name) el.textContent = name;
}

/* =========================
   HELPERS
========================= */
function redirectLogin() {
  location.href = "login.html";
}
