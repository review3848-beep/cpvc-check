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
  let currentButton    = null;

  /* ================= INIT ================= */
  const teacher = getTeacherSession();
  if (!teacher) {
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent  = teacher.name || "-";
  teacherEmailEl.textContent = teacher.email || "-";

  btnCancel.addEventListener("click", closeCloseModal);
  btnConfirm.addEventListener("click", confirmCloseSession);

  loadDashboard();

  /* ================= LOAD DASHBOARD ================= */
  async function loadDashboard(){
    try{
      const res = await callApi("teacherGetDashboard", {});
      if(!res.success) throw res.message;

      renderStats(res.stats);
      renderTable(res.sessions);

    }catch(err){
      msgEl.textContent = err || "โหลดข้อมูลไม่สำเร็จ";
    }
  }

  function renderStats(stats){
    totalSessionsEl.textContent = stats.totalSessions || 0;
    openSessionsEl.textContent  = stats.openSessions || 0;
    totalAttendEl.textContent   = stats.totalAttendance || 0;
  }

  function renderTable(list){
    if(!list || list.length === 0){
      tableBody.innerHTML =
        `<tr><td colspan="5" class="empty">ยังไม่มีข้อมูลคาบ</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";

    list.forEach(s => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="session-subject">${s.subject || "-"}</div>
          <div class="session-room">${s.room || "-"}</div>
        </td>
        <td>${s.token}</td>
        <td>${s.startedAt || "-"}</td>
        <td>
          <span class="status-pill ${
            s.status === "OPEN" ? "status-open" : "status-closed"
          }">${s.status}</span>
        </td>
        <td>
          ${
            s.status === "OPEN"
              ? `<button class="btn-small btn-close-session"
                   data-token="${s.token}">
                   ปิดคาบ
                 </button>`
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

    // ✅ ตรงนี้คือหัวใจ
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
  closeModal.classList.remove("hidden");
}


  function closeCloseModal(){
    closeModal.classList.add("hidden");
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
    const res = await callApi("teacherCloseSession", {
      token: currentSessionToken
    });

    if(!res.success) throw res.message;

    // update UI
    const row = currentButton.closest("tr");
    const statusEl = row.querySelector(".status-pill");
    statusEl.className = "status-pill status-closed";
    statusEl.textContent = "CLOSED";
    currentButton.parentElement.textContent = "-";

    closeCloseModal();

  }catch(err){
    alert(err || "ปิดคาบไม่สำเร็จ");
  }finally{
    btnConfirm.disabled = false; // 🔥 สำคัญ
  }
}


  /* ================= SESSION ================= */
  function getTeacherSession(){
    try{
      return JSON.parse(localStorage.getItem("teacherSession"));
    }catch{
      return null;
    }
  }

});
