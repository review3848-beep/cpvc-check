// js/teacher-dashboard.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const nameEl  = document.getElementById("teacherName");
  const emailEl = document.getElementById("teacherEmail");
  const msgEl   = document.getElementById("msg");

  function setMsg(text, ok = false) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f87171";
  }

  // 1) อ่าน session
  let teacher = null;
  try {
    const raw = sessionStorage.getItem("teacher");
    if (!raw) {
      window.location.href = "login.html";
      return;
    }
    teacher = JSON.parse(raw);
    if (!teacher || !teacher.email) {
      sessionStorage.removeItem("teacher");
      window.location.href = "login.html";
      return;
    }
  } catch (e) {
    sessionStorage.removeItem("teacher");
    window.location.href = "login.html";
    return;
  }

  // 2) แสดงชื่อบนมุมขวา
  if (nameEl)  nameEl.textContent  = teacher.name  || "-";
  if (emailEl) emailEl.textContent = teacher.email || "-";

  // 3) ดึงข้อมูล Dashboard จาก GAS
  try {
    const res = await callApi("getTeacherDashboard", {
      teacherEmail: teacher.email,
    });

    if (!res.success) {
      setMsg(res.message || "โหลดข้อมูลไม่สำเร็จ");
      return;
    }

    const summary = res.summary || {};
    const sessions = res.sessions || [];

    const totalSessionsEl   = document.getElementById("totalSessions");
    const openSessionsEl    = document.getElementById("openSessions");
    const totalAttendanceEl = document.getElementById("totalAttendance");
    const tableBody         = document.getElementById("sessionTable");

    if (totalSessionsEl)   totalSessionsEl.textContent   = summary.totalSessions ?? 0;
    if (openSessionsEl)    openSessionsEl.textContent    = summary.openSessions ?? 0;
    if (totalAttendanceEl) totalAttendanceEl.textContent = summary.totalAttendance ?? 0;

    if (tableBody) {
      tableBody.innerHTML = "";
      if (!sessions.length) {
        tableBody.innerHTML = `<tr><td colspan="4" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>`;
      } else {
        sessions.slice(0, 10).forEach(row => {
          const subject = row[1] || "-";
          const token   = row[3] || "-";
          const dt      = row[5] ? new Date(row[5]) : null;
          const status  = row[4] || "-";

          const dateText = dt
            ? dt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
            : "-";

          const statusClass = status === "OPEN" ? "status-open" : "status-closed";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${subject}</td>
            <td>${token}</td>
            <td>${dateText}</td>
            <td class="${statusClass}">${status}</td>
          `;
          tableBody.appendChild(tr);
        });
      }
    }

  } catch (err) {
    console.error(err);
    setMsg("เกิดข้อผิดพลาดในการโหลด Dashboard");
  }

  // 4) ปุ่ม Export (ถ้ามี)
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const res = await callApi("exportTeacherAttendance", {
          teacherEmail: teacher.email,
        });

        if (!res.success) {
          setMsg(res.message || "Export ไม่สำเร็จ");
          return;
        }

        // โหลดไฟล์ CSV
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url;
        a.download = res.fileName || "attendance.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setMsg("Export CSV สำเร็จ", true);
      } catch (err) {
        console.error(err);
        setMsg("Export ไม่สำเร็จ");
      }
    });
  }
});
