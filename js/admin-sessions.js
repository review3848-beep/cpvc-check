// ../js/admin-sessions.js
import { callApi } from "../api.js";

/* ================== CONFIG: ตรงกับ GS ของคุณ ================== */
const ACTIONS = {
  list:   "adminGetSessions",        // ✅ doGet (GS ของคุณมี)
  open:   "adminOpenSession",        // ✅ doPost
  close:  "adminCloseSession",       // ✅ doPost
  export: "adminExportSessions"      // ✅ doPost (หรือ fallback export หน้าเว็บ)
};

/* ================= DOM ================= */
const tbody     = document.getElementById("tbody");
const q         = document.getElementById("q");
const countEl   = document.getElementById("count");
const msgEl     = document.getElementById("msg");

const btnLogout = document.getElementById("btnLogout");
const btnExport = document.getElementById("btnExport");
const btnOpen   = document.getElementById("btnOpen");

/* open modal */
const openModal  = document.getElementById("openModal");
const openClose  = document.getElementById("openClose");
const openCancel = document.getElementById("openCancel");
const openSave   = document.getElementById("openSave");

const fTeacher = document.getElementById("fTeacher"); // ใน UI เขียน TEACHER_ID แต่ GS ใช้ TEACHER_EMAIL -> รองรับทั้งคู่
const fRoom    = document.getElementById("fRoom");
const fSubject = document.getElementById("fSubject");
const fNote    = document.getElementById("fNote");

/* close modal */
const closeModal   = document.getElementById("closeModal");
const closeClose   = document.getElementById("closeClose");
const closeCancel  = document.getElementById("closeCancel");
const closeConfirm = document.getElementById("closeConfirm");
const closeSummary = document.getElementById("closeSummary");

/* ================= STATE ================= */
let rows = [];
let filteredCache = [];
let closingSessionId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const admin = guardAdmin();
  if(!admin) return;

  bindEvents();
  await loadSessions();
  applyFilter();
}

/* ================= GUARD ================= */
function guardAdmin(){
  // รองรับหลาย key กัน “เด้งล็อกอิน” เพราะชื่อ key ไม่ตรง
  const keys = ["adminSession","admin","admin_session","sessionAdmin","adminAuth"];
  let raw = null;

  for(const k of keys){
    raw = localStorage.getItem(k);
    if(raw) break;
  }

  if(!raw){
    location.href = "./login.html";
    return null;
  }

  try{
    return JSON.parse(raw);
  }catch{
    return { token: raw };
  }
}

/* ================= EVENTS ================= */
function bindEvents(){
  btnLogout?.addEventListener("click", () => {
    ["adminSession","admin","admin_session","sessionAdmin","adminAuth"].forEach(k => localStorage.removeItem(k));
    location.href = "./login.html";
  });

  q?.addEventListener("input", applyFilter);

  btnOpen?.addEventListener("click", openOpenModal);
  openClose?.addEventListener("click", closeOpenModal);
  openCancel?.addEventListener("click", closeOpenModal);
  openSave?.addEventListener("click", onOpenSave);

  closeClose?.addEventListener("click", closeCloseModal);
  closeCancel?.addEventListener("click", closeCloseModal);
  closeConfirm?.addEventListener("click", onCloseConfirm);

  btnExport?.addEventListener("click", onExport);

  document.addEventListener("keydown", (e) => {
    if(e.key !== "Escape") return;
    if(openModal?.classList.contains("show")) closeOpenModal();
    if(closeModal?.classList.contains("show")) closeCloseModal();
  });

  openModal?.addEventListener("click", (e) => { if(e.target === openModal) closeOpenModal(); });
  closeModal?.addEventListener("click", (e) => { if(e.target === closeModal) closeCloseModal(); });
}

/* ================= DATA ================= */
async function loadSessions(){
  setMsg("กำลังโหลดคาบเรียน…");

  try{
    const res = await callApi(ACTIONS.list, {});
    if(!res?.success) throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");

    // GS adminGetList_ คืน { success:true, headers, rows }
    // rows เป็น array ของ object (key ตามหัวตาราง) + __row
    const list = res.rows || res.data || res.sessions || [];
    rows = normalizeSessions(list);
    setMsg("");

  }catch(err){
    rows = [];
    setMsg(`โหลดข้อมูลไม่สำเร็จ: ${err.message || err}`);
  }
}

