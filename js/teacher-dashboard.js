import { callApi } from "../api.js";

document.addEventListener("DOMContentLoaded", () => {
  /* ================= DOM ================= */
  const teacherNameEl   = document.getElementById("teacherName");
  const teacherEmailEl  = document.getElementById("teacherEmail");

  const totalSessionsEl = document.getElementById("totalSessions");
  const openSessionsEl  = document.getElementById("openSessions");
  const totalAttendEl   = document.getElementById("totalAttendance");

  const tableBody       = document.getElementById("sessionTable");
  const msgEl           = document.getElementById("msg");

  const exportAllBtn    = document.getElementById("exportAllBtn");
  const exportAllBtn2   = document.getElementById("exportAllBtn2");

  const subjectFilter   = document.getElementById("subjectFilter");
  const chipsEl         = document.getElementById("subjectSummaryChips");

  /* ===== Session detail modal ===== */
  const sessionModal     = document.getElementById("sessionModal");
  const modalCloseBtn    = document.getElementById("modalCloseBtn");
  const modalSubtitle    = document.getElementById("modalSubtitle");
  const modalStats       = document.getElementById("modalStats");
  const modalTableBody   = document.getElementById("modalTableBody");
  const modalFooterInfo  = document.getElementById("modalFooterInfo");
  const exportSessionBtn = document.getElementById("exportSessionBtn");

  /* ===== Close session modal ===== */
  const closeModal   = document.getElementById("closeModal");
  const modalText    = document.getElementById("modalText");
  const btnCancelX   = document.getElementById("btnCancel");
  const btnCancel2   = document.getElementById("btnCancel2");
  const btnConfirm   = document.getElementById("btnConfirm");

  /* ================= STATE ================= */
  let allSessions = [];
  let selectedSession = null;     // { sessionId, token, subject, room, startTime, status }
  let selectedRecords = [];       // [{studentId, studentName, time, status}]
  let closeToken = null;

  /* ================= INIT ================= */
  const teacher = getTeacherSession();
  if (!teacher) {
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent  = teacher.name || "-";
  teacherEmailEl.textContent = teacher.email || "-";

  exportAllBtn?.addEventListener("click", exportAllCSV);
  exportAllBtn2?.addEventListener("click", exportAllCSV);

  subjectFilter?.addEventListener("change", renderFiltered);

  // ตาราง: event delegation
  tableBody?.addEventListener("click", (e) => {
    const btn = e.target?.closest("button");
    if (!btn) return;

    const action = btn.dataset.action || "";
    const sessionId = btn.dataset.sessionId || "";
    const token = btn.dataset.token || "";

    if (action === "detail") openSessionDetail(sessionId);
    if (action === "close")  openCloseModal(token);
  });

  // ปิด modal รายละเอียด
  modalCloseBtn?.addEventListener("click", closeDetailModal);
  sessionModal?.addEventListener("click", (e) => {
    if (e.target === sessionModal) closeDetailModal();
  });

  // ปิด modal ปิดคาบ
  btnCancelX?.addEventListener("click", closeCloseModal);
  btnCancel2?.addEventListener("click", closeCloseModal);
  closeModal?.addEventListener("click", (e) => {
    if (e.target === closeModal) closeCloseModal();
  });

  btnConfirm?.addEventListener("click", confirmCloseSession);

  // Export รายคาบ: ทำจากข้อมูล modal (ไม่พึ่ง GAS exportSession ที่บั๊ก)
  exportSessionBtn?.addEventListener("click", exportCurrentSessionCSV);

  loadDashboard();

  /* ================= LOAD DASHBOARD ================= */
  async function loadDashboard(){
    try{
      setMsg("กำลังโหลด...");
      const res = await callApi("teacherGetDashboard", {});
      if(!res?.success) throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");

      allSessions = Array.isArray(res.sessions) ? res.sessions : [];
      renderStats(res.stats || {});
      buildSubjectFilter(allSessions);
      renderFiltered();

      setMsg("");
    }catch(err){
      console.error(err);
      setMsg(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  function renderStats(stats){
    totalSessionsEl.textContent = stats.totalSessions ?? 0;
    openSessionsEl.textContent  = stats.openSessions ?? 0;
    totalAttendEl.textContent   = stats.totalAttendance ?? 0;
  }

  function buildSubjectFilter(list){
    if(!subjectFilter) return;
    const subjects = Array.from(new Set(
      list.map(s => String(s.subject || "").trim()).filter(Boolean)
    )).sort((a,b)=>a.localeCompare(b,"th"));

    subjectFilter.innerHTML = `<option value="">ทั้งหมด</option>`;
    subjects.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subjectFilter.appendChild(opt);
    });
  }

  function renderFiltered(){
    const sub = String(subjectFilter?.value || "").trim();
    const list = sub ? allSessions.filter(s => String(s.subject || "").trim() === sub) : allSessions;
    renderChips(list, sub);
    renderTable(list);
  }

  function renderChips(list, sub){
    if(!chipsEl) return;
    const total = list.length;
    const open = list.filter(s => String(s.status || "").toUpperCase() === "OPEN").length;

    chipsEl.innerHTML = `
      <div class="chip">แสดง: <span class="highlight">${escapeHtml(sub || "ทั้งหมด")}</span></div>
      <div class="chip">คาบ: <span class="highlight">${total}</span></div>
      <div class="chip">OPEN: <span class="highlight">${open}</span></div>
    `;
  }

  function renderTable(list){
    if(!tableBody) return;

    if(!list.length){
      tableBody.innerHTML = `<tr><td colspan="5" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";

    list.forEach(s => {
      const sid = String(s.sessionId || s.id || s.SESSION_ID || "").trim();
      const token = String(s.token || "-").trim();
      const start = s.startTime ?? s.startedAt ?? s.START_TIME ?? "-";
      const status = String(s.status || "-").toUpperCase();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="session-subject">${escapeHtml(s.subject || "-")}</div>
          <div class="session-room">${escapeHtml(s.room || "-")}</div>
        </td>
        <td>${escapeHtml(token)}</td>
        <td>${escapeHtml(start)}</td>
        <td>
          <span class="status-pill ${status === "OPEN" ? "open" : "closed"}">${escapeHtml(status)}</span>
        </td>
        <td style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-mini" data-action="detail" data-session-id="${escapeHtml(sid)}">ดู</button>
          ${status === "OPEN"
            ? `<button class="btn-mini danger" data-action="close" data-token="${escapeHtml(token)}">ปิดคาบ</button>`
            : ``}
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  /* ================= EXPORT ALL ================= */
  async function exportAllCSV(){
    try{
      setMsg("กำลังสร้างไฟล์ CSV...");
      setExportDisabled(true);

      const res = await callApi("teacherExportAll", {});
      if(!res?.success) throw new Error(res?.message || "Export ไม่สำเร็จ");

      const csv = String(res.csv || res.csvText || "");
      if(!csv) throw new Error("Server ไม่ส่ง CSV กลับมา");

      downloadCSV(csv, `attendance_all_${todayKey()}.csv`);
      setMsg("ดาวน์โหลดแล้ว ✅");
    }catch(err){
      console.error(err);
      alert(err?.message || "Export ไม่สำเร็จ");
      setMsg(err?.message || "Export ไม่สำเร็จ");
    }finally{
      setExportDisabled(false);
    }
  }

  function setExportDisabled(disabled){
    if(exportAllBtn) exportAllBtn.disabled = disabled;
    if(exportAllBtn2) exportAllBtn2.disabled = disabled;
  }

  /* ================= SESSION DETAIL ================= */
  async function openSessionDetail(sessionId){
    const sid = String(sessionId || "").trim();
    if(!sid) return alert("ไม่มี sessionId");

    selectedSession = null;
    selectedRecords = [];
    exportSessionBtn.disabled = true;

    openDetailModal();
    modalSubtitle.textContent = "กำลังโหลดรายละเอียด...";
    modalStats.innerHTML = "";
    modalFooterInfo.innerHTML = "";
    modalTableBody.innerHTML = `<tr><td colspan="4" class="empty">กำลังโหลด...</td></tr>`;

    try{
      const res = await callApi("teacherGetSessionDetail", { sessionId: sid });
      if(!res?.success) throw new Error(res?.message || "โหลดรายละเอียดไม่สำเร็จ");

      const sess = res.session || {};
      const stats = res.stats || {};
      const records = Array.isArray(res.records) ? res.records : [];

      selectedSession = {
        sessionId: String(sess.sessionId || sid),
        token: String(sess.token || "").trim().toUpperCase(),
        subject: String(sess.subject || "-"),
        room: String(sess.room || "-"),
        startTime: sess.startTime,
        status: String(sess.status || "-")
      };
      selectedRecords = records;

      modalSubtitle.textContent = `${selectedSession.subject} • ห้อง ${selectedSession.room} • TOKEN: ${selectedSession.token}`;

      modalStats.innerHTML = `
        <span class="badge">ทั้งหมด: ${Number(stats.total ?? records.length)}</span>
        <span class="badge ok">มา: ${Number(stats.ok ?? 0)}</span>
        <span class="badge late">สาย: ${Number(stats.late ?? 0)}</span>
        <span class="badge absent">ขาด: ${Number(stats.absent ?? 0)}</span>
      `;

      modalFooterInfo.innerHTML = `
        <span class="badge">สถานะ: ${escapeHtml(selectedSession.status)}</span>
        <span class="badge">เริ่ม: ${escapeHtml(String(selectedSession.startTime ?? "-"))}</span>
      `;

      if(!records.length){
        modalTableBody.innerHTML = `<tr><td colspan="4" class="empty">ยังไม่มีการเช็คชื่อในคาบนี้</td></tr>`;
      }else{
        modalTableBody.innerHTML = records.map(r => `
          <tr>
            <td>${escapeHtml(r.studentId || "-")}</td>
            <td>${escapeHtml(r.studentName || "-")}</td>
            <td>${escapeHtml(r.time || "-")}</td>
            <td>${escapeHtml(String(r.status || "-").toUpperCase())}</td>
          </tr>
        `).join("");
      }

      exportSessionBtn.disabled = false;

    }catch(err){
      console.error(err);
      modalSubtitle.textContent = "โหลดไม่สำเร็จ";
      modalTableBody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(err?.message || "โหลดรายละเอียดไม่สำเร็จ")}</td></tr>`;
      exportSessionBtn.disabled = true;
    }
  }

  function exportCurrentSessionCSV(){
    if(!selectedSession) return alert("ยังไม่ได้เปิดรายละเอียดคาบ");
    const tok = selectedSession.token || "SESSION";
    const filename = `attendance_${tok}_${todayKey()}.csv`;

    // ✅ สร้าง CSV จากข้อมูล modal (ชัวร์ ไม่พึ่ง GAS exportSession ที่บั๊ก)
    const header = ["TOKEN","SUBJECT","ROOM","START_TIME","STUDENT_ID","STUDENT_NAME","DATETIME","STATUS"];
    const rows = [header];

    (selectedRecords || []).forEach(r => {
      rows.push([
        selectedSession.token || "",
        selectedSession.subject || "",
        selectedSession.room || "",
        selectedSession.startTime || "",
        r.studentId || "",
        r.studentName || "",
        r.time || "",
        String(r.status || "").toUpperCase()
      ]);
    });

    const csv = toCSVFromRows(rows);
    downloadCSV(csv, filename);
  }

  function openDetailModal(){
    sessionModal?.classList.add("open");
    sessionModal?.setAttribute("aria-hidden","false");
  }
  function closeDetailModal(){
    sessionModal?.classList.remove("open");
    sessionModal?.setAttribute("aria-hidden","true");
  }

  /* ================= CLOSE SESSION ================= */
  function openCloseModal(token){
    const t = String(token || "").trim().toUpperCase();
    if(!t || t === "-") return alert("ไม่มี TOKEN");
    closeToken = t;

    if(modalText) modalText.textContent = `ยืนยันปิดคาบ TOKEN: ${closeToken}`;
    closeModal?.classList.add("open");
    closeModal?.setAttribute("aria-hidden","false");
  }

  function closeCloseModal(){
    closeModal?.classList.remove("open");
    closeModal?.setAttribute("aria-hidden","true");
    closeToken = null;
  }

  async function confirmCloseSession(){
    if(!closeToken) return alert("ไม่มี TOKEN");
    btnConfirm.disabled = true;

    try{
      const res = await callApi("teacherCloseSession", { token: closeToken });
      if(!res?.success) throw new Error(res?.message || "ปิดคาบไม่สำเร็จ");

      closeCloseModal();
      closeDetailModal();
      await loadDashboard();

    }catch(err){
      console.error(err);
      alert(err?.message || "ปิดคาบไม่สำเร็จ");
    }finally{
      btnConfirm.disabled = false;
    }
  }

  /* ================= UTILS ================= */
  function setMsg(t){ if(msgEl) msgEl.textContent = String(t || ""); }

  function todayKey(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const da = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${da}`;
  }

  function downloadCSV(csvText, filename){
    // ✅ BOM กันภาษาไทยเพี้ยนใน Excel
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function toCSVFromRows(rows){
    return rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  }

  function getTeacherSession(){
    try{
      const raw = localStorage.getItem("teacherSession");
      if(!raw) return null;
      const obj = JSON.parse(raw);

      const teacherId = String(obj.teacherId ?? obj.id ?? "").trim();
      const email = String(obj.email ?? "").trim();
      const name = String(obj.name ?? "").trim();

      if(!teacherId && !email && !name) return null;
      return { ...obj, teacherId, id: teacherId || obj.id || "", email, name };
    }catch{
      return null;
    }
  }

  function escapeHtml(v){
    return String(v ?? "").replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }
});
