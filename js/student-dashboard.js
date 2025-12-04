import { apiPost } from "./api.js";

const stuNameEl = document.getElementById("stuName");
const stuIdEl   = document.getElementById("stuId");

const totalRecordsEl = document.getElementById("totalRecords");
const okCountEl      = document.getElementById("okCount");
const lateCountEl    = document.getElementById("lateCount");
const attendancePercentEl = document.getElementById("attendancePercent");

const okPercentTextEl   = document.getElementById("okPercentText");
const latePercentTextEl = document.getElementById("latePercentText");
const msgEl             = document.getElementById("msg");

const studentName = sessionStorage.getItem("studentName");
const studentId   = sessionStorage.getItem("studentId");

// ถ้าไม่มี session ให้เด้งกลับไปหน้า login
if (!studentId) {
  window.location.href = "login.html";
}

stuNameEl.textContent = studentName || "-";
stuIdEl.textContent   = studentId || "-";

// helper คำนวณ %
function toPercent(part, total) {
  if (!total || total <= 0) return 0;
  return Math.round((part * 1000) / total) / 10; // ปัดทศนิยม 1 ตำแหน่ง
}

async function loadDashboard() {
  msgEl.textContent = "กำลังโหลดข้อมูล...";

  try {
    const res = await apiPost("getStudentHistory", { studentId });

    if (!res.success) {
      msgEl.textContent = res.message || "ไม่สามารถโหลดข้อมูลได้";
      return;
    }

    const history = res.history || [];
    const total = history.length;

    if (total === 0) {
      totalRecordsEl.textContent = "0";
      okCountEl.textContent = "0";
      lateCountEl.textContent = "0";
      attendancePercentEl.textContent = "0%";
      okPercentTextEl.textContent = "0% ของการเช็คชื่อ";
      latePercentTextEl.textContent = "0% ของการเช็คชื่อ";
      msgEl.textContent = "ยังไม่มีประวัติการเช็คชื่อในระบบ";
      renderChart(0, 0, 0);
      return;
    }

    let ok = 0;
    let late = 0;
    let absent = 0;

    history.forEach(row => {
      // row = [ teacherEmail, studentId, studentName, datetime, token, status ]
      const status = String(row[5] || "").toUpperCase();
      if (status === "OK") ok++;
      else if (status === "LATE") late++;
      else if (status === "ABSENT") absent++;
    });

    const attended = ok + late;

    totalRecordsEl.textContent = total;
    okCountEl.textContent      = ok;
    lateCountEl.textContent    = late;

    const okPercent     = toPercent(ok, total);
    const latePercent   = toPercent(late, total);
    const attendPercent = toPercent(attended, total);

    okPercentTextEl.textContent   = `${okPercent}% ของการเช็คชื่อ`;
    latePercentTextEl.textContent = `${latePercent}% ของการเช็คชื่อ`;
    attendancePercentEl.textContent = `${attendPercent}%`;

    msgEl.textContent = "";

    renderChart(ok, late, absent);

  } catch (err) {
    console.error(err);
    msgEl.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    renderChart(0, 0, 0);
  }
}

// ใช้ Chart.js วาดกราฟแท่ง
let chartInstance = null;
function renderChart(ok, late, absent) {
  const ctx = document.getElementById("statusChart");
  if (!ctx || typeof Chart === "undefined") {
    console.warn("Chart.js ยังไม่พร้อมหรือ canvas ไม่มี");
    return;
  }

  const data = {
    labels: ["มาเรียน (OK)", "มาสาย (LATE)", "ขาด (ABSENT)"],
    datasets: [{
      label: "จำนวนครั้ง",
      data: [ok, late, absent],
      backgroundColor: [
        "rgba(34,197,94,0.85)",   // OK
        "rgba(234,179,8,0.85)",   // LATE
        "rgba(248,113,113,0.85)"  // ABSENT
      ],
      borderColor: [
        "rgba(22,163,74,1)",
        "rgba(202,138,4,1)",
        "rgba(220,38,38,1)"
      ],
      borderWidth: 1.5,
      borderRadius: 9,
      maxBarThickness: 60
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#9ca3af"
        },
        grid: {
          color: "rgba(55,65,81,0.7)"
        }
      },
      x: {
        ticks: {
          color: "#e5e7eb"
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y} ครั้ง`
        }
      }
    }
  };

  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(ctx, {
    type: "bar",
    data,
    options
  });
}

// เริ่มโหลดเมื่อหน้า ready
document.addEventListener("DOMContentLoaded", loadDashboard);
