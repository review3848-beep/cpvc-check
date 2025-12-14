import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM ----
  const adminEmailEl = document.getElementById("adminEmail");

  const qEl = document.getElementById("q");
  const fromEl = document.getElementById("fromDate");
  const toEl = document.getElementById("toDate");
  const statusEl = document.getElementById("status");

  const refreshBtn = document.getElementById("refreshBtn");
  const exportBtn = document.getElementById("exportBtn");

  const tbody = document.getElementById("attendanceBody");
  const hintEl = document.getElementById("resultHint");
  const msgEl = document.getElementById("msg");

  // ---- state ----
  let allRows = [];
  let filtered = [];
  let loading = false;

  // ---- helpers ----
  const setMsg = (text = "", tone = "muted") => {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color =
      tone === "ok" ? "#4ade80" :
      tone === "warn" ? "#facc15" :
      tone === "err" ? "#f87171" :
      "#94a3b8";
  };

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const norm = (x) => String(x ?? "").trim().toLowerCase();

  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const badgeClass = (st) => {
    const s = String(st || "").toUpperCase();
    if (s === "LATE") return "late";
    if (s === "ABSENT") return "absent";
    return "ok";
  };

  function parseDateOnly(yyyy_mm_dd) {
    // parse as local date at 00:00
    if (!yyyy_mm_dd) return null;
    const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  function parseAnyDate(x) {
    // attendance row may have ISO, timestamp, or "YYYY-MM-DD HH:mm"
    if (!x) return null;
    const d = new Date(x);
    if (!isNaN(d.getTime())) return d;

    // try "YYYY-MM-DD HH:mm"
    const s = String(x);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (m) {
      const [, yy, mm, dd, hh, mi] = m.map(Number);
      return new Date(yy, mm - 1, dd, hh, mi, 0, 0);
    }
    return null;
  }

  function fmtDateTime(x) {
    const d = parseAnyDate(x);
    if (!d) return String(x || "-");
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mi}`;
  }

  // session ที่แนะนำให้ set ตอน login
  const getAdminSession = () => {
    try { return JSON.parse(localStorage.getItem("adminSession") || "null"); }
    catch { return null; }
  };
  const session = getAdminSession();
  if (adminEmailEl && session?.email) adminEmailEl.textContent = session.email;

  // ---- render ----
  function renderTable(rows) {
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="color:#94a3b8;padding:1rem;">ไม่พบข้อมูล</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows.map(r => {
      // expected row fields (flexible):
      // id / attendanceId, datetime / ts, subject, room, teacher, studentId, token, status
      const rowId = escapeHtml(r.attendanceId || r.id || "");
      const dt = escapeHtml(fmtDateTime(r.datetime || r.timestamp || r.ts || r.time));
      const subjectRoom = escapeHtml(
        [r.subject || r.course || r.subjectCode, r.room].filter(Boolean).join(" / ") || "-"
      );
      const teacher = escapeHtml(r.teacherEmail || r.teacher || "-");
      const student = escapeHtml(r.studentId || r.student || r.sid || "-");
      const token = escapeHtml(r.token || r.sessionToken || "-");
      const status = escapeHtml(String(r.status || "OK").toUpperCase());
      const bCls = badgeClass(status);

      return `
        <tr data-id="${rowId}" data-status="${status}">
          <td>${dt}</td>
          <td>${subjectRoom}</td>
          <td>${teacher}</td>
          <td>${student}</td>
          <td>${token}</td>
          <td><span class="badge ${bCls}">${status}</span></td>
          <td>
            <div class="row-actions">
              <button class="mini" data-act="setOk">OK</button>
              <button class="mini" data-act="setLate">LATE</button>
              <button class="mini" data-act="setAbsent">ABSENT</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function updateHint() {
    if (!hintEl) return;
    hintEl.textContent = `${filtered.length} รายการ (จากทั้งหมด ${allRows.length})`;
  }

  function applyFilters() {
    const q = norm(qEl?.value || "");
    const status = String(statusEl?.value || "ALL").toUpperCase();
    const fromD = parseDateOnly(fromEl?.value || "");
    const toD = parseDateOnly(toEl?.value || "");
    // ให้ to ครอบคลุมทั้งวัน (23:59:59)
    const toEnd = toD ? new Date(toD.getFullYear(), toD.getMonth(), toD.getDate(), 23, 59, 59, 999) : null;

    filtered = allRows.filter(r => {
      const st = String(r.status || "").toUpperCase();

      if (status !== "ALL" && st !== status) return false;

      const dt = parseAnyDate(r.datetime || r.timestamp || r.ts || r.time);
      if (fromD && dt && dt < fromD) return false;
      if (toEnd && dt && dt > toEnd) return false;
      // ถ้าข้อมูลไม่มีวันเวลา ก็ปล่อยผ่าน (อย่าให้หายแบบงง ๆ)
      if ((fromD || toEnd) && !dt) return false;

      if (!q) return true;

      const blob = [
        r.subject, r.course, r.subjectCode, r.room,
        r.teacher, r.teacherEmail,
        r.student, r.studentId, r.sid,
        r.token, r.sessionToken,
        r.status
      ].map(norm).join(" ");

      return blob.includes(q);
    });

    renderTable(filtered);
    updateHint();
  }

  // ---- API ----
  async function loadAttendance() {
    if (loading) return;
    loading = true;
    setMsg("กำลังโหลดข้อมูลเช็คชื่อ…");

    try {
      const res = await callApi({
        action: "adminListAttendance",
        adminSession: session || null
      });

      if (!res || res.ok !== true) {
        throw new Error(res?.error || "โหลดข้อมูลไม่สำเร็จ (adminListAttendance)");
      }

      // expected: { ok:true, data:{ rows:[...] } } or { ok:true, rows:[...] }
      const rows = res.data?.rows || res.rows || res.data?.attendance || [];
      allRows = Array.isArray(rows) ? rows : [];

      applyFilters();
      setMsg("โหลดข้อมูลเรียบร้อย", "ok");
    } catch (err) {
      console.error("[admin-attendance] load:", err);
      allRows = [];
      applyFilters();
      setMsg(
        `โหลดข้อมูลไม่สำเร็จ: ${err?.message || err} (ต้องมี action: adminListAttendance ใน Code.gs)`,
        "err"
      );
    } finally {
      loading = false;
    }
  }

  async function updateStatus(attendanceId, newStatus) {
    if (!attendanceId) return;

    setMsg(`กำลังอัปเดตสถานะเป็น ${newStatus}…`);
    try {
      const res = await callApi({
        action: "adminUpdateAttendanceStatus",
        adminSession: session || null,
        attendanceId,
        status: newStatus
      });

      if (!res || res.ok !== true) {
        throw new Error(res?.error || "อัปเดตไม่สำเร็จ");
      }

      // update local cache for smoother UX
      const idx = allRows.findIndex(r => String(r.attendanceId || r.id || "") === String(attendanceId));
      if (idx >= 0) allRows[idx].status = newStatus;

      applyFilters();
      setMsg("อัปเดตสถานะสำเร็จ", "ok");
    } catch (err) {
      console.error("[admin-attendance] updateStatus:", err);
      setMsg(
        `อัปเดตสถานะไม่สำเร็จ: ${err?.message || err} (ต้องมี action: adminUpdateAttendanceStatus)`,
        "err"
      );
    }
  }

  // ---- CSV export (เฉพาะ filtered) ----
  function toCsvValue(v) {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  }

  function exportCsvCurrent() {
    if (!filtered || filtered.length === 0) {
      setMsg("ไม่มีข้อมูลให้ Export (ลองเปลี่ยนตัวกรองก่อน)", "warn");
      return;
    }

    const headers = [
      "datetime",
      "subject",
      "room",
      "teacher",
      "studentId",
      "token",
      "status"
    ];

    const lines = [];
    lines.push(headers.join(","));

    for (const r of filtered) {
      const row = {
        datetime: fmtDateTime(r.datetime || r.timestamp || r.ts || r.time),
        subject: r.subject || r.course || r.subjectCode || "",
        room: r.room || "",
        teacher: r.teacherEmail || r.teacher || "",
        studentId: r.studentId || r.student || r.sid || "",
        token: r.token || r.sessionToken || "",
        status: String(r.status || "").toUpperCase()
      };
      lines.push(headers.map(h => toCsvValue(row[h])).join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,"0");
    const d = String(now.getDate()).padStart(2,"0");
    const filename = `attendance_filtered_${y}-${m}-${d}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setMsg(`Export สำเร็จ: ${filename}`, "ok");
  }

  // ---- events ----
  const onFilter = debounce(applyFilters, 200);

  qEl?.addEventListener("input", onFilter);
  statusEl?.addEventListener("change", applyFilters);
  fromEl?.addEventListener("change", applyFilters);
  toEl?.addEventListener("change", applyFilters);

  refreshBtn?.addEventListener("click", loadAttendance);
  exportBtn?.addEventListener("click", exportCsvCurrent);

  // row action buttons
  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-act]");
    if (!btn) return;

    const tr = btn.closest("tr");
    if (!tr) return;

    const id = tr.dataset.id;
    const act = btn.dataset.act;

    let st = null;
    if (act === "setOk") st = "OK";
    if (act === "setLate") st = "LATE";
    if (act === "setAbsent") st = "ABSENT";
    if (!st) return;

    if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น ${st} ?`)) return;
    updateStatus(id, st);
  });

  // ---- init: set default date range (วันนี้) ถ้ายังว่าง ----
  (function initDefaultDates(){
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth()+1).padStart(2,"0");
    const d = String(today.getDate()).padStart(2,"0");
    const iso = `${y}-${m}-${d}`;
    if (fromEl && !fromEl.value) fromEl.value = iso;
    if (toEl && !toEl.value) toEl.value = iso;
  })();

  // ---- start ----
  loadAttendance();
});
