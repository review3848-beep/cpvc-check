// js/student-dashboard.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl        = document.getElementById("studentNameDisplay");
  const idEl          = document.getElementById("studentIdDisplay");

  const totalEl       = document.getElementById("totalRecords");
  const okCountEl     = document.getElementById("okCount");
  const lateCountEl   = document.getElementById("lateCount");
  const okPercentEl   = document.getElementById("okPercent");
  const latePercentEl = document.getElementById("latePercent");
  const ratePercentEl = document.getElementById("ratePercent");

  const dashMsgEl     = document.getElementById("dashMsg");
  const statusBadgeEl = document.getElementById("statusSummaryBadge");

  const btnScan       = document.getElementById("btnGoScan");
  const btnHistory    = document.getElementById("btnGoHistory");
  const btnLogout     = document.getElementById("btnLogout");

  const chartCanvas   = document.getElementById("statusChart");
  const recentTable   = document.getElementById("recentTable");
  const recentEmpty   = document.getElementById("recentEmpty");

  let statusChart = null;

  // ---------- helper ----------
  function setMsg(text, type = "") {
    if (!dashMsgEl) return;
    dashMsgEl.textContent = text || "";
    dashMsgEl.classList.remove("error", "ok");
    if (!text) return;
    if (type === "error") dashMsgEl.classList.add("error");
    if (type === "ok")    dashMsgEl.classList.add("ok");
  }

  function setStatusBadge(text) {
    if (!statusBadgeEl) return;
    statusBadgeEl.textContent = text;
  }

  function statusClass(status) {
    const s = String(status || "").toUpperCase();
    if (s === "OK") return "status-ok";
    if (s === "LATE") return "status-late";
    if (s === "ABSENT") return "status-absent";
    return "";
  }

  // ---------- ดึง session นักเรียน ----------
  let student = null;
  try {
    const rawLocal   = localStorage.getItem("cpvc_student");
    const rawSession = sessionStorage.getItem("student");
    const raw = rawLocal || rawSession;

    if (!raw) throw new Error("no session");

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) throw new Error("invalid session");

    student = parsed;
  } catch {
    window.location.href = "login.html";
    return;
  }

  nameEl.textContent = student.name || "นักเรียน";
  idEl.textContent   = student.studentId || "-";

  // ---------- โหลดข้อมูล Dashboard ----------
  loadDashboard();

  async function loadDashboard() {
    setMsg("กำลังโหลดข้อมูลการเข้าเรียน...");
    setStatusBadge("กำลังประมวลผล...");

    try {
      const res = await callApi("getStudentHistory", {
        studentId: student.studentId
      });

      if (!res || !res.success) {
        throw new Error(res && res.message ? res.message : "โหลดข้อมูลไม่สำเร็จ");
      }

      const history = res.history || [];
      const total   = history.length;

      const ok     = history.filter(r => String(r.status || "").toUpperCase() === "OK").length;
      const late   = history.filter(r => String(r.status || "").toUpperCase() === "LATE").length;
      const absent = history.filter(r => String(r.status || "").toUpperCase() === "ABSENT").length;

      const come = ok + late;
      const rate = total ? Math.round((come * 100) / total) : 0;
      const okPer   = total ? Math.round((ok   * 100) / total) : 0;
      const latePer = total ? Math.round((late * 100) / total) : 0;

      totalEl.textContent       = total;
      okCountEl.textContent     = ok;
      lateCountEl.textContent   = late;
      okPercentEl.textContent   = okPer   + "%";
      latePercentEl.textContent = latePer + "%";
      ratePercentEl.textContent = rate    + "%";

      if (!total) {
        setMsg("ยังไม่มีประวัติการเช็คชื่อในระบบ", "");
        setStatusBadge("ยังไม่มีข้อมูล");
      } else {
        setMsg(`ข้อมูลล่าสุดทั้งหมด ${total} รายการ`, "ok");
        if (rate >= 90) {
          setStatusBadge("สถานะดีมาก 👍");
        } else if (rate >= 75) {
          setStatusBadge("สถานะใช้ได้ ต้องรักษาระดับ 💪");
        } else {
          setStatusBadge("ควรปรับปรุงการเข้าเรียน ⚠️");
        }
      }

      renderChart(ok, late, absent);
      renderRecent(history);

    } catch (err) {
      console.error("loadDashboard error:", err);
      setMsg(err.message || "โหลดข้อมูลไม่สำเร็จ", "error");
      setStatusBadge("เกิดข้อผิดพลาด");
      renderChart(0, 0, 0);
      renderRecent([]);
    }
  }

  function renderChart(ok, late, absent) {
    if (!chartCanvas || !window.Chart) return;

    const ctx = chartCanvas.getContext("2d");
    const data = {
      labels: ["มา (OK)", "สาย (LATE)", "ขาด (ABSENT)"],
      datasets: [{
        label: "จำนวนครั้ง",
        data: [ok, late, absent],
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: { size: 11 }
          }
        }
      }
    };

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
      type: "doughnut",
      data,
      options
    });
  }

  function renderRecent(history) {
    if (!recentTable || !recentEmpty) return;

    recentTable.innerHTML = "";
    recentEmpty.textContent = "";

    if (!history.length) {
      recentEmpty.textContent = "ยังไม่มีข้อมูลการเช็คชื่อ";
      return;
    }

    // ใช้ 5 รายการล่าสุด (ข้อมูลในชีตเรียงจากเก่าสุด -> ใหม่สุด)
    const lastFive = history.slice(-5).reverse();

    lastFive.forEach(row => {
      const tr = document.createElement("tr");

      const time  = row.time   || "-";
      const token = row.token  || "-";
      const st    = row.status || "-";
      const teacherEmail = row.teacherEmail || "-";

      const tdTime = document.createElement("td");
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      const tdToken = document.createElement("td");
      tdToken.textContent = token;
      tr.appendChild(tdToken);

      const tdStatus = document.createElement("td");
      tdStatus.textContent = st;
      tdStatus.className = statusClass(st);
      tr.appendChild(tdStatus);

      const tdTeacher = document.createElement("td");
      tdTeacher.textContent = teacherEmail;
      tr.appendChild(tdTeacher);

      recentTable.appendChild(tr);
    });
  }

  // ---------- ปุ่มเมนู ----------
  btnScan?.addEventListener("click", () => {
    window.location.href = "scan.html";
  });

  btnHistory?.addEventListener("click", () => {
    window.location.href = "history.html";
  });

  btnLogout?.addEventListener("click", () => {
    localStorage.removeItem("cpvc_student");
    sessionStorage.removeItem("student");
    window.location.href = "login.html";
  });
});
