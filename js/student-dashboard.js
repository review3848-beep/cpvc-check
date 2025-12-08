// js/student-dashboard.js

// ================= CONFIG API =================
// ถ้าใช้ไฟล์ api.js และมีตัวแปร API_BASE อยู่แล้ว จะใช้ API_BASE อัตโนมัติ
// ถ้าไม่ได้ใช้ api.js ให้แก้ "YOUR_GAS_WEB_APP_EXEC_URL" เป็น URL /exec ของ Web App GAS
const API_ENDPOINT =
  typeof API_BASE !== "undefined"
    ? API_BASE
    : "YOUR_GAS_WEB_APP_EXEC_URL"; // แก้ตรงนี้ถ้าไม่ได้ใช้ api.js

// helper เรียก API ฝั่ง GAS
async function callStudentApi(action, payload) {
  if (!API_ENDPOINT || API_ENDPOINT.startsWith("YOUR_GAS_WEB_APP")) {
    console.error("ยังไม่ได้ตั้งค่า API_ENDPOINT ให้ถูกต้อง");
    return { success: false, message: "API ยังไม่พร้อมใช้งาน (ยังไม่ได้ตั้งค่า URL)" };
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("callStudentApi error:", err);
    return { success: false, message: "ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ" };
  }
}

// ===== จัดการ session นักเรียน (ใช้ localStorage.cpvc_student) =====
function getCurrentStudent() {
  try {
    const raw = localStorage.getItem("cpvc_student");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("อ่าน cpvc_student จาก localStorage ไม่ได้:", err);
    localStorage.removeItem("cpvc_student");
    return null;
  }
}

function requireStudentLogin() {
  const st = getCurrentStudent();
  if (!st) {
    window.location.href = "login.html";
    return null;
  }
  return st;
}

// ===== ฟังก์ชัน global สำหรับปุ่มบน Dashboard =====
window.goScan = function () {
  window.location.href = "scan.html";
};

window.goHistory = function () {
  window.location.href = "history.html";
};

window.logout = function () {
  localStorage.removeItem("cpvc_student");
  window.location.href = "login.html";
};

// ===== main logic =====
document.addEventListener("DOMContentLoaded", () => {
  const student = requireStudentLogin();
  if (!student) return;

  // DOM refs
  const nameEl = document.getElementById("studentNameDisplay");
  const idEl = document.getElementById("studentIdDisplay");

  const totalRecordsEl = document.getElementById("totalRecords");
  const okCountEl = document.getElementById("okCount");
  const lateCountEl = document.getElementById("lateCount");
  const ratePercentEl = document.getElementById("ratePercent");
  const okPercentEl = document.getElementById("okPercent");
  const latePercentEl = document.getElementById("latePercent");

  const chartCanvas = document.getElementById("statusChart");

  // ตั้งชื่อ + ID มุมบนขวา
  if (nameEl) {
    nameEl.textContent =
      student.name || student.studentName || "นักเรียน";
  }
  if (idEl) {
    idEl.textContent = student.studentId || "-";
  }

  function setStatText(el, value) {
    if (el) el.textContent = value;
  }

  function computeStats(history) {
    let total = 0;
    let ok = 0;
    let late = 0;
    let absent = 0;

    (history || []).forEach((item) => {
      total++;
      const s = (item.status || item.attendanceStatus || "").toString().trim().toUpperCase();
      if (s === "OK" || s === "PRESENT" || s === "P") {
        ok++;
      } else if (s === "LATE") {
        late++;
      } else if (s === "ABSENT" || s === "A") {
        absent++;
      }
    });

    const totalPresentLate = ok + late;

    function toPercent(num, denom) {
      if (!denom || denom === 0) return 0;
      return Math.round((num / denom) * 100);
    }

    return {
      total,
      ok,
      late,
      absent,
      okPercent: toPercent(ok, total),
      latePercent: toPercent(late, total),
      ratePercent: toPercent(totalPresentLate, total),
    };
  }

  let statusChartInstance = null;

  function renderChart(stats) {
    if (!chartCanvas || typeof Chart === "undefined") {
      console.warn("Chart.js ยังไม่พร้อมหรือไม่พบ canvas statusChart");
      return;
    }

    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    const data = {
      labels: ["มาเรียน (OK)", "มาสาย (LATE)", "ขาดเรียน (ABSENT)"],
      datasets: [
        {
          data: [stats.ok, stats.late, stats.absent],
          backgroundColor: ["#4ade80", "#eab308", "#f97316"],
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: { size: 11 },
          },
        },
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 0,
          right: 0,
        },
      },
    };

    if (statusChartInstance) {
      statusChartInstance.data = data;
      statusChartInstance.options = options;
      statusChartInstance.update();
    } else {
      statusChartInstance = new Chart(ctx, {
        type: "doughnut",
        data,
        options,
      });
    }
  }

  async function loadDashboard() {
    // ดึงประวัติทั้งหมดของนักเรียนจาก GAS
    const resp = await callStudentApi("getStudentHistory", {
      studentId: student.studentId,
    });

    if (!resp || !resp.success) {
      console.error("โหลดประวัติเพื่อแสดง Dashboard ไม่สำเร็จ:", resp);
      // ให้ default เป็น 0 ทั้งหมด
      setStatText(totalRecordsEl, "0");
      setStatText(okCountEl, "0");
      setStatText(lateCountEl, "0");
      setStatText(okPercentEl, "0%");
      setStatText(latePercentEl, "0%");
      setStatText(ratePercentEl, "0%");
      return;
    }

    const history = resp.history || resp.data || [];
    const stats = computeStats(history);

    setStatText(totalRecordsEl, stats.total.toString());
    setStatText(okCountEl, stats.ok.toString());
    setStatText(lateCountEl, stats.late.toString());
    setStatText(okPercentEl, stats.okPercent + "%");
    setStatText(latePercentEl, stats.latePercent + "%");
    setStatText(ratePercentEl, stats.ratePercent + "%");

    renderChart(stats);
  }

  loadDashboard();
});
