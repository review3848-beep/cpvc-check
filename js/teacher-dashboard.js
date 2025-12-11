// js/teacher-dashboard.js
// Dashboard ครู – โหลดสรุปคาบ, ตารางคาบ และปุ่มปิดคาบ
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // ----- ดึง session ครูจาก sessionStorage -----
  let teacher = null;
  try {
    const raw = sessionStorage.getItem("teacher");
    if (raw) teacher = JSON.parse(raw);
  } catch (e) {
    teacher = null;
  }

  if (!teacher || !teacher.email) {
    window.location.href = "login.html";
    return;
  }

  // ----- DOM refs -----
  const teacherNameEl   = document.getElementById("teacherName");
  const teacherEmailEl  = document.getElementById("teacherEmail");
  const totalSessionsEl = document.getElementById("totalSessions");
  const openSessionsEl  = document.getElementById("openSessions");
  const totalAttEl      = document.getElementById("totalAttendance");

  const sessionsTbody   = document.getElementById("sessionsTableBody");
  const subjectFilterEl = document.getElementById("subjectFilter");
  const exportAllBtn    = document.getElementById("exportAllAttendanceBtn");

  const loadingEl       = document.getElementById("dashboardLoading");
  const errorEl         = document.getElementById("dashboardError");

  if (teacherNameEl)  teacherNameEl.textContent  = teacher.name || "ครู";
  if (teacherEmailEl) teacherEmailEl.textContent = teacher.email;

  let allSessions = [];

  // ----- helper แสดง loading / error -----
  function setLoading(isLoading, text) {
    if (!loadingEl) return;
    loadingEl.style.display = isLoading ? "flex" : "none";
    if (text) loadingEl.textContent = text;
  }

  function setError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || "";
    errorEl.style.display = msg ? "block" : "none";
  }

  // ----- render summary cards -----
  function renderSummary(summary) {
    if (!summary) return;
    if (totalSessionsEl) totalSessionsEl.textContent = summary.totalSessions ?? 0;
    if (openSessionsEl)  openSessionsEl.textContent  = summary.openSessions ?? 0;
    if (totalAttEl)      totalAttEl.textContent      = summary.totalAttendance ?? 0;
  }

  // ----- เติมรายการใน dropdown วิชา -----
  function renderSubjectFilter(sessions) {
    if (!subjectFilterEl) return;

    // เคลียร์ options เดิม
    subjectFilterEl.innerHTML = "";

    const optionAll = document.createElement("option");
    optionAll.value = "";
    optionAll.textContent = "ทั้งหมด";
    subjectFilterEl.appendChild(optionAll);

    const subjects = new Set();
    sessions.forEach((r) => {
      const subj = (r[1] || "").toString().trim();
      if (subj) subjects.add(subj);
    });

    Array.from(subjects).forEach((subj) => {
      const op = document.createElement("option");
      op.value = subj;
      op.textContent = subj;
      subjectFilterEl.appendChild(op);
    });
  }

  // ----- render ตารางคาบ -----
  function renderSessionsTable(sessions, subjectFilter = "") {
    if (!sessionsTbody) return;

    sessionsTbody.innerHTML = "";

    const rows = sessions.filter((row) => {
      const subject = (row[1] || "").toString().trim();
      if (!subjectFilter) return true;
      return subject === subjectFilter;
    });

    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "ยังไม่มีคาบเรียนในเงื่อนไขนี้";
      td.style.textAlign = "center";
      td.style.padding = "16px 0";
      tr.appendChild(td);
      sessionsTbody.appendChild(tr);
      return;
    }

    rows.forEach((row) => {
      // SESSIONS: A=TEACHER_EMAIL, B=SUBJECT, C=ROOM, D=TOKEN, E=STATUS, F=START_TIME
      const subject = row[1] || "-";
      const room    = row[2] || "-";
      const token   = row[3] || "-";
      const status  = (row[4] || "").toString().toUpperCase();
      const startAt = row[5] || "";

      const tr = document.createElement("tr");

      const statusClass =
        status === "OPEN"
          ? "status-open"
          : status === "CLOSED"
          ? "status-closed"
          : "";

      const closeBtnHtml =
        status === "OPEN"
          ? `<button class="close-session-btn" data-token="${token}">ปิดคาบ</button>`
          : "";

      tr.innerHTML = `
        <td>
          <div class="td-main">${subject}</div>
          <div class="td-sub">ห้อง ${room}</div>
        </td>
        <td>${token}</td>
        <td>${startAt}</td>
        <td class="${statusClass}">${status}</td>
        <td class="td-actions">
          ${closeBtnHtml}
          <button class="detail-session-btn" data-token="${token}">
            ดูรายชื่อ มา / สาย / ขาด
          </button>
        </td>
      `;

      sessionsTbody.appendChild(tr);
    });

    attachRowEvents();
  }

  // ----- ติด event ให้ปุ่มปิดคาบ + ดูรายละเอียด -----
  function attachRowEvents() {
    // ปุ่มปิดคาบ
    document.querySelectorAll(".close-session-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const token = btn.dataset.token;
        if (!token) return;

        const ok = window.confirm("ต้องการปิดคาบนี้ใช่หรือไม่?");
        if (!ok) return;

        btn.disabled = true;
        const prevText = btn.textContent;
        btn.textContent = "กำลังปิดคาบ...";

        try {
          const res = await callApi("closeSession", { token });
          if (!res.success) {
            alert(res.message || "ปิดคาบไม่สำเร็จ");
            btn.disabled = false;
            btn.textContent = prevText;
            return;
          }

          alert("ปิดคาบเรียบร้อยแล้ว");
          // reload dashboard
          loadDashboard();
        } catch (err) {
          console.error(err);
          alert("เกิดข้อผิดพลาดในการปิดคาบ");
          btn.disabled = false;
          btn.textContent = prevText;
        }
      });
    });

    // ปุ่มดูรายละเอียด – ถ้ามี modal แยกไว้ คุณผูกต่อเองได้
    document.querySelectorAll(".detail-session-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const token = btn.dataset.token;
        if (!token) return;
        try {
          const res = await callApi("getSessionAttendance", {
            teacherEmail: teacher.email,
            token,
          });
          if (!res.success) {
            alert(res.message || "โหลดรายละเอียดไม่สำเร็จ");
            return;
          }

          // TODO: ตรงนี้คุณเอา res.session / res.rows ไปแสดงใน modal ตามดีไซน์ที่มีอยู่แล้ว
          console.log("Session detail:", res);
          alert("ฟังก์ชันดูรายละเอียดทำงานแล้ว (ดูใน console)");
        } catch (err) {
          console.error(err);
          alert("เกิดข้อผิดพลาดในการโหลดรายละเอียดคาบ");
        }
      });
    });
  }

  // ----- export CSV ทั้งหมด -----
  async function handleExportAll() {
    if (!exportAllBtn) return;

    exportAllBtn.disabled = true;
    const prevText = exportAllBtn.textContent;
    exportAllBtn.textContent = "กำลังสร้างไฟล์...";

    try {
      const res = await callApi("exportTeacherAttendance", {
        teacherEmail: teacher.email,
      });

      if (!res.success) {
        alert(res.message || "สร้างไฟล์ไม่สำเร็จ");
        exportAllBtn.disabled = false;
        exportAllBtn.textContent = prevText;
        return;
      }

      const blob = new Blob([res.csv || ""], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName || "attendance_all.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ CSV");
    } finally {
      exportAllBtn.disabled = false;
      exportAllBtn.textContent = prevText;
    }
  }

  if (exportAllBtn) {
    exportAllBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleExportAll();
    });
  }

  if (subjectFilterEl) {
    subjectFilterEl.addEventListener("change", () => {
      const value = subjectFilterEl.value || "";
      renderSessionsTable(allSessions, value);
    });
  }

  // ----- โหลดข้อมูลจาก backend -----
  async function loadDashboard() {
    setLoading(true, "กำลังโหลดข้อมูลคาบเรียน...");
    setError("");

    try {
      const res = await callApi("getTeacherDashboard", {
        teacherEmail: teacher.email,
      });

      if (!res.success) {
        setError(res.message || "โหลดข้อมูลไม่สำเร็จ");
        setLoading(false);
        return;
      }

      allSessions = res.sessions || [];
      renderSummary(res.summary || {});
      renderSubjectFilter(allSessions);
      const currentFilter = subjectFilterEl ? subjectFilterEl.value || "" : "";
      renderSessionsTable(allSessions, currentFilter);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  // เริ่มโหลดครั้งแรก
  loadDashboard();
});
