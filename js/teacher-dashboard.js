// js/teacher-dashboard.js
import { callApi } from "./api.js";

const teacherStr = sessionStorage.getItem("teacher");
const teacherNameEl = document.getElementById("teacher-name");
const logoutBtn = document.getElementById("logout-btn");
const msgEl = document.getElementById("dashboard-message");

const statTotalSessions = document.getElementById("stat-total-sessions");
const statTotalAttendance = document.getElementById("stat-total-attendance");
const tableBody = document.querySelector("#sessions-table tbody");

// ถ้าไม่ล็อกอิน → เด้งกลับ
if (!teacherStr) {
  window.location.href = "login.html";
} else {
  const teacher = JSON.parse(teacherStr);
  teacherNameEl.textContent = `${teacher.name || "ครู"} (${teacher.email || ""})`;
  loadDashboard(teacher.id);
}

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("teacher");
  window.location.href = "login.html";
});

async function loadDashboard(teacherId) {
  msgEl.textContent = "";
  msgEl.className = "message-area";

  try {
    const res = await callApi("getTeacherDashboard", { teacherId });
    const data = res.data || {};
    const stats = data.stats || {};
    const sessions = data.sessions || [];

    statTotalSessions.textContent = stats.totalSessions ?? 0;
    statTotalAttendance.textContent = stats.totalAttendance ?? 0;

    tableBody.innerHTML = "";

    if (!sessions.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "ยังไม่มีข้อมูลคาบเรียนของครูคนนี้";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    sessions.forEach((s) => {
      const tr = document.createElement("tr");

      const tdDatetime = document.createElement("td");
      tdDatetime.textContent = s.datetime || "-";

      const tdSubject = document.createElement("td");
      tdSubject.textContent = s.subjectCode || "-";

      const tdToken = document.createElement("td");
      tdToken.textContent = s.token || "-";

      const tdStatus = document.createElement("td");
      tdStatus.textContent = s.status || "-";
      tdStatus.className = s.status === "OPEN" ? "badge-cell badge-open" : "badge-cell badge-closed";

      const tdCount = document.createElement("td");
      tdCount.textContent = s.attendanceCount ?? 0;

      tr.appendChild(tdDatetime);
      tr.appendChild(tdSubject);
      tr.appendChild(tdToken);
      tr.appendChild(tdStatus);
      tr.appendChild(tdCount);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    msgEl.textContent = err.message || "โหลดข้อมูล Dashboard ไม่สำเร็จ";
    msgEl.classList.add("error");
  }
}
