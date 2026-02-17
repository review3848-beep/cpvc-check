import { callApi } from "../api.js";

/* ================== DOM ================== */
const tbody = document.getElementById("tbody");
const q = document.getElementById("q");
const msgEl = document.getElementById("msg");
const btnAdd = document.getElementById("btnAdd");

/* modal (ของ HTML คุณ) */
const modal = document.getElementById("teacherModal");
const modalTitle = document.getElementById("modalTitle");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancel = document.getElementById("btnCancel");
const btnSave = document.getElementById("btnSave");

/* fields */
const fId = document.getElementById("fId");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fPass = document.getElementById("fPass");

/* ================== STATE ================== */
let rows = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", init);

/* ================== API CONFIG ================== */
const ACTION_LIST = "adminGetTeachers";
const ACTION_UPSERT = "adminUpsertTeacher";
const ACTION_DELETE = "adminDeleteTeacher";

/**
 * ✅ รองรับ callApi 2 แบบ:
 * 1) callApi("actionString", payloadObj)
 * 2) callApi({ action:"...", ...payloadObj })
 */
async function apiCall(action, payload = {}) {
  try {
    return await callApi(action, payload);
  } catch (e) {
    return await callApi({ action, ...payload });
  }
}

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

/* ================== INIT ================== */
async function init() {
  const admin = guardAdmin();
  if (!admin) return;

  wireEvents();
  await loadTeachers();
  render();
}

/* ================== EVENTS ================== */
function wireEvents() {
  btnAdd?.addEventListener("click", () => openModal("add"));
  btnCloseModal?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  // คลิกพื้นหลังปิด modal
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  q?.addEventListener("input", render);
  btnSave?.addEventListener("click", onSave);
}

/* ================== LOAD ================== */
async function loadTeachers() {
  toast("กำลังโหลด...");
  try {
    const res = await apiCall(ACTION_LIST, {});

    rows = Array.isArray(res?.rows) ? res.rows
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res?.teachers) ? res.teachers
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
  const keyword = (q?.value || "").trim().toLowerCase();

  const filtered = !keyword ? rows : rows.filter(r => {
    const id = getTeacherId(r).toLowerCase();
    const name = getName(r).toLowerCase();
    const email = getEmail(r).toLowerCase();
    return id.includes(keyword) || name.includes(keyword) || email.includes(keyword);
  });

  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="4">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const id = esc(getTeacherId(r));
    const name = esc(getName(r));
    const email = esc(getEmail(r));

    return `
      <tr>
        <td class="mono nowrap" data-label="TEACHER_ID">${id || "-"}</td>
        <td data-label="NAME">${name || "-"}</td>
        <td class="mono" data-label="EMAIL">${email || "-"}</td>
        <td data-label="ACTIONS">
          <div class="row-actions">
            <button class="btn-mini" data-edit="${id}">แก้ไข</button>
            <button class="btn-mini" data-del="${id}">ลบ</button>
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
function openModal(mode, row = null) {
  const isAdd = (mode === "add");

  if (isAdd) {
    editingId = null;
    if (modalTitle) modalTitle.textContent = "เพิ่มครู";

    fId && (fId.value = "");
    fName && (fName.value = "");
    fEmail && (fEmail.value = "");
    fPass && (fPass.value = "");

    if (fId) fId.disabled = false;
  } else {
    editingId = getTeacherId(row);
    if (modalTitle) modalTitle.textContent = "แก้ไขครู";

    if (fId) { fId.value = editingId; fId.disabled = true; }
    if (fName) fName.value = getName(row);
    if (fEmail) fEmail.value = getEmail(row);
    if (fPass) fPass.value = "";
  }

  if (modal) modal.hidden = false;
  setTimeout(() => (fId?.disabled ? fName?.focus() : fId?.focus()), 0);
}

function closeModal() {
  if (modal) modal.hidden = true;
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

    name,
    NAME: name,

    email,
    EMAIL: email
  };

  // ✅ ส่งรหัสผ่านเฉพาะตอนกรอก
  if (password) payload.password = password;

  btnSave.disabled = true;
  btnSave.textContent = "กำลังบันทึก...";

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
    btnSave.disabled = false;
    btnSave.textContent = "บันทึก";
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

/* ================== MAPPERS ================== */
function safeStr(v) {
  if (v === undefined || v === null) return "";
  const s = String(v);
  return s === "undefined" ? "" : s;
}
function getTeacherId(r) {
  return safeStr(r?.TEACHER_ID ?? r?.teacherId ?? r?.id ?? r?.UID ?? "").trim();
}
function getName(r) {
  return safeStr(r?.NAME ?? r?.name ?? "").trim();
}
function getEmail(r) {
  return safeStr(r?.EMAIL ?? r?.email ?? "").trim();
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
