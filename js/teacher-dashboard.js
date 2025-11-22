// js/teacher-dashboard.js
import { API_BASE } from "./api.js";

const nameSpan = document.getElementById("teacherName");
const emailSpan = document.getElementById("teacherEmail");

const totalSessionsEl = document.getElementById("totalSessions");
const openSessionsEl = document.getElementById("openSessions");
const totalAttendanceEl = document.getElementById("totalAttendance");

const sessionTable = document.getElementById("sessionTable");
const exportBtn = document.getElementById("exportBtn");
const msg = document.getElementById("msg");

function show(text, type = "error") {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

// โหลดข้อมูลครู
document.addEventListener("DOMContentLoaded", () => {
  const name = sessionStorage.getItem("teacherName");
  const email = sessionStorage.getItem("teacherEmail");

  if (!name || !email) {
    window.location.href = "login.html";
    return;
  }

  nameSpan.textContent = name;
  emailSpan.textContent = email;

  loadSummary(email);
  loadRecentSessions(email);
});

// =============================================================
// สรุป Dashboard
// =============================================================
async function loadSummary(teacherEmail) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "getTeacherDashboard",
        teacherEmail,
      }),
    });

    const data = await res.json();
    console.log("getTeacherDashboard >", data);

    if (!data.success) {
      return show(data.message || "โหลดข้อมูลสรุปไม่สำเร็จ");
    }

    const sum = data.summary;
    totalSessionsEl.textContent = sum.totalSessions ?? 0;
    openSessionsEl.textContent = sum.openSessions ?? 0;
    totalAttendanceEl.textContent = sum.totalAttendance ?? 0;

  } catch (err) {
    console.error(err);
    show("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }
}

// =============================================================
// โหลดคาบล่าสุดของครู
// =============================================================
async function loadRecentSessions(teacherEmail) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "getTeacherDashboard", // ใช้ action เดิม (รวมข้อมูล)
        teacherEmail,
      }),
    });

    const data = await res.json();
    if (!data.success) return;

    // ต้องดึงข้อมูลจาก SESSIONS ด้วยแยกต่างหาก
    loadSessionsList(teacherEmail);

  } catch (err) {
    console.error(err);
  }
}

async function loadSessionsList(teacherEmail) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({
        action: "getSessionsByTeacher", // ❗ ถ้ายังไม่มี เดี๋ยวสร้างอธิบายให้ต่อ
        teacherEmail,
      }),
    });

    const data = await res.json();
    console.log("getSessionsByTeacher >", data);

    sessionTable.innerHTML = "";

    if (!data.success || data.sessions.length === 0) {
      sessionTable.innerHTML =
        `<tr><td colspan="4" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>`;
      return;
    }

    data.sessions.forEach((s) => {
      const tr = document.createElement("tr");

      const created = s.start
        ? new Date(s.start).toLocaleString("th-TH", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "-";

      tr.innerHTML = `
        <td>${s.subject}</td>
        <td>${s.token}</td>
        <td>${created}</td>
        <td class="${s.status === "OPEN" ? "status-open" : "status-closed"}">
            ${s.status === "OPEN" ? "เปิดอยู่" : "ปิดแล้ว"}
        </td>
      `;
      sessionTable.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    sessionTable.innerHTML =
      `<tr><td colspan="4" class="empty">โหลดข้อมูลไม่ได้</td></tr>`;
  }
}

// =============================================================
// Export CSV
// =============================================================
if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    const teacherEmail = sessionStorage.getItem("teacherEmail");
    if (!teacherEmail) return;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        body: JSON.stringify({
          action: "exportTeacherAttendance",
          teacherEmail,
        }),
      });

      const data = await res.json();
      console.log("exportTeacherAttendance >", data);

      if (!data.success) {
        return show(data.message || "Export ไม่สำเร็จ");
      }

      // ดาวน์โหลดไฟล์ CSV
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName || "attendance.csv";
      a.click();

      URL.revokeObjectURL(url);

      show("ดาวน์โหลดไฟล์สำเร็จ", "success");

    } catch (err) {
      console.error(err);
      show("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  });
}
