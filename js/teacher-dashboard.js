// js/teacher-dashboard.js
import { API_BASE } from "./api.js";

const nameEl   = document.getElementById("teacherName");
const emailEl  = document.getElementById("teacherEmail");
const msgEl    = document.getElementById("msg");
const tbody    = document.getElementById("sessionTable");
const btnExport = document.getElementById("exportBtn");

const totalSessionsEl   = document.getElementById("totalSessions");
const openSessionsEl    = document.getElementById("openSessions");
const totalAttendEl     = document.getElementById("totalAttendance");

// --------------------- utils ---------------------
function showMessage(text, type = "error") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.style.color = type === "success" ? "#4ade80" : "#f97373";
}

// --------------------- init ---------------------
document.addEventListener("DOMContentLoaded", () => {
  const teacherName  = sessionStorage.getItem("teacherName");
  const teacherEmail = sessionStorage.getItem("teacherEmail");

  if (!teacherEmail) {
    // ถ้าไม่มี session ให้เด้งกลับหน้า login
    window.location.href = "login.html";
    return;
  }

  if (nameEl)  nameEl.textContent  = teacherName || "-";
  if (emailEl) emailEl.textContent = teacherEmail;

  loadDashboard(teacherEmail);

  if (btnExport) {
    btnExport.addEventListener("click", () => exportAttendance(teacherEmail));
  }
});

// --------------------- call API ---------------------
async function loadDashboard(teacherEmail) {
  showMessage("");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "getTeacherDashboard",
        teacherEmail,
      }),
    });

    const data = await res.json();
    console.log("getTeacherDashboard >", data);

    if (!data.success) {
      showMessage(data.message || "ไม่สามารถโหลดข้อมูลได้");
      renderSessions([]); // เคลียร์ตาราง
      return;
    }

    // อัปเดตตัวเลข summary
    if (totalSessionsEl)  totalSessionsEl.textContent  = data.summary?.totalSessions ?? 0;
    if (openSessionsEl)   openSessionsEl.textContent   = data.summary?.openSessions ?? 0;
    if (totalAttendEl)    totalAttendEl.textContent    = data.summary?.totalAttendance ?? 0;

    // เรนเดอร์คาบล่าสุดจาก data.sessions (raw row จากชีต)
    renderSessions(data.sessions || []);

  } catch (err) {
    console.error(err);
    showMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    renderSessions([]);
  }
}

function renderSessions(sessions) {
  if (!tbody) return;

  if (!sessions || sessions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>`;
    return;
  }

  // เอาแค่คาบล่าสุด 5 คาบพอ
  const latest = sessions.slice(0, 5);

  const rowsHtml = latest
    .map((row) => {
      // row = [ TEACHER_EMAIL, SUBJECT, ROOM, TOKEN, STATUS, START_TIME ]
      const subject = row[1] || "-";
      const room    = row[2] || "";
      const token   = row[3] || "-";
      const status  = row[4] || "";
      const start   = row[5];

      let dateStr = "-";
      if (start) {
        const d = new Date(start);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }

      const statusClass = status === "OPEN" ? "status-open" : "status-closed";
      const subjectText = room ? `${subject} (${room})` : subject;

      return `
        <tr>
          <td>${subjectText}</td>
          <td>${token}</td>
          <td>${dateStr}</td>
          <td class="${statusClass}">${status || "-"}</td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = rowsHtml;
}

// export CSV
async function exportAttendance(teacherEmail) {
  showMessage("");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "exportTeacherAttendance",
        teacherEmail,
      }),
    });

    const data = await res.json();
    console.log("exportTeacherAttendance >", data);

    if (!data.success) {
      showMessage(data.message || "ไม่สามารถ Export ข้อมูลได้");
      return;
    }

    // สร้างไฟล์ CSV แล้วดาวน์โหลด
    const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.fileName || "attendance.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage("Export ข้อมูลเรียบร้อย", "success");
  } catch (err) {
    console.error(err);
    showMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  }
}
