import { callApi } from "../api.js";

/* ================== CONFIG (ACTIONS) ================== */
const ACTION_LIST   = "adminGetSessions";     // list sessions
const ACTION_OPEN   = "adminOpenSession";     // open session
const ACTION_CLOSE  = "adminCloseSession";    // close session
const ACTION_EXPORT = "adminExportSessions";  // export csv

/* ================== DOM ================== */
const tbody   = document.getElementById("tbody");
const q       = document.getElementById("q");
const countEl = document.getElementById("count");
const msgEl   = document.getElementById("msg");

const btnExport = document.getElementById("btnExport");
const btnOpen   = document.getElementById("btnOpen");
const btnLogout = document.getElementById("btnLogout");

/* open modal */
const openModal  = document.getElementById("openModal");
const openClose  = document.getElementById("openClose");
const openCancel = document.getElementById("openCancel");
const openSave   = document.getElementById("openSave");

const fTeacher = document.getElementById("fTeacher");
const fRoom    = document.getElementById("fRoom");
const fSubject = document.getElementById("fSubject");
const fNote    = document.getElementById("fNote");

/* close modal */
const closeModal   = document.getElementById("closeModal");
const closeClose   = document.getElementById("closeClose");
const closeCancel  = document.getElementById("closeCancel");
const closeConfirm = document.getElementById("closeConfirm");
const closeSummary = document.getElementById("closeSummary");

/* ================== STATE ================== */
let rows = [];
let closingTarget = null;

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  const admin = guardAdmin();
  if (!admin) return;

  wireEvents();
  await loadSessions();
  render();
}

/* ================== GUARD (กันเด้งกลับ login) ================== */
function guardAdmin() {
  const candidates = [
    "adminSession", "admin_session", "ADMIN_SESSION",
    "admin", "adminUser", "cpvcAdmin", "cpvc_adminSession"
  ];

  const allKeys = [
    ...new Set([
      ...Object.keys(localStorage || {}),
      ...Object.keys(sessionStorage || {})
    ])
  ];
  const adminLike = allKeys.filter(k => String(k).toLowerCase().includes("admin"));
  const keys = [...candidates, ...adminLike];

  let raw = null;
  for (const k of keys) {
    raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (raw) break;
  }

  if (!raw) {
    // ใช้ URL แบบ relative ที่ “ชัวร์” ตาม path ปัจจุบัน
    location.href = new URL("./login.html", location.href).toString();
    return null;
  }

  try { return JSON.parse(raw); }
  catch { return { token: raw }; }
}

/* ================== EVENTS ================== */
function wireEvents() {
  q?.addEventListener("input", render);

  btnOpen?.addEventListener("click", () => {
    openOpenModal();
  });

  btnExport?.addEventListener("click", exportCsv);

  btnLogout?.addEventListener("click", () => {
    hardLogout();
  });

  /* open modal */
  openClose?.addEventListener("click", closeOpenModal);
  openCancel?.addEventListener("click", closeOpenModal);
  openModal?.addEventListener("click", (e) => { if (e.target === openModal) closeOpenModal(); });
  openSave?.addEventListener("click", onOpenSession);

  /* close modal */
  closeClose?.addEventListener("click", closeCloseModal);
  closeCancel?.addEventListener("click", closeCloseModal);
  closeModal?.addEventListener("click", (e) => { if (e.target === closeModal) closeCloseModal(); });
  closeConfirm?.addEventListener("click", onConfirmClose);
}

/* ================== API ================== */
async function loadSessions() {
  toast("กำลังโหลดข้อมูลคาบเรียน...");
  try {
    const res = await callApi({ action: ACTION_LIST });

    // รองรับได้หลายรูปแบบ: {rows:[]}, {data:[]}, หรือเป็น array ตรงๆ
    const list = Array.isArray(res?.rows) ? res.rows
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res) ? res
      : [];

    rows = list;
    toast(rows.length ? `โหลดแล้ว ${rows.length} คาบ` : "ยังไม่มีคาบเรียน");
  } catch (err) {
    console.error(err);
    rows = [];
    toast("โหลดข้อมูลไม่สำเร็จ");
  }
}

