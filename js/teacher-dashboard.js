// js/teacher-dashboard.js
import { API_BASE } from "./api.js";

const nameEl = document.getElementById("teacherName");
const emailEl = document.getElementById("teacherEmail");
const totalSessionsEl = document.getElementById("totalSessions");
const openSessionsEl = document.getElementById("openSessions");
const totalAttendanceEl = document.getElementById("totalAttendance");
const tableBody = document.getElementById("sessionTable");
const msgEl = document.getElementById("msg");

// ดึง session ครูจาก sessionStorage
const teacherEmail = sessionStorage.getItem("teacherEmail");
const teacherName = sessionStorage.getItem("teacherName");

if (!teacherEmail) {
  // ยังไม่ล็อกอิน → เด้งกลับ
  window.location.href = "login.html";
}

nameEl.textContent = teacherName || "Teacher";
emailEl.textContent = teacherEmail || "";

function showMessage(text, type = "error") {
  msgEl.textContent = text;
  if (type === "success") {
    msgEl.style.color = "#4ade80";
  } else {
    msgEl.style.color = "#fb7185";
  }
}

async function loadDashboard() {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        action: "getTeacherDashboard",
        teacherEmail
      })
    });

    const data = await res.json();
    console.log("getTeacherDashboard >", data);

    if (!data.success) {
      showMessage(data.message || "ไม่สามารถดึงข้อมูล Dashboard ได้");
      return;
    }

    // สรุปตัวเลข
    const summary = data.summary || {};
    totalSessionsEl.textContent = summary.totalSessions ?? 0;
    openSessionsEl.textContent = summary.openSessions ?? 0;
    totalAttendanceEl.textContent = summary.totalAttendance ?? 0;

    // ตารางคาบ
    const sessions = data.sessions || [];
    tableBody.innerHTML = "";

    if (!sessions.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="empty">ยังไม่มีคาบในระบบ</td>`;
      tableBody.appendChild(tr);
      return;
    }

    sessions.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.subject || "-"}</td>
        <td>${s.token || "-"}</td>
        <td>${s.createdAt || "-"}</td>
        <td class="${s.status === "OPEN" ? "status-open" : "status-closed"}">
          ${s.status || "-"}
        </td>
      `;
      tableBody.appendChild(tr);
    });

    showMessage("โหลดข้อมูลสำเร็จ","success");

  } catch (err) {
    console.error(err);
    showMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
  }
}

loadDashboard();
