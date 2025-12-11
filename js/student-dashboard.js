// js/student-dashboard.js
import { callApi } from "./api.js";

let statusChart = null;
function formatThaiDateTime(raw) {
  if (!raw) return "-";

  // raw จะเป็น string แบบ "2025-12-11T03:28:57.000Z"
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    // ถ้าแปลงไม่ได้ ให้โชว์ของเดิมไปเลย
    return raw;
  }

  // แปลงเป็นเวลาไทย + ฟอร์แมต
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

document.addEventListener("DOMContentLoaded", () => {
  // ------- ดึง element จาก dashboard.html -------
  const nameEl        = document.getElementById("studentNameDisplay");
  const idEl          = document.getElementById("studentIdDisplay");

  const totalEl       = document.getElementById("totalRecords");
  const okCountEl     = document.getElementById("okCount");
  const lateCountEl   = document.getElementById("lateCount");
  const okPercentEl   = document.getElementById("okPercent");
  const latePercentEl = document.getElementById("latePercent");
  const ratePercentEl = document.getElementById("ratePercent");

  const msgEl         = document.getElementById("msg");

  const chartCanvas   = document.getElementById("statusChart");
  const recentTableBody = document.getElementById("recentTableBody");

  // ------- อ่าน session นักเรียน -------
  let student = null;
  try {
    const rawLocal   = localStorage.getItem("cpvc_student");
    const rawSession = sessionStorage.getItem("student");
    const raw = rawLocal || rawSession;

    if (!raw) throw new Error("no session");

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) throw new Error("invalid session");

    student = parsed;
  } catch (e) {
    // ถ้าไม่มี session ให้เด้งกลับไปหน้า login
    window.location.href = "login.html";
    return;
  }

  if (nameEl) nameEl.textContent = student.name || "นักเรียน";
  if (idEl)   idEl.textContent   = student.studentId || "-";

  // โหลดข้อมูล Dashboard จาก GAS
  loadDashboard();

  async function loadDashboard() {
    setMsg("กำลังโหลดข้อมูลการเข้าเรียน...");

    try {
      const res = await callApi("getStudentHistory", {
        studentId: student.studentId,
      });

      if (!res || !res.success) {
        throw new Error(res && res.message ? res.message : "โหลดข้อมูลไม่สำเร็จ");
      }

      const history = res.history || [];
      const total   = history.length;

      const ok     = history.filter(r => String(r.status || "").toUpperCase() === "OK").length;
      const late   = history.filter(r => String(r.status || "").toUpperCase() === "LATE").length;
      const absent = history.filter(r => String(r.status || "").toUpperCase() === "ABSENT").length;

      const come      = ok + late;
      const rate      = total ? Math.round((come * 100) / total) : 0;
      const okPer     = total ? Math.round((ok   * 100) / total) : 0;
      const latePer   = total ? Math.round((late * 100) / total) : 0;

      if (totalEl)       totalEl.textContent       = total;
      if (okCountEl)     okCountEl.textContent     = ok;
      if (lateCountEl)   lateCountEl.textContent   = late;
      if (okPercentEl)   okPercentEl.textContent   = okPer   + "%";
      if (latePercentEl) latePercentEl.textContent = latePer + "%";
      if (ratePercentEl) ratePercentEl.textContent = rate    + "%";

      if (!total) {
        setMsg("ยังไม่มีประวัติการเช็คชื่อในระบบ");
      } else {
        setMsg(`ข้อมูลล่าสุดทั้งหมด ${total} รายการ`);
      }

      renderChart(ok, late, absent);
      renderRecent(history);
    } catch (err) {
      console.error("loadDashboard error:", err);
      setMsg(err.message || "โหลดข้อมูลไม่สำเร็จ");
      renderChart(0, 0, 0);
      renderRecent([]);
    }
  }

  function setMsg(text) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
  }

  // ------- วาดกราฟโดนัท -------
  function renderChart(ok, late, absent) {
    if (!chartCanvas || typeof Chart === "undefined") return;

    const ctx = chartCanvas.getContext("2d");

    if (statusChart) {
      statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["มา (OK)", "สาย (LATE)", "ขาด (ABSENT)"],
        datasets: [
          {
            data: [ok, late, absent],
            backgroundColor: ["#22c55e", "#eab308", "#f97316"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // ปิด animation กันอาการกระพริบ
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

  // ------- เติมตาราง 5 รายการล่าสุด -------
  function renderRecent(history) {
    if (!recentTableBody) return;

    recentTableBody.innerHTML = "";

    if (!history.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "table-empty";
      td.textContent = "ยังไม่มีข้อมูลการเช็คชื่อในระบบ";
      tr.appendChild(td);
      recentTableBody.appendChild(tr);
      return;
    }

    // ใช้ 5 รายการล่าสุด (ชีตเก่าสุด -> ใหม่สุด)
    const lastFive = history.slice(-5).reverse();

    lastFive.forEach(row => {
      const tr = document.createElement("tr");

      const time  = row.time   || "-";
      const token = row.token  || "-";
      const st    = row.status || "-";
      const teacherEmail = row.teacherEmail || "-";

      const tdTime = document.createElement("td");
      tdTime.textContent = time;
      tdTime.className = "time";
      tr.appendChild(tdTime);

      const tdToken = document.createElement("td");
      tdToken.textContent = token;
      tr.appendChild(tdToken);

      const tdStatus = document.createElement("td");
      tdStatus.textContent = st;
      const upper = String(st || "").toUpperCase();
      if (upper === "OK") tdStatus.className = "status-ok";
      else if (upper === "LATE") tdStatus.className = "status-late";
      else if (upper === "ABSENT") tdStatus.className = "status-absent";
      tr.appendChild(tdStatus);

      const tdTeacher = document.createElement("td");
      tdTeacher.textContent = teacherEmail;
      tr.appendChild(tdTeacher);

      recentTableBody.appendChild(tr);
    });
  }
});
