// js/teacher-dashboard.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("teacherName");
  const emailEl = document.getElementById("teacherEmail");
  const totalSessionsEl = document.getElementById("totalSessions");
  const openSessionsEl = document.getElementById("openSessions");
  const totalAttendanceEl = document.getElementById("totalAttendance");
  const sessionTableBody = document.getElementById("sessionTable");
  const subjectFilterEl = document.getElementById("subjectFilter");
  const chipsEl = document.getElementById("subjectSummaryChips");
  const msgEl = document.getElementById("msg");

  const exportAllBtn = document.getElementById("exportAllBtn");

  // modal
  const modalBackdrop = document.getElementById("sessionModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalStats = document.getElementById("modalStats");
  const modalTableBody = document.getElementById("modalTableBody");
  const modalFooterInfo = document.getElementById("modalFooterInfo");
  const exportSessionBtn = document.getElementById("exportSessionBtn");

  let currentTeacher = null;
  let allSessions = [];
  let currentSessionToken = null;

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    if (!text) return;
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  // ดึงข้อมูลครูจาก sessionStorage
  try {
    const raw = sessionStorage.getItem("teacher");
    if (!raw) throw new Error();
    const t = JSON.parse(raw);
    if (!t || !t.email) throw new Error();
    currentTeacher = t;
  } catch {
    window.location.href = "login.html";
    return;
  }

  nameEl.textContent = currentTeacher.name || "-";
  emailEl.textContent = currentTeacher.email || "-";

  // โหลด Dashboard
  (async () => {
    await loadDashboard();
    await loadSubjectSummary();
  })();

  async function loadDashboard() {
    setMsg("กำลังโหลดข้อมูลแดชบอร์ด...");
    try {
      const res = await callApi("getTeacherDashboard", {
        teacherEmail: currentTeacher.email,
      });

      const summary = res.summary || {};
      totalSessionsEl.textContent = summary.totalSessions || 0;
      openSessionsEl.textContent = summary.openSessions || 0;
      totalAttendanceEl.textContent = summary.totalAttendance || 0;

      allSessions = res.sessions || [];
      buildSubjectFilter(allSessions);
      renderSessionTable();

      setMsg("");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  async function loadSubjectSummary() {
    try {
      const res = await callApi("getSubjectSummary", {
        teacherEmail: currentTeacher.email,
      });

      const list = res.subjects || [];
      chipsEl.innerHTML = "";

      if (!list.length) {
        chipsEl.innerHTML =
          '<span class="chip">ยังไม่มีข้อมูลสรุปเปอร์เซ็นต์รายวิชา</span>';
        return;
      }

      list.forEach((it) => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.innerHTML = `
          <span>${it.subject || "-"}</span>
          &nbsp;•&nbsp;
          <span class="highlight">${it.presentPercent || 0}%</span>
          มาเรียน
          <span style="color:#9ca3af;">(มา ${it.ok || 0} / ทั้งหมด ${it.total || 0})</span>
        `;
        chipsEl.appendChild(chip);
      });
    } catch (err) {
      console.error("subject summary error:", err);
    }
  }

  function buildSubjectFilter(sessions) {
    const subjects = Array.from(
      new Set(
        sessions
          .map((s) => String(s[1] || "").trim())
          .filter((s) => s && s !== "-")
      )
    ).sort();

    subjectFilterEl.innerHTML = '<option value="">ทั้งหมด</option>';
    subjects.forEach((subj) => {
      const opt = document.createElement("option");
      opt.value = subj;
      opt.textContent = subj;
      subjectFilterEl.appendChild(opt);
    });
  }

  function renderSessionTable() {
    sessionTableBody.innerHTML = "";

    const selectedSubject = subjectFilterEl.value || "";

    let filtered = allSessions.slice();
    if (selectedSubject) {
      filtered = filtered.filter((row) => {
        const subj = String(row[1] || "").trim();
        return subj === selectedSubject;
      });
    }

    if (!filtered.length) {
      sessionTableBody.innerHTML =
        '<tr><td colspan="5" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>';
      return;
    }

    filtered.forEach((row) => {
      const teacherEmail = row[0];
      const subject = String(row[1] || "").trim();
      const room = String(row[2] || "").trim();
      const token = String(row[3] || "").trim();
      const status = String(row[4] || "").trim();
      const createdAt = row[5] ? new Date(row[5]) : null;

      const tr = document.createElement("tr");

      const subjectCell = document.createElement("td");
      subjectCell.innerHTML = `
        <div class="session-subject">${subject || "-"}</div>
        <div class="session-room">${room || ""}</div>
      `;
      tr.appendChild(subjectCell);

      const tokenCell = document.createElement("td");
      tokenCell.textContent = token || "-";
      tr.appendChild(tokenCell);

      const dateCell = document.createElement("td");
      if (createdAt) {
        dateCell.textContent = createdAt.toLocaleString("th-TH", {
          dateStyle: "short",
          timeStyle: "short",
        });
      } else {
        dateCell.textContent = "-";
      }
      tr.appendChild(dateCell);

      const statusCell = document.createElement("td");
      const span = document.createElement("span");
      span.className =
        "status-pill " +
        (status === "OPEN" ? "status-open" : "status-closed");
      span.textContent = status || "-";
      statusCell.appendChild(span);
      tr.appendChild(statusCell);

      const actionCell = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = "btn-small";
      btn.textContent = "ดูรายชื่อ มา / สาย / ขาด";
      btn.addEventListener("click", () => openSessionModal(token));
      actionCell.appendChild(btn);
      tr.appendChild(actionCell);

      sessionTableBody.appendChild(tr);
    });
  }

  subjectFilterEl.addEventListener("change", () => {
    renderSessionTable();
  });

  // Export ทุกคาบของครู
  exportAllBtn.addEventListener("click", async () => {
    exportAllBtn.disabled = true;
    exportAllBtn.textContent = "กำลังสร้างไฟล์ CSV...";
    try {
      const res = await callApi("exportTeacherAttendance", {
        teacherEmail: currentTeacher.email,
      });
      downloadCsv(res.csv, res.fileName || "attendance_all.csv");
      setMsg("สร้างไฟล์ CSV สำเร็จ", true);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "ไม่สามารถสร้างไฟล์ CSV ได้");
    } finally {
      exportAllBtn.disabled = false;
      exportAllBtn.textContent = "⬇ Export การเช็คชื่อทั้งหมด (CSV)";
    }
  });

  function downloadCsv(csvText, fileName) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- MODAL ----------
  function openModal() {
    modalBackdrop.classList.add("open");
  }
  function closeModal() {
    modalBackdrop.classList.remove("open");
    currentSessionToken = null;
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  async function openSessionModal(token) {
    currentSessionToken = token;
    openModal();

    modalTitle.textContent = "รายละเอียดคาบ – TOKEN " + token;
    modalSubtitle.textContent = "กำลังโหลดข้อมูล...";
    modalStats.innerHTML = "";
    modalFooterInfo.innerHTML = "";
    modalTableBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">กำลังโหลด...</td></tr>';

    try {
      const res = await callApi("getSessionAttendance", {
        teacherEmail: currentTeacher.email,
        token,
      });

      const info = res.session || {};
      const rows = res.rows || [];
      const st = res.stats || {};

      modalTitle.textContent =
        (info.subject || "-") + " · ห้อง " + (info.room || "-");
      modalSubtitle.textContent =
        "TOKEN " +
        (info.token || token) +
        " • " +
        (info.startAt || "-") +
        " • สถานะ " +
        (info.status || "-");

      // stats badges
      modalStats.innerHTML = "";
      const makeBadge = (cls, label, value) => {
        const b = document.createElement("div");
        b.className = "badge " + cls;
        b.textContent = `${label}: ${value || 0}`;
        modalStats.appendChild(b);
      };
      makeBadge("ok", "มา (OK)", st.ok);
      makeBadge("late", "สาย (LATE)", st.late);
      makeBadge("absent", "ขาด (ABSENT)", st.absent);
      const total = st.total || 0;
      const come = (st.ok || 0) + (st.late || 0);
      const percent = total ? Math.round((come * 100) / total) : 0;

      modalFooterInfo.innerHTML = "";
      const infoBadge = document.createElement("div");
      infoBadge.className = "badge";
      infoBadge.textContent = `รวม ${total} คน • มา/สาย ${come} คน (${percent}%)`;
      modalFooterInfo.appendChild(infoBadge);

      // table
      modalTableBody.innerHTML = "";
      if (!rows.length) {
        modalTableBody.innerHTML =
          '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">ยังไม่มีข้อมูลการเช็คชื่อสำหรับคาบนี้</td></tr>';
      } else {
        rows.forEach((r) => {
          const tr = document.createElement("tr");
          const id = r.studentId || "";
          const name = r.studentName || "";
          const time = r.time || "";
          const status = r.status || "";

          tr.innerHTML = `
            <td>${id}</td>
            <td>${name}</td>
            <td>${time}</td>
            <td>${status}</td>
          `;
          modalTableBody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error(err);
      modalTableBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#fca5a5;">' +
        (err.message || "โหลดข้อมูลไม่สำเร็จ") +
        "</td></tr>";
    }
  }

  // Export เฉพาะคาบ
  exportSessionBtn.addEventListener("click", async () => {
    if (!currentSessionToken) return;
    exportSessionBtn.disabled = true;
    exportSessionBtn.textContent = "กำลังสร้าง CSV...";
    try {
      const res = await callApi("exportSessionAttendance", {
        teacherEmail: currentTeacher.email,
        token: currentSessionToken,
      });
      downloadCsv(
        res.csv,
        res.fileName || `attendance_${currentSessionToken}.csv`
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "ไม่สามารถสร้างไฟล์คาบนี้ได้");
    } finally {
      exportSessionBtn.disabled = false;
      exportSessionBtn.textContent = "⬇ Export คาบนี้ (CSV)";
    }
  });
});
