import { callApi } from "../api.js";

/* ================== DOM (safe) ================== */
const $ = (id) => document.getElementById(id);

/** หา element จากหลาย id (กัน html ใช้ชื่อไม่ตรงกับ js) */
function pickEl(...ids) {
  for (const id of ids) {
    const el = $(id);
    if (el) return el;
  }
  return null;
}

/* table + search */
const tbody   = pickEl("tbody");
const q       = pickEl("q", "search", "keyword");
const msgEl   = pickEl("msg", "message");
const countEl = pickEl("count", "countEl");

/* buttons */
const btnAdd    = pickEl("btnAdd", "addBtn");
const btnExport = pickEl("btnExport", "exportBtn");
const btnLogout = pickEl("btnLogout", "logoutBtn");

/* modal */
const modal      = pickEl("modal", "teacherModal");
const modalTitle = pickEl("modalTitle");
const btnClose   = pickEl("btnClose", "btnCloseModal");
const btnCancel  = pickEl("btnCancel");
const btnSave    = pickEl("btnSave");

/* fields (fallback หลายชื่อ) */
const fId    = pickEl("fId", "teacherId", "id", "TEACHER_ID");
const fName  = pickEl("fName", "name", "teacherName", "NAME");
const fEmail = pickEl("fEmail", "email", "teacherEmail", "EMAIL");
const fPass  = pickEl("fPass", "password", "pass", "PASSWORD");

let rows = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", init);

/* ================== GUARD ================== */
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
    location.href = "./login.html";
    return null;
  }

  try { return JSON.parse(raw); }
  catch { return { token: raw }; }
}

/* ================== API ================== */
const ACTION_LIST   = "adminGetTeachers";
const ACTION_UPSERT = "adminUpsertTeacher";
const ACTION_DELETE = "adminDeleteTeacher";
const ACTION_EXPORT = "adminExportTeachers";

/** รองรับ callApi ได้ 2 แบบ */
async function apiCall(action, payload = {}) {
  try {
    return await callApi(action, payload);
  } catch {
    return await callApi({ action, ...payload });
  }
}

/* ================== INIT ================== */
async function init() {
  const admin = guardAdmin();
  if (!admin) return;

  // ถ้า field สำคัญไม่เจอ ให้เตือนเลย (แต่ไม่ทำให้หน้า crash)
  if (!tbody) console.warn("Missing #tbody in HTML");
  if (!modal) console.warn("Missing #modal/#teacherModal in HTML");
  if (!btnSave) console.warn("Missing #btnSave in HTML");
  if (!fName || !fEmail) {
    console.warn("Missing form fields:", { fId, fName, fEmail, fPass });
    toast("ฟอร์ม HTML ยังใช้ id ไม่ตรงกับ JS (แต่ฉันกัน crash ให้แล้ว)");
  }

  wireEvents();
  await loadTeachers();
  render();
}

/* ================== EVENTS ================== */
function wireEvents() {
  btnAdd?.addEventListener("click", () => openModal("add"));
  btnExport?.addEventListener("click", onExport);

  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  q?.addEventListener("input", render);
  btnSave?.addEventListener("click", onSave);

  btnLogout?.addEventListener("click", () => {
    const keys = [...Object.keys(localStorage || {}), ...Object.keys(sessionStorage || {})];
    keys.filter(k => String(k).toLowerCase().includes("admin"))
      .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });

    location.href = "./login.html";
  });
}

/* ================== LOAD ================== */
async function loadTeachers() {
  toast("กำลังโหลด...");
  try {
    const res = await apiCall(ACTION_LIST, {});
    rows = Array.isArray(res?.rows) ? res.rows
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res) ? res
      : [];

    toast(rows.length ? `พบ ${rows.length} รายการ` : "ยังไม่มีข้อมูล");
  } catch (err) {
    console.error(err);
    rows = [];
    toast("โหลดข้อมูลไม่สำเร็จ");
  }
}