function normalizeSessions(list){
  // ชีตคุณ: ID, TEACHER_EMAIL, SUBJECT, ROOM, TOKEN, STATUS, START_TIME
  return list.map((s) => ({
    sessionId:  s.sessionId ?? s.ID ?? s.SESSION_ID ?? s.id ?? s.session_id ?? "",
    token:      s.token ?? s.TOKEN ?? s.sessionToken ?? s.session_token ?? "",
    subject:    s.subject ?? s.SUBJECT ?? "",
    room:       s.room ?? s.ROOM ?? "",
    teacherId:  s.teacherId ?? s.TEACHER_ID ?? s.TEACHER_EMAIL ?? s.teacher ?? s.teacher_id ?? "",
    teacherName:s.teacherName ?? s.TEACHER_NAME ?? "",
    status:     (s.status ?? s.STATUS ?? "").toString().toLowerCase(), // open/closed
    createdAt:  s.createdAt ?? s.CREATED_AT ?? s.created_at ?? s.START_TIME ?? s.startTime ?? s.start_time ?? "",
    note:       s.note ?? s.NOTE ?? ""
  }));
}

/* ================= FILTER + RENDER ================= */
function applyFilter(){
  const text = (q?.value || "").trim().toLowerCase();

  filteredCache = !text
    ? [...rows]
    : rows.filter((r) => {
        const hay = [
          r.sessionId, r.token, r.subject, r.room,
          r.teacherId, r.teacherName, r.status, r.createdAt, r.note
        ].join(" ").toLowerCase();
        return hay.includes(text);
      });

  renderTable(filteredCache);
  if(countEl) countEl.textContent = `${filteredCache.length} รายการ`;
}

function renderTable(list){
  if(!tbody) return;

  if(!list.length){
    tbody.innerHTML = `<tr><td class="empty" colspan="6">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((r) => {
    const teacherText =
      (r.teacherName ? `${escapeHtml(r.teacherName)} ` : "") +
      (r.teacherId ? `<span class="muted mono">(${escapeHtml(r.teacherId)})</span>` : `<span class="muted">—</span>`);

    const subRoom = `${escapeHtml(r.subject || "—")} <span class="muted">/</span> <span class="mono">${escapeHtml(r.room || "—")}</span>`;

    const st = (r.status === "open" || r.status === "opened" || r.status === "active") ? "open"
             : (r.status === "closing") ? "closing"
             : "closed";

    const statusBadge =
      st === "open"
        ? `<span class="status status--open"><span class="dot"></span>OPEN</span>`
        : st === "closing"
        ? `<span class="status status--closing"><span class="dot"></span>CLOSING</span>`
        : `<span class="status status--closed"><span class="dot"></span>CLOSED</span>`;

    return `
      <tr>
        <td data-label="SESSION_ID" class="mono">${escapeHtml(r.sessionId || "—")}</td>
        <td data-label="TOKEN" class="mono nowrap">
          ${escapeHtml(r.token || "—")}
          <button class="btn" data-act="copy" data-token="${escapeAttr(r.token || "")}" type="button" style="margin-left:8px;">Copy</button>
        </td>
        <td data-label="SUBJECT / ROOM">${subRoom}</td>
        <td data-label="TEACHER">${teacherText}</td>
        <td data-label="STATUS">${statusBadge}</td>
        <td data-label="ACTIONS">
          <div class="right">
            <button class="${st === "open" ? "btn btn--danger" : "btn"}"
                    data-act="close"
                    data-id="${escapeAttr(r.sessionId)}"
                    ${st !== "open" ? "disabled" : ""} type="button">ปิดคาบ</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const act = e.currentTarget.getAttribute("data-act");

      if(act === "copy"){
        const token = e.currentTarget.getAttribute("data-token") || "";
        copyText(token);
        toast("คัดลอก TOKEN แล้ว");
      }

      if(act === "close"){
        const id = e.currentTarget.getAttribute("data-id");
        if(!id) return;
        openCloseConfirm(id);
      }
    });
  });
}

/* ================= OPEN SESSION ================= */
function openOpenModal(){
  openModal?.classList.add("show");
  openModal?.setAttribute("aria-hidden", "false");
  fTeacher?.focus();
}

function closeOpenModal(){
  openModal?.classList.remove("show");
  openModal?.setAttribute("aria-hidden", "true");
  fTeacher.value = "";
  fRoom.value = "";
  fSubject.value = "";
  fNote.value = "";
}

