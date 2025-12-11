// js/teacher-dashboard.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // ---------- ดึงข้อมูลครู ----------
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

  // ---------- DOM ----------
  const teacherNameEl   = document.getElementById("teacherName");
  const teacherEmailEl  = document.getElementById("teacherEmail");

  const totalSessionsEl = document.getElementById("totalSessions");
  const openSessionsEl  = document.getElementById("openSessions");
  const totalAttEl      = document.getElementById("totalAttendance");

  const subjectFilterEl = document.getElementById("subjectFilter");
  const chipsEl         = document.getElementById("subjectSummaryChips");
  const sessionTableTbody = document.getElementById("sessionTable");
  const msgEl           = document.getElementById("msg");

  const exportAllBtn    = document.getElementById("exportAllBtn");

  // modal
  const modalBackdrop   = document.getElementById("sessionModal");
  const modalTitleEl    = document.getElementById("modalTitle");
  const modalSubtitleEl = document.getElementById("modalSubtitle");
  const modalStatsEl    = document.getElementById("modalStats");
  const modalTableBody  = document.getElementById("modalTableBody");
  const modalFooterInfo = document.getElementById("modalFooterInfo");
  const modalCloseBtn   = document.getElementById("modalCloseBtn");
  const exportSessionBtn = document.getElementById("exportSessionBtn");

  teacherNameEl.textContent  = teacher.name || "ครู";
  teacherEmailEl.textContent = teacher.email;

  let allSessions = [];
  let currentSessionToken = null;

  // ---------- helpers ----------
  function setMsg(text, type = "info") {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    if (!text) return;
    msgEl.style.color = type === "error" ? "#f97373" : "#93c5fd";
  }

  function renderSummary(summary) {
    if (!summary) return;
    totalSessionsEl.textContent = summary.totalSessions ?? 0;
    openSessionsEl.textContent  = summary.openSessions ?? 0;
    totalAttEl.textContent      = summary.totalAttendance ?? 0;
  }

  function renderSubjectFilterOptions(sessions) {
    subjectFilterEl.innerHTML = "";
    const opAll = document.createElement("option");
    opAll.value = "";
    opAll.textContent = "ทั้งหมด";
    subjectFilterEl.appendChild(opAll);

    const subjects = new Set();
    sessions.forEach(row => {
      const subj = (row[1] || "").toString().trim();
      if (subj) subjects.add(subj);
    });

    Array.from(subjects).forEach(subj => {
      const op = document.createElement("option");
      op.value = subj;
      op.textContent = subj;
      subjectFilterEl.appendChild(op);
    });
  }

  function renderSubjectChips(subjects) {
    chipsEl.innerHTML = "";
    if (!subjects || !subjects.length) return;

    subjects.forEach(item => {
      const chip = document.createElement("div");
      chip.className = "chip";
      const present = item.presentPercent ?? 0;
      chip.innerHTML = `
        <span>${item.subject}</span>
        &nbsp;·&nbsp;
        <span class="highlight">${present}%</span> มาเรียน
      `;
      chipsEl.appendChild(chip);
    });
  }

  // ---------- ตารางคาบ ----------
  function renderSessionTable(filterSubject = "") {
    sessionTableTbody.innerHTML = "";

    const rows = allSessions.filter(row => {
      const subj = (row[1] || "").toString().trim();
      if (!filterSubject) return true;
      return subj === filterSubject;
    });

    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty";
      td.textContent = "ยังไม่มีข้อมูลคาบ";
      tr.appendChild(td);
      sessionTableTbody.appendChild(tr);
      return;
    }

    rows.forEach(row => {
      // SESSIONS: A=TEACHER_EMAIL, B=SUBJECT, C=ROOM,
      //           D=TOKEN, E=STATUS, F=START_TIME
      const subject = row[1] || "-";
      const room    = row[2] || "-";
      const token   = row[3] || "-";
      const rawStatus = (row[4] || "").toString().trim();
      const status = rawStatus.toUpperCase();
      const startAt = row[5] || "";

      const tr = document.createElement("tr");

      const isOpen = status === "OPEN";
      const statusClass = isOpen ? "status-open" : "status-closed";

      const closeBtnHtml = isOpen
        ? `<button class="btn-small btn-close-session" data-token="${token}">ปิดคาบ</button>`
        : "";

      tr.innerHTML = `
        <td>
          <div class="session-subject">${subject}</div>
          <div class="session-room">ห้อง ${room}</div>
        </td>
        <td>${token}</td>
        <td>${startAt}</td>
        <td>
          <span class="status-pill ${statusClass}">${status}</span>
        </td>
        <td>
          ${closeBtnHtml}
          <button class="btn-small btn-view-session" data-token="${token}">
            ดูรายชื่อ มา / สาย / ขาด
          </button>
        </td>
      `;

      sessionTableTbody.appendChild(tr);
    });

    attachRowEvents();
  }

  // ---------- ปุ่มในตาราง ----------
  function attachRowEvents() {
    // ปุ่มปิดคาบ
    document.querySelectorAll(".btn-close-session").forEach(btn => {
      btn.addEventListener("click", async () => {
        const token = btn.dataset.token;
        if (!token) return;

        if (!confirm("ต้องการปิดคาบนี้ใช่หรือไม่?")) return;

        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "กำลังปิดคาบ...";

        try {
          const res = await callApi("closeSession", { token });
          if (!res.success) {
            alert(res.message || "ปิดคาบไม่สำเร็จ");
            btn.disabled = false;
            btn.textContent = oldText;
            return;
          }

          alert("ปิดคาบเรียบร้อยแล้ว");
          await loadDashboard();
        } catch (err) {
          console.error(err);
          alert("เกิดข้อผิดพลาดในการปิดคาบ");
          btn.disabled = false;
          btn.textContent = oldText;
        }
      });
    });

    // ปุ่มดูรายละเอียด
    document.querySelectorAll(".btn-view-session").forEach(btn => {
      btn.addEventListener("click", () => {
        const token = btn.dataset.token;
        if (!token) return;
        openSessionModal(token);
      });
    });
  }

  // ---------- modal ----------
  function showModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.add("open");
  }

  function hideModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("open");
    currentSessionToken = null;
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", hideModal);
  }
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", e => {
      if (e.target === modalBackdrop) hideModal();
    });
  }

  async function openSessionModal(token) {
    currentSessionToken = token;

    modalTitleEl.textContent = "รายละเอียดคาบเรียน";
    modalSubtitleEl.textContent = `TOKEN: ${token}`;
    modalStatsEl.innerHTML = "";
    modalFooterInfo.innerHTML = "";
    modalTableBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">กำลังโหลด...</td></tr>`;

    showModal();

    try {
      const res = await callApi("getSessionAttendance", {
        teacherEmail: teacher.email,
        token,
      });

      if (!res.success) {
        modalTableBody.innerHTML =
          `<tr><td colspan="4" style="text-align:center;color:#f97373;">${res.message || "โหลดรายละเอียดไม่สำเร็จ"}</td></tr>`;
        return;
      }

      const info  = res.session || {};
      const rows  = res.rows || [];
      const stats = res.stats || {};

      const subj = info.subject || "-";
      const room = info.room || "-";
      const startAt = info.startAt || "";
      modalTitleEl.textContent = `${subj} · ห้อง ${room}`;
      modalSubtitleEl.textContent = `TOKEN: ${token} · เริ่มคาบ: ${startAt || "-"}`;

      const ok = stats.ok || 0;
      const late = stats.late || 0;
      const absent = stats.absent || 0;
      const total = stats.total || 0;
      const come = ok + late;
      const presentPercent = total ? Math.round((come * 100) / total) : 0;

      const makeBadge = (cls, label) => {
        const b = document.createElement("div");
        b.className = `badge ${cls}`;
        b.textContent = label;
        return b;
      };
      modalStatsEl.innerHTML = "";
      modalStatsEl.appendChild(makeBadge("ok",    `มาเรียน: ${ok}`));
      modalStatsEl.appendChild(makeBadge("late",  `มาสาย: ${late}`));
      modalStatsEl.appendChild(makeBadge("absent",`ขาด: ${absent}`));

      modalFooterInfo.innerHTML = "";
      modalFooterInfo.appendChild(
        makeBadge("", `รวม ${total} คน · ${presentPercent}% มาเรียน (มา + สาย)`)
      );

      modalTableBody.innerHTML = "";
      if (!rows.length) {
        modalTableBody.innerHTML =
          `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">ยังไม่มีการเช็คชื่อในคาบนี้</td></tr>`;
      } else {
        rows.forEach(r => {
          const tr = document.createElement("tr");
          const st = (r.status || "").toString().toUpperCase();
          let stLabel = "มาเรียน";
          if (st === "LATE") stLabel = "สาย";
          else if (st === "ABSENT") stLabel = "ขาด";

          tr.innerHTML = `
            <td>${r.studentId || "-"}</td>
            <td>${r.studentName || "-"}</td>
            <td>${r.time || "-"}</td>
            <td>${stLabel}</td>
          `;
          modalTableBody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error(err);
      modalTableBody.innerHTML =
        `<tr><td colspan="4" style="text-align:center;color:#f97373;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    }
  }

  // export CSV
  function downloadCsv(csvText, fileName) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExportAll() {
    const oldText = exportAllBtn.textContent;
    exportAllBtn.disabled = true;
    exportAllBtn.textContent = "กำลังสร้างไฟล์...";

    try {
      const res = await callApi("exportTeacherAttendance", {
        teacherEmail: teacher.email,
      });
      if (!res.success) {
        alert(res.message || "สร้างไฟล์ไม่สำเร็จ");
        return;
      }
      downloadCsv(res.csv || "", res.fileName || "attendance_all.csv");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ CSV");
    } finally {
      exportAllBtn.disabled = false;
      exportAllBtn.textContent = oldText;
    }
  }

  async function handleExportSession() {
    if (!currentSessionToken) {
      alert("ไม่พบ TOKEN ของคาบนี้");
      return;
    }
    try {
      const res = await callApi("exportSessionAttendance", {
        teacherEmail: teacher.email,
        token: currentSessionToken,
      });
      if (!res.success) {
        alert(res.message || "สร้างไฟล์ไม่สำเร็จ");
        return;
      }
      downloadCsv(
        res.csv || "",
        res.fileName || `attendance_${currentSessionToken}.csv`
      );
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ CSV");
    }
  }

  if (exportAllBtn) {
    exportAllBtn.addEventListener("click", e => {
      e.preventDefault();
      handleExportAll();
    });
  }
  if (exportSessionBtn) {
    exportSessionBtn.addEventListener("click", e => {
      e.preventDefault();
      handleExportSession();
    });
  }

  if (subjectFilterEl) {
    subjectFilterEl.addEventListener("change", () => {
      const v = subjectFilterEl.value || "";
      renderSessionTable(v);
    });
  }

  // ---------- โหลด Dashboard ----------
  async function loadDashboard() {
    setMsg("กำลังโหลดข้อมูลคาบของคุณ...");

    try {
      const dashRes = await callApi("getTeacherDashboard", {
        teacherEmail: teacher.email,
      });

      console.log("getTeacherDashboard result =", dashRes);

      if (!dashRes.success) {
        setMsg(dashRes.message || "โหลดข้อมูลไม่สำเร็จ", "error");
        return;
      }

      allSessions = dashRes.sessions || [];
      renderSummary(dashRes.summary || {});
      renderSubjectFilterOptions(allSessions);
      const currentFilter = subjectFilterEl.value || "";
      renderSessionTable(currentFilter);
      setMsg("");

      // โหลดสรุปวิชา (ไม่กระทบตาราง ถ้าพังแค่ไม่ขึ้น chips)
      try {
        const subjRes = await callApi("getSubjectSummary", {
          teacherEmail: teacher.email,
        });
        if (subjRes && subjRes.success) {
          renderSubjectChips(subjRes.subjects || []);
        }
      } catch (e) {
        console.warn("getSubjectSummary error:", e);
      }

    } catch (err) {
      console.error(err);
      setMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard", "error");
    }
  }

  // start
  loadDashboard();
});
