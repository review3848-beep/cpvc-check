// student/dashboard.js
import { callApi } from "api.js";

let chartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const msgEl = document.getElementById("msg");

  const nameEl = document.getElementById("studentNameDisplay");
  const idEl   = document.getElementById("studentIdDisplay");

  const totalEl = document.getElementById("totalRecords");
  const okEl    = document.getElementById("okCount");
  const lateEl  = document.getElementById("lateCount");
  const okPctEl   = document.getElementById("okPercent");
  const latePctEl = document.getElementById("latePercent");
  const rateEl    = document.getElementById("ratePercent");

  const tbody = document.getElementById("recentTableBody");

  // ===== AUTH =====
  const raw = localStorage.getItem("cpvc_student");
  if (!raw) {
    location.href = "login.html";
    return;
  }

  const student = JSON.parse(raw);
  const studentId = student.studentId;

  nameEl.textContent = student.name || "-";
  idEl.textContent   = studentId || "-";

  // ===== LOAD DATA =====
  let res;
  try {
    res = await callApi("studentGetDashboard", { studentId });
  } catch (e) {
    msgEl.textContent = "❌ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    return;
  }

  if (!res.success) {
    msgEl.textContent = res.message || "โหลดข้อมูลไม่สำเร็จ";
    return;
  }

  // ===== STATS =====
  const s = res.stats || {};
  const total  = s.total || 0;
  const ok     = s.OK || 0;
  const late   = s.LATE || 0;
  const absent = s.ABSENT || 0;

  totalEl.textContent = total;
  okEl.textContent    = ok;
  lateEl.textContent  = late;

  okPctEl.textContent   = total ? Math.round((ok / total) * 100) + "%" : "0%";
  latePctEl.textContent = total ? Math.round((late / total) * 100) + "%" : "0%";
  rateEl.textContent    = total
    ? Math.round(((ok + late) / total) * 100) + "%"
    : "0%";

  // ===== TABLE (ล่าสุด 10) =====
  tbody.innerHTML = "";
  const rows = res.recent || [];

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">ยังไม่มีข้อมูล</td></tr>`;
  } else {
    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.time || "-"}</td>
        <td>${r.subject || "-"}</td>
        <td>${r.token || "-"}</td>
        <td>${r.status || "-"}</td>
        <td>${r.teacher || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ===== CHART =====
  renderChart(ok, late, absent);
});

function renderChart(ok, late, absent) {
  const ctx = document.getElementById("statusChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["OK", "LATE", "ABSENT"],
      datasets: [{
        data: [ok, late, absent],
        backgroundColor: ["#4ade80", "#fb923c", "#fecaca"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            boxWidth: 12,
            font: { size: 11 }
          }
        }
      }
    }
  });
}
