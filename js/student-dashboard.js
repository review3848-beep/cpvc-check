// js/student-dashboard.js
import { callApi } from "./api.js";

let statusChart = null;

function formatThaiDateTime(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function upper(x) {
  return String(x || "").toUpperCase().trim();
}

function statusPillHTML(stRaw) {
  const st = upper(stRaw);
  if (st === "OK") return `<span class="status-pill pill-ok">✅ OK</span>`;
  if (st === "LATE") return `<span class="status-pill pill-late">⏰ LATE</span>`;
  if (st === "ABSENT") return `<span class="status-pill pill-absent">❌ ABSENT</span>`;
  return `<span class="status-pill" style="border:1px solid rgba(148,163,184,.5);color:#cbd5e1;background:rgba(15,23,42,.8);">• ${stRaw || "-"}</span>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("studentNameDisplay");
  const idEl   = document.getElementById("studentIdDisplay");

  const totalEl       = document.getElementById("totalRecords");
  const okCountEl     = document.getElementById("okCount");
  const lateCountEl   = document.getElementById("lateCount");
  const okPercentEl   = document.getElementById("okPercent");
  const latePercentEl = document.getElementById("latePercent");
  const ratePercentEl = document.getElementById("ratePercent");

  const msgEl = document.getElementById("msg");

  const chartCanvas = document.getElementById("statusChart");
  const recentTableBody = document.getElementById("recentTableBody");

  // ---- read student session
  let student = null;
  try {
    const rawLocal = localStorage.getItem("cpvc_student");
    const rawSession = sessionStorage.getItem("student");
    const raw = rawLocal || rawSession;
    if (!raw) throw new Error("no session");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) throw new Error("invalid session");
    student = parsed;
  } catch (e) {
    window.location.href = "login.html";
    return;
  }

  if (nameEl) nameEl.textContent = student.name || "นักเรียน";
  if (idEl) idEl.textContent = student.studentId || "-";

  loadDashboard();

  async function loadDashboard() {
    setMsg("กำลังโหลดข้อมูลการเข้าเรียน...");

    try {
      const res = await callApi("getStudentHistory", { studentId: student.studentId });
      if (!res || !res.success) {
        throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
      }

      const history = Array.isArray(res.history) ? res.history : [];
      const total = history.length;

      const ok = history.filter(r => upper(r.status) === "OK").length;
      const late = history.filter(r => upper(r.status) === "LATE").length;
      const absent = history.filter(r => upper(r.status) === "ABSENT").length;

      const come = ok + late;
      const rate = total ? Math.round((come * 100) / total) : 0;
      const okPer = total ? Math.round((ok * 100) / total) : 0;
      const latePer = total ? Math.round((late * 100) / total) : 0;

      if (totalEl) totalEl.textContent = total;
      if (okCountEl) okCountEl.textContent = ok;
      if (lateCountEl) lateCountEl.textContent = late;
      if (okPercentEl) okPercentEl.textContent = okPer + "%";
      if (latePercentEl) latePercentEl.textContent = latePer + "%";
      if (ratePercentEl) ratePercentEl.textContent = rate + "%";

      if (!total) setMsg("ยังไม่มีประวัติการเช็คชื่อในระบบ");
      else setMsg("");

      renderChart(ok, late, absent);
      renderRecent(history);
    } catch (err) {
      console.error("student dashboard error:", err);
      setMsg(err?.message || "โหลดข้อมูลไม่สำเร็จ");
      renderChart(0, 0, 0);
      renderRecent([]);
    }
  }

  function setMsg(text) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
  }

  function renderChart(ok, late, absent) {
    if (!chartCanvas || typeof Chart === "undefined") return;

    const ctx = chartCanvas.getContext("2d");
    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["OK", "LATE", "ABSENT"],
        datasets: [
          {
            data: [ok, late, absent],
            backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: "#e5e7eb",
              font: { size: 11 },
            },
          },
        },
      },
    });
  }

  function renderRecent(history) {
    if (!recentTableBody) return;
    recentTableBody.innerHTML = "";

    if (!history.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty";
      td.textContent = "ยังไม่มีข้อมูลการเช็คชื่อในระบบ";
      tr.appendChild(td);
      recentTableBody.appendChild(tr);
      return;
    }

    // 10 รายการล่าสุด
    const last = history.slice(-10).reverse();

    last.forEach(row => {
      const tr = document.createElement("tr");

      const timeLabel = formatThaiDateTime(row.time || row.timestamp || row.createdAt || "-");

      const subject =
        row.subject ||
        row.subjectName ||
        row.course ||
        row.courseName ||
        row.className ||
        "-";

      const token = row.token || "-";
      const st = row.status || "-";

      const teacher =
        row.teacherName ||
        row.teacher ||
        row.teacherFullname ||
        row.teacherEmail ||
        "-";

      const tdTime = document.createElement("td");
      tdTime.textContent = timeLabel;
      tr.appendChild(tdTime);

      const tdSubject = document.createElement("td");
      tdSubject.textContent = subject;
      tr.appendChild(tdSubject);

      const tdToken = document.createElement("td");
      tdToken.textContent = token;
      tr.appendChild(tdToken);

      const tdStatus = document.createElement("td");
      tdStatus.innerHTML = statusPillHTML(st);
      tr.appendChild(tdStatus);

      const tdTeacher = document.createElement("td");
      tdTeacher.textContent = teacher;
      tr.appendChild(tdTeacher);

      recentTableBody.appendChild(tr);
    });
  }
});
