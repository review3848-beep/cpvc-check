// js/student-history.js
// ประวัติการเช็คชื่อ + กรองวันที่/สถานะ + ค้นหา + Export (CSV/Excel)
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("studentNameDisplay");
  const idEl = document.getElementById("studentIdDisplay");
  const tbody = document.getElementById("historyBody");
  const msgEl = document.getElementById("historyMsg");

  const searchInput = document.getElementById("searchInput");
  const btnExportCSV = document.getElementById("btnExportCSV");
  const btnExportXLSX = document.getElementById("btnExportXLSX");

  const countAll = document.getElementById("countAll");
  const countOK = document.getElementById("countOK");
  const countLATE = document.getElementById("countLATE");
  const countABSENT = document.getElementById("countABSENT");

  // ---------- helper ----------
  function setMsg(text) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
  }

  function statusClass(status) {
    const s = String(status || "").toUpperCase();
    if (s === "OK") return "status-ok";
    if (s === "LATE") return "status-late";
    if (s === "ABSENT") return "status-absent";
    return "";
  }

  // ✅ เวลาไทย + พ.ศ.
  function formatDateTimeTH(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  }

  function toUpper(v) {
    return String(v ?? "").toUpperCase();
  }

  function safeText(v) {
    return String(v ?? "").trim();
  }

  // ---------- state ----------
  let student = null;
  let fullHistory = [];
  let filteredHistory = [];

  let dateFilter = "ALL";    // ALL | TODAY | WEEK
  let statusFilter = "ALL";  // ALL | OK | LATE | ABSENT
  let queryText = "";

  // ---------- session นักเรียน ----------
  try {
    const raw = localStorage.getItem("cpvc_student");
    if (!raw) throw new Error("no session");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) throw new Error("invalid");
    student = parsed;
  } catch (e) {
    window.location.href = "login.html";
    return;
  }

  if (nameEl) nameEl.textContent = student.name || "นักเรียน";
  if (idEl) idEl.textContent = student.studentId || "-";

  // ---------- wire UI ----------
  // date filter buttons
  document.querySelectorAll("[data-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-date]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      dateFilter = btn.dataset.date || "ALL";
      applyFilters();
    });
  });

  // status filter buttons
  document.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-status]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      statusFilter = btn.dataset.status || "ALL";
      applyFilters();
    });
  });

  // search
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      queryText = safeText(searchInput.value).toLowerCase();
      applyFilters();
    });
  }

  // export
  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", () => exportCSV(filteredHistory));
  }
  if (btnExportXLSX) {
    btnExportXLSX.addEventListener("click", () => exportXLSX(filteredHistory));
  }

  // ---------- load ----------
  loadHistory();

  async function loadHistory() {
    setMsg("กำลังโหลดประวัติการเข้าเรียน...");

    try {
      const res = await callApi("getStudentHistory", {
        studentId: student.studentId,
      });

      if (!res || !res.success) {
        throw new Error(res && res.message ? res.message : "โหลดข้อมูลไม่สำเร็จ");
      }

      fullHistory = (res.history || []).slice();

      // update counts (จากทั้งหมด)
      updateCounts(fullHistory);

      applyFilters(); // render ด้วย filter ปัจจุบัน

      if (!fullHistory.length) {
        setMsg("ยังไม่มีข้อมูลการเช็คชื่อในระบบ");
      } else {
        setMsg(`พบประวัติทั้งหมด ${fullHistory.length} รายการ`);
      }
    } catch (err) {
      console.error("loadHistory error:", err);
      setMsg(err.message || "โหลดข้อมูลไม่สำเร็จ");
      fullHistory = [];
      updateCounts(fullHistory);
      applyFilters();
    }
  }

  function updateCounts(list) {
    const total = list.length;
    const ok = list.filter(r => toUpper(r.status) === "OK").length;
    const late = list.filter(r => toUpper(r.status) === "LATE").length;
    const absent = list.filter(r => toUpper(r.status) === "ABSENT").length;

    if (countAll) countAll.textContent = total;
    if (countOK) countOK.textContent = ok;
    if (countLATE) countLATE.textContent = late;
    if (countABSENT) countABSENT.textContent = absent;
  }

  // ---------- filtering ----------
  function applyFilters() {
    let list = fullHistory.slice();

    // date filter
    if (dateFilter !== "ALL") {
      const now = new Date();

      const isToday = (d) => {
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      };

      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      list = list.filter((r) => {
        const d = new Date(r.time);
        if (isNaN(d.getTime())) return false;

        if (dateFilter === "TODAY") return isToday(d);
        if (dateFilter === "WEEK") return d >= weekAgo && d <= now;
        return true;
      });
    }

    // status filter
    if (statusFilter !== "ALL") {
      list = list.filter(r => toUpper(r.status) === statusFilter);
    }

    // search: subject OR teacher
    if (queryText) {
      list = list.filter((r) => {
        const subject = safeText(r.subject).toLowerCase();
        const teacher = safeText(r.teacherName || r.teacherEmail).toLowerCase();
        return subject.includes(queryText) || teacher.includes(queryText);
      });
    }

    // ใหม่สุดอยู่บน
    filteredHistory = list.slice().reverse();

    renderTable(filteredHistory);

    // message ด้านบนให้รู้ว่ากรองแล้วเหลือเท่าไหร่
    if (msgEl) {
      if (!fullHistory.length) return;
      const suffix = [];
      if (dateFilter !== "ALL") suffix.push(dateFilter === "TODAY" ? "วันนี้" : "สัปดาห์นี้");
      if (statusFilter !== "ALL") suffix.push(`สถานะ ${statusFilter}`);
      if (queryText) suffix.push(`ค้นหา “${queryText}”`);
      const label = suffix.length ? ` (กรอง: ${suffix.join(" • ")})` : "";
      setMsg(`แสดง ${filteredHistory.length} จากทั้งหมด ${fullHistory.length} รายการ${label}`);
    }
  }

  // ---------- render ----------
  function renderTable(list) {
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!list.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = fullHistory.length ? "ไม่พบข้อมูลตามตัวกรอง" : "ยังไม่มีข้อมูลการเช็คชื่อ";
      td.className = "empty";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    list.forEach((row) => {
      const tr = document.createElement("tr");

      const rawTime = row.time || "";
      const status = row.status || "-";
      const subject = row.subject || "-";
      const room = row.room || "-";
      const teacherName = row.teacherName || row.teacherEmail || "-";

      // เวลา
      const tdTime = document.createElement("td");
      tdTime.textContent = formatDateTimeTH(rawTime || "-");
      tdTime.classList.add("time-col");
      if (rawTime) tdTime.title = rawTime; // hover ดู raw
      tr.appendChild(tdTime);

      // วิชา
      const tdSubject = document.createElement("td");
      tdSubject.textContent = subject;
      tr.appendChild(tdSubject);

      // ห้อง
      const tdRoom = document.createElement("td");
      tdRoom.textContent = room;
      tr.appendChild(tdRoom);

      // สถานะ
      const tdStatus = document.createElement("td");
      tdStatus.textContent = status;
      tdStatus.className = statusClass(status);
      tr.appendChild(tdStatus);

      // ครู
      const tdTeacher = document.createElement("td");
      tdTeacher.textContent = teacherName;
      tr.appendChild(tdTeacher);

      tbody.appendChild(tr);
    });
  }

  // ---------- export ----------
  function getExportRows(list) {
    // list ที่เข้ามา = filteredHistory (ใหม่สุดอยู่บนแล้ว)
    return list.map((r) => ({
      เวลา: formatDateTimeTH(r.time || ""),
      เวลาRaw: r.time || "",
      วิชา: r.subject || "",
      ห้อง: r.room || "",
      สถานะ: (r.status || "").toUpperCase(),
      ครู: r.teacherName || r.teacherEmail || "",
    }));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCSV(list) {
    const rows = getExportRows(list);
    if (!rows.length) {
      setMsg("ไม่มีข้อมูลในตัวกรองนี้ให้ export");
      return;
    }

    const headers = Object.keys(rows[0]);
    const escapeCSV = (v) => {
      const s = String(v ?? "");
      // ใส่ "" ครอบถ้ามี comma/quote/newline
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv =
      headers.join(",") + "\n" +
      rows.map(r => headers.map(h => escapeCSV(r[h])).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM กันภาษาไทยเพี้ยน
    const stamp = new Date().toISOString().slice(0,10);
    downloadBlob(blob, `CPVC-History-${stamp}.csv`);
  }

  function exportXLSX(list) {
    const rows = getExportRows(list);
    if (!rows.length) {
      setMsg("ไม่มีข้อมูลในตัวกรองนี้ให้ export");
      return;
    }

    // ถ้า SheetJS ยังไม่โหลด ให้ fallback เป็น CSV
    if (!window.XLSX) {
      exportCSV(list);
      return;
    }

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "History");

    const stamp = new Date().toISOString().slice(0,10);
    window.XLSX.writeFile(wb, `CPVC-History-${stamp}.xlsx`);
  }
});
