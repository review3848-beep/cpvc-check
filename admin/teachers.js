import { callApi } from "../api.js";

/* ===== DOM ===== */
const tbody = document.getElementById("tbody");
const q = document.getElementById("q");
const msgEl = document.getElementById("msg");
const countEl = document.getElementById("count");

const btnAdd = document.getElementById("btnAdd");
const btnExport = document.getElementById("btnExport");
const btnLogout = document.getElementById("btnLogout");

/* modal */
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const btnClose = document.getElementById("btnClose");
const btnCancel = document.getElementById("btnCancel");
const btnSave = document.getElementById("btnSave");

/* fields */
const fId = document.getElementById("fId");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fPass = document.getElementById("fPass");

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
const ACTION_LIST = "adminGetTeachers";
const ACTION_UPSERT = "adminUpsertTeacher";
const ACTION_DELETE = "adminDeleteTeacher";
const ACTION_EXPORT = "adminExportTeachers";

/**
 * รองรับ callApi ได้ 2 แบบ:
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
  btnExport?.addEventListener("click", onExport);

  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  q?.addEventListener("input", render);
  btnSave?.addEventListener("click", onSave);

  btnLogout?.addEventListener("click", () => {
    // ลบ session แบบกวาด ๆ (กัน key ชื่อแปลก)
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
  const keyword = (q?.value || "").trim().toLowerCase();

  const filtered = !keyword ? rows : rows.filter(r => {
    const id = String(getTeacherId(r)).toLowerCase();
    const name = String(getName(r)).toLowerCase();
    const email = String(getEmail(r)).toLowerCase();
    return id.includes(keyword) || name.includes(keyword) || email.includes(keyword);
  });

  // count pill
  if (countEl) countEl.textContent = `${filtered.length} รายการ`;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="5">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const id = esc(getTeacherId(r));
    const name = esc(getName(r));
    const email = esc(getEmail(r));
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
      const row = rows.find(r => String(getTeacherId(r)) === String(id));
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
    modalTitle.textContent = "เพิ่มครู";
    fId.value = "";
    fName.value = "";
    fEmail.value = "";
    fPass.value = "";
    fId.disabled = false;
  } else {
    editingId = String(getTeacherId(row));
    modalTitle.textContent = "แก้ไขครู";
    fId.value = editingId;
    fName.value = String(getName(row) || "");
    fEmail.value = String(getEmail(row) || "");
    fPass.value = "";
    fId.disabled = true;
  }

  modal.classList.add("show");
  setTimeout(() => (fId.disabled ? fName.focus() : fId.focus()), 0);
}

function closeModal() {
  modal.classList.remove("show");
}

/* ================== SAVE ================== */
async function onSave() {
  const teacherId = (fId.value || "").trim();
  const name = (fName.value || "").trim();
  const email = (fEmail.value || "").trim();
  const password = (fPass.value || "").trim();

  const isEdit = !!editingId;

  // เพิ่มครู: id ว่างได้ (ระบบสร้างให้เอง) → แต่ name/email ต้องมี
  if (!name) { toast("กรอกชื่อครูก่อน"); fName.focus(); return; }
  if (!email) { toast("กรอกอีเมลก่อน"); fEmail.focus(); return; }

  const payload = {
    // ส่งทั้งแบบ key เผื่อหัวตารางต่างกัน
    teacherId: teacherId || undefined,
    TEACHER_ID: teacherId || undefined,
    id: teacherId || undefined,

    NAME: name,
    name,

    EMAIL: email,
    email
  };

  // ✅ password เป็น optional ทั้ง add/edit (ไม่กรอก = ไม่ส่งไป)
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
  if (!id) return;
  const ok = confirm(`ลบครู ID: ${id} ?`);
  if (!ok) return;

  toast("กำลังลบ...");
  try {
    const res = await apiCall(ACTION_DELETE, {
      teacherId: id,
      TEACHER_ID: id,
      id
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
  btnExport.disabled = true;
  btnExport.textContent = "กำลัง Export...";
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
    btnExport.disabled = false;
    btnExport.textContent = "Export CSV";
  }
}

/* ================== MAPPERS ================== */
function getTeacherId(r) {
  return String(r?.TEACHER_ID ?? r?.teacherId ?? r?.id ?? r?.UID ?? "").trim();
}
function getName(r) {
  return String(r?.NAME ?? r?.name ?? "").trim();
}
function getEmail(r) {
  return String(r?.EMAIL ?? r?.email ?? "").trim();
}
function getCreatedAt(r) {
  const v = r?.CREATED_AT ?? r?.createdAt ?? r?.timestamp ?? r?.เวลา ?? "";
  return String(v || "").trim();
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