/* ================== RENDER ================== */
function render() {
  const keyword = (q?.value || "").trim().toLowerCase();

  const filtered = !keyword ? rows : rows.filter(r => {
    const id      = String(pick(r, ["SESSION_ID","sessionId","ID","id"]) || "").toLowerCase();
    const token   = String(pick(r, ["TOKEN","token"]) || "").toLowerCase();
    const subject = String(pick(r, ["SUBJECT","subject"]) || "").toLowerCase();
    const room    = String(pick(r, ["ROOM","room"]) || "").toLowerCase();
    const teacher = String(pick(r, ["TEACHER_EMAIL","teacherEmail","TEACHER","teacher"]) || "").toLowerCase();
    return (
      id.includes(keyword) ||
      token.includes(keyword) ||
      subject.includes(keyword) ||
      room.includes(keyword) ||
      teacher.includes(keyword)
    );
  });

  if (countEl) countEl.textContent = `${filtered.length} รายการ`;

  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="6">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const sessionId = esc(String(pick(r, ["SESSION_ID","sessionId","ID","id"]) || ""));
    const token     = esc(String(pick(r, ["TOKEN","token"]) || ""));
    const subject   = esc(String(pick(r, ["SUBJECT","subject"]) || "-"));
    const room      = esc(String(pick(r, ["ROOM","room"]) || "-"));
    const teacher   = esc(String(pick(r, ["TEACHER_EMAIL","teacherEmail","TEACHER","teacher"]) || "-"));

    const statusRaw = String(pick(r, ["STATUS","status"]) || "").trim().toUpperCase();
    const status = statusRaw === "OPEN" ? "OPEN" : "CLOSED";

    const statusClass = status === "OPEN" ? "status status--open" : "status status--closed";
    const statusText  = status === "OPEN" ? "OPEN" : "CLOSED";

    const btnCloseHtml = status === "OPEN"
      ? `<button class="btn btn--danger btn-mini" data-close="${sessionId}" data-token="${token}" data-subject="${subject}" data-room="${room}">ปิดคาบ</button>`
      : `<button class="btn btn-mini" disabled style="opacity:.55; cursor:not-allowed;">ปิดแล้ว</button>`;

    return `
      <tr>
        <td class="mono" data-label="SESSION_ID">${sessionId}</td>
        <td class="mono" data-label="TOKEN">${token}</td>
        <td data-label="SUBJECT / ROOM">
          <div style="font-weight:900;">${subject}</div>
          <div class="muted" style="font-weight:700; margin-top:2px;">ห้อง ${room}</div>
        </td>
        <td data-label="TEACHER">${teacher}</td>
        <td data-label="STATUS">
          <span class="${statusClass}">
            <span class="dot"></span> ${statusText}
          </span>
        </td>
        <td data-label="ACTIONS">
          <div class="right">
            ${btnCloseHtml}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // bind close buttons
  tbody.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      openCloseConfirm({
        sessionId: btn.getAttribute("data-close"),
        token: btn.getAttribute("data-token"),
        subject: btn.getAttribute("data-subject"),
        room: btn.getAttribute("data-room")
      });
    });
  });
}

/* ================== OPEN SESSION ================== */
function openOpenModal() {
  if (!openModal) return;

  fTeacher.value = "";
  fRoom.value = "";
  fSubject.value = "";
  fNote.value = "";

  openModal.classList.add("show");
  openModal.setAttribute("aria-hidden", "false");

  setTimeout(() => fTeacher?.focus(), 0);
}

function closeOpenModal() {
  if (!openModal) return;
  openModal.classList.remove("show");
  openModal.setAttribute("aria-hidden", "true");
}

async function onOpenSession() {
  const teacher = (fTeacher.value || "").trim();
  const room    = (fRoom.value || "").trim();
  let subject   = (fSubject.value || "").trim();
  const note    = (fNote.value || "").trim();

  if (!teacher) return toast("กรอก TEACHER_ID/อีเมลครูก่อน");
  if (!room) return toast("กรอก ROOM ก่อน");
  if (!subject) return toast("กรอก SUBJECT ก่อน");

  // NOTE ฝั่ง GAS ยังไม่มีคอลัมน์ note → ใส่ต่อท้าย subject ให้ไม่หาย
  if (note) subject = `${subject} (${note})`;

  openSave.disabled = true;
  openSave.textContent = "กำลังเปิดคาบ...";

  try {
    const res = await callApi({
      action: ACTION_OPEN,
      teacherEmail: teacher, // ฝั่ง GAS ใช้ teacherEmail หรือ teacherId ก็ได้ (มันเอาไปใส่คอลัมน์ TEACHER_EMAIL)
      teacherId: teacher,
      subject,
      room
    });

    if (res?.success === false) throw new Error(res?.message || "open failed");

    toast("เปิดคาบเรียบร้อย");
    closeOpenModal();
    await loadSessions();
    render();
  } catch (err) {
    console.error(err);
    toast("เปิดคาบไม่สำเร็จ");
  } finally {
    openSave.disabled = false;
    openSave.textContent = "เปิดคาบ";
  }
}

/* ================== CLOSE SESSION ================== */
function openCloseConfirm(info) {
  closingTarget = info;
  if (closeSummary) {
    closeSummary.textContent = `${info.subject || "-"} • ห้อง ${info.room || "-"} • TOKEN ${info.token || "-"}`;
  }
  closeModal?.classList.add("show");
  closeModal?.setAttribute("aria-hidden", "false");
}

function closeCloseModal() {
  closingTarget = null;
  closeModal?.classList.remove("show");
  closeModal?.setAttribute("aria-hidden", "true");
}

async function onConfirmClose() {
  if (!closingTarget?.sessionId) return;

  closeConfirm.disabled = true;
  closeConfirm.textContent = "กำลังปิดคาบ...";

  try {
    const res = await callApi({
      action: ACTION_CLOSE,
      sessionId: closingTarget.sessionId
    });

    if (res?.success === false) throw new Error(res?.message || "close failed");

    toast("ปิดคาบเรียบร้อย");
    closeCloseModal();
    await loadSessions();
    render();
  } catch (err) {
    console.error(err);
    toast("ปิดคาบไม่สำเร็จ");
  } finally {
    closeConfirm.disabled = false;
    closeConfirm.textContent = "ยืนยันปิดคาบ";
  }
}

/* ================== EXPORT ================== */
async function exportCsv() {
  btnExport.disabled = true;
  btnExport.textContent = "กำลังส่งออก...";

  try {
    const res = await callApi({ action: ACTION_EXPORT });
    const csv = res?.csv || res?.data?.csv || "";

    if (!csv) throw new Error("no csv");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sessions_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    toast("Export CSV แล้ว");
  } catch (err) {
    console.error(err);
    toast("Export ไม่สำเร็จ");
  } finally {
    btnExport.disabled = false;
    btnExport.textContent = "Export CSV";
  }
}

/* ================== LOGOUT ================== */
function hardLogout() {
  // ล้างทุก key ที่เหมือน admin
  const kill = (store) => {
    const keys = Object.keys(store || {});
    keys.forEach(k => {
      if (String(k).toLowerCase().includes("admin")) store.removeItem(k);
    });
  };
  kill(localStorage);
  kill(sessionStorage);

  location.href = new URL("./login.html", location.href).toString();
}

/* ================== UTILS ================== */
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
  }
  return "";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function toast(text) {
  if (msgEl) msgEl.textContent = text;
}
