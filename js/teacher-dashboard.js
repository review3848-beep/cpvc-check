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

  /* close-session modal */
  const closeModal      = document.getElementById("closeModal");
  const modalText       = document.getElementById("modalText");
  const btnCancel       = document.getElementById("btnCancel");
  const btnConfirm      = document.getElementById("btnConfirm");

  let currentSessionToken = null;
  let currentButton = null;

  /* ================= INIT ================= */
  const teacher = getTeacherSession();
  if (!teacher) {
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent  = teacher.name || "-";
  teacherEmailEl.textContent = teacher.email || "-";

  btnCancel?.addEventListener("click", closeCloseModal);
  btnConfirm?.addEventListener("click", confirmCloseSession);

  loadDashboard();

  /* ================= LOAD DASHBOARD ================= */
  async function loadDashboard(){
    try{
      msgEl.textContent = "กำลังโหลด...";
      const res = await callApi("teacherGetDashboard", {});
      if(!res?.success) throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");

      renderStats(res.stats || {});
      renderTable(Array.isArray(res.sessions) ? res.sessions : []);
      msgEl.textContent = "";

    }catch(err){
      console.error(err);
      msgEl.textContent = err?.message || "โหลดข้อมูลไม่สำเร็จ";
    }
  }

  function renderStats(stats){
    totalSessionsEl.textContent = stats.totalSessions ?? 0;
    openSessionsEl.textContent  = stats.openSessions ?? 0;
    totalAttendEl.textContent   = stats.totalAttendance ?? 0;
  }

  function renderTable(list){
    if(!list.length){
      tableBody.innerHTML = `<tr><td colspan="5" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";

    list.forEach(s => {
      const tr = document.createElement("tr");

      const start = s.startTime ?? s.startedAt ?? s.START_TIME ?? "-";
      const status = String(s.status || "-").toUpperCase();

      tr.innerHTML = `
        <td>
          <div class="session-subject">${escapeHtml(s.subject || "-")}</div>
          <div class="session-room">${escapeHtml(s.room || "-")}</div>
        </td>
        <td>${escapeHtml(s.token || "-")}</td>
        <td>${escapeHtml(start)}</td>
        <td>
          <span class="status-pill ${status === "OPEN" ? "status-open" : "status-closed"}">
            ${escapeHtml(status)}
          </span>
        </td>
        <td>
          ${status === "OPEN"
            ? `<button class="btn-small btn-close-session" data-token="${escapeHtml(s.token)}">ปิดคาบ</button>`
            : `-`
          }
        </td>
      `;

      tableBody.appendChild(tr);
    });

    bindCloseButtons();
  }

  /* ================= CLOSE SESSION ================= */
  function bindCloseButtons(){
    document.querySelectorAll(".btn-close-session").forEach(btn => {
      btn.addEventListener("click", () => {
        currentSessionToken = btn.dataset.token;
        currentButton = btn;

        if (!currentSessionToken) {
          alert("ปุ่มนี้ไม่มี token");
          return;
        }

        openCloseModal();
      });
    });
  }

  function openCloseModal(){
    // optional: ใส่ข้อความใน modal ถ้ามี element
    if (modalText) modalText.textContent = `ยืนยันปิดคาบ TOKEN: ${currentSessionToken}`;
    closeModal?.classList.remove("hidden");
  }

  function closeCloseModal(){
    closeModal?.classList.add("hidden");
    currentSessionToken = null;
    currentButton = null;
  }

  async function confirmCloseSession(){
    if(!currentSessionToken){
      alert("ไม่มี token คาบ");
      return;
    }

    btnConfirm.disabled = true;

    try{
      const res = await callApi("teacherCloseSession", { token: currentSessionToken });
      if(!res?.success) throw new Error(res?.message || "ปิดคาบไม่สำเร็จ");

      // update UI
      const row = currentButton?.closest("tr");
      const statusEl = row?.querySelector(".status-pill");
      if (statusEl) {
        statusEl.className = "status-pill status-closed";
        statusEl.textContent = "CLOSED";
      }
      if (currentButton?.parentElement) currentButton.parentElement.textContent = "-";

      closeCloseModal();

    }catch(err){
      console.error(err);
      alert(err?.message || "ปิดคาบไม่สำเร็จ");
    }finally{
      btnConfirm.disabled = false;
    }
  }

  /* ================= SESSION ================= */
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