async function onOpenSave(){
  const teacherRaw = (fTeacher.value || "").trim();
  const room       = (fRoom.value || "").trim();
  const subject    = (fSubject.value || "").trim();
  const note       = (fNote.value || "").trim();

  if(!teacherRaw || !room || !subject){
    toast("กรอก TEACHER_ID/EMAIL, ROOM, SUBJECT ให้ครบ");
    return;
  }

  openSave.disabled = true;
  setMsg("กำลังเปิดคาบ…");

  try{
    // GS ของคุณ adminOpenSession_ รองรับ teacherEmail หรือ teacherId
    const isEmail = teacherRaw.includes("@");
    const payload = isEmail
      ? { teacherEmail: teacherRaw, room, subject, note }
      : { teacherId: teacherRaw, room, subject, note };

    const res = await callApi(ACTIONS.open, payload);
    if(!res?.success) throw new Error(res?.message || "เปิดคาบไม่สำเร็จ");

    toast("เปิดคาบแล้ว");
    closeOpenModal();

    await loadSessions();
    applyFilter();
    setMsg("");

  }catch(err){
    setMsg(`เปิดคาบไม่สำเร็จ: ${err.message || err}`);
  }finally{
    openSave.disabled = false;
  }
}

/* ================= CLOSE SESSION ================= */
function openCloseConfirm(sessionId){
  closingSessionId = sessionId;

  const row = rows.find(r => r.sessionId === sessionId);
  const token = row?.token ? `TOKEN: ${row.token}` : "TOKEN: —";
  const info  = row ? `${row.subject || "—"} / ${row.room || "—"} • ${row.teacherId || "—"}` : "—";

  if(closeSummary) closeSummary.textContent = `${sessionId} • ${token} • ${info}`;

  closeModal?.classList.add("show");
  closeModal?.setAttribute("aria-hidden", "false");
  closeConfirm?.focus();
}

function closeCloseModal(){
  closeModal?.classList.remove("show");
  closeModal?.setAttribute("aria-hidden", "true");
  closingSessionId = null;
}

async function onCloseConfirm(){
  if(!closingSessionId) return;

  closeConfirm.disabled = true;
  setMsg("กำลังปิดคาบ…");

  try{
    // GS close รองรับ sessionId หรือ id
    const res = await callApi(ACTIONS.close, { sessionId: closingSessionId });
    if(!res?.success) throw new Error(res?.message || "ปิดคาบไม่สำเร็จ");

    toast("ปิดคาบแล้ว");
    closeCloseModal();

    await loadSessions();
    applyFilter();
    setMsg("");

  }catch(err){
    setMsg(`ปิดคาบไม่สำเร็จ: ${err.message || err}`);
  }finally{
    closeConfirm.disabled = false;
  }
}

/* ================= EXPORT ================= */
async function onExport(){
  try{
    const res = await callApi(ACTIONS.export, {});
    if(res?.success && res.csv){
      downloadText(res.csv, `sessions_${stamp()}.csv`, "text/csv;charset=utf-8;");
      toast("Export CSV แล้ว");
      return;
    }
  }catch{ /* fallback */ }

  const list = filteredCache?.length ? filteredCache : rows;
  const headers = ["ID","TEACHER_EMAIL","SUBJECT","ROOM","TOKEN","STATUS","START_TIME"];
  const csv = [
    headers.join(","),
    ...list.map(r => [
      csvCell(r.sessionId),
      csvCell(r.teacherId),
      csvCell(r.subject),
      csvCell(r.room),
      csvCell(r.token),
      csvCell((r.status || "").toUpperCase()),
      csvCell(r.createdAt),
    ].join(","))
  ].join("\n");

  downloadText(csv, `sessions_${stamp()}.csv`, "text/csv;charset=utf-8;");
  toast("Export CSV แล้ว");
}

/* ================= HELPERS ================= */
function setMsg(text){
  if(!msgEl) return;
  msgEl.textContent = text || "";
}
function toast(text){
  setMsg(text);
  if(text){
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setMsg(""), 2400);
  }
}
function copyText(text){
  if(!text) return;
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  });
}
function downloadText(content, filename, mime){
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function stamp(){
  const d = new Date();
  const pad = (n) => String(n).padStart(2,"0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function csvCell(v){
  const s = (v ?? "").toString();
  return `"${s.replaceAll('"','""')}"`;
}
function escapeHtml(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(s){ return escapeHtml(s); }