/* ================== RENDER ================== */
function render() {
  if (!tbody) return;

  const keyword = (q?.value || "").trim().toLowerCase();

  const filtered = !keyword ? rows : rows.filter(r => {
    const id    = getTeacherId(r).toLowerCase();
    const name  = getName(r).toLowerCase();
    const email = getEmail(r).toLowerCase();
    return id.includes(keyword) || name.includes(keyword) || email.includes(keyword);
  });

  if (countEl) countEl.textContent = `${filtered.length} รายการ`;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="5">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const id        = esc(getTeacherId(r));
    const name      = esc(getName(r));
    const email     = esc(getEmail(r));
    const createdAt = esc(getCreatedAt(r));

    return `
      <tr>
        <td class="mono nowrap" data-label="TEACHER_ID">${id}</td>
        <td data-label="NAME">${name}</td>
        <td class="mono" data-label="EMAIL">${email}</td>
        <td class="muted nowrap" data-label="CREATED_AT">${createdAt}</td>
        <td data-label="ACTIONS">
          <div class="right">
            <button class="btn btn--ghost" data-edit="${id}" type="button">แก้ไข</button>
            <button class="btn btn--danger" data-del="${id}" type="button">ลบ</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const row = rows.find(r => getTeacherId(r) === String(id));
      openModal("edit", row);
    });
  });

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      await onDelete(id);
    });
  });
}

/* ================== MODAL ================== */
function setVal(el, v) {
  if (!el) return;
  el.value = (v == null) ? "" : String(v);
}

function openModal(mode, row = null) {
  const isAdd = (mode === "add");

  if (!modal) { toast("หา modal ไม่เจอ (id ไม่ตรง)"); return; }

  if (isAdd) {
    editingId = null;
    if (modalTitle) modalTitle.textContent = "เพิ่มครู";

    setVal(fId, "");
    setVal(fName, "");
    setVal(fEmail, "");
    setVal(fPass, "");

    if (fId) fId.disabled = false;
  } else {
    editingId = getTeacherId(row);
    if (modalTitle) modalTitle.textContent = "แก้ไขครู";

    setVal(fId, editingId);
    setVal(fName, getName(row));
    setVal(fEmail, getEmail(row));
    setVal(fPass, "");

    if (fId) fId.disabled = true;
  }

  modal.classList.add("show");
  setTimeout(() => {
    if (fId?.disabled) fName?.focus();
    else fId?.focus();
  }, 0);
}

function closeModal() {
  modal?.classList.remove("show");
}

/* ================== SAVE ================== */
async function onSave() {
  const teacherId = (fId?.value || "").trim();
  const name = (fName?.value || "").trim();
  const email = (fEmail?.value || "").trim();
  const password = (fPass?.value || "").trim();

  const isEdit = !!editingId;

  if (!name) { toast("กรอกชื่อครูก่อน"); fName?.focus(); return; }
  if (!email) { toast("กรอกอีเมลก่อน"); fEmail?.focus(); return; }

  const payload = {
    teacherId: teacherId || undefined,
    TEACHER_ID: teacherId || undefined,
    id: teacherId || undefined,

    NAME: name,
    name,

    EMAIL: email,
    email
  };

  if (password) payload.password = password;

  if (btnSave) { btnSave.disabled = true; btnSave.textContent = "กำลังบันทึก..."; }

  try {
    const res = await apiCall(ACTION_UPSERT, payload);
    if (res?.success === false) throw new Error(res?.message || "save failed");

    toast("บันทึกเรียบร้อย");
    closeModal();
    await loadTeachers();
    render();
  } catch (err) {
    console.error(err);
    toast(err?.message ? `บันทึกไม่สำเร็จ: ${err.message}` : "บันทึกไม่สำเร็จ");
  } finally {
    if (btnSave) { btnSave.disabled = false; btnSave.textContent = "บันทึก"; }
  }
}

/* ================== DELETE ================== */
async function onDelete(id) {
  const tid = String(id || "").trim();
  if (!tid) return;

  const ok = confirm(`ลบครู ID: ${tid} ?`);
  if (!ok) return;

  toast("กำลังลบ...");
  try {
    const res = await apiCall(ACTION_DELETE, {
      teacherId: tid,
      TEACHER_ID: tid,
      id: tid
    });
    if (res?.success === false) throw new Error(res?.message || "delete failed");

    toast("ลบแล้ว");
    await loadTeachers();
    render();
  } catch (err) {
    console.error(err);
    toast(err?.message ? `ลบไม่สำเร็จ: ${err.message}` : "ลบไม่สำเร็จ");
  }
}

/* ================== EXPORT ================== */
async function onExport() {
  if (btnExport) { btnExport.disabled = true; btnExport.textContent = "กำลัง Export..."; }

  try {
    const res = await apiCall(ACTION_EXPORT, {});
    const csv = res?.csv;
    if (!csv) throw new Error("ไม่พบข้อมูล CSV จากระบบ");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    toast("Export เรียบร้อย");
  } catch (err) {
    console.error(err);
    toast(err?.message ? `Export ไม่สำเร็จ: ${err.message}` : "Export ไม่สำเร็จ");
  } finally {
    if (btnExport) { btnExport.disabled = false; btnExport.textContent = "Export CSV"; }
  }
}

/* ================== MAPPERS (กัน "undefined") ================== */
function safeStr(v) {
  return (v == null || v === "undefined") ? "" : String(v);
}
function getTeacherId(r) {
  const v = r?.TEACHER_ID ?? r?.teacherId ?? r?.id ?? r?.UID ?? "";
  return safeStr(v).trim();
}
function getName(r) {
  const v = r?.NAME ?? r?.name ?? "";
  return safeStr(v).trim();
}
function getEmail(r) {
  const v = r?.EMAIL ?? r?.email ?? "";
  return safeStr(v).trim();
}
function getCreatedAt(r) {
  const v = r?.CREATED_AT ?? r?.createdAt ?? r?.timestamp ?? r?.เวลา ?? "";
  return safeStr(v).trim();
}

/* ================== UTILS ================== */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function toast(text) {
  if (msgEl) msgEl.textContent = text;
}
