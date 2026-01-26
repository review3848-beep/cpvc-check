import { callApi } from "../api.js";

/* ===== DOM ===== */
const tbody = document.getElementById("tbody");
const q = document.getElementById("q");
const msgEl = document.getElementById("msg");
const btnAdd = document.getElementById("btnAdd");

/* modal */
const modal = document.getElementById("studentModal");
const modalTitle = document.getElementById("modalTitle");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancel = document.getElementById("btnCancel");
const btnSave = document.getElementById("btnSave");

/* fields */
const fId = document.getElementById("fId");
const fName = document.getElementById("fName");
const fPass = document.getElementById("fPass");
const passField = fPass?.closest(".field") || fPass?.parentElement;

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

/* ================== INIT ================== */
async function init() {
  const admin = guardAdmin();
  if (!admin) return;

  wireEvents();
  await loadStudents();
  render();
}

/* ================== EVENTS ================== */
function wireEvents() {
  btnAdd?.addEventListener("click", () => openModal("add"));
  btnCloseModal?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  q?.addEventListener("input", () => render());
  btnSave?.addEventListener("click", onSave);
}

/* ================== API ACTIONS ================== */
const ACTION_LIST = "adminGetStudents";
const ACTION_UPSERT = "adminUpsertStudent";

/* ================== LOAD ================== */
async function loadStudents() {
  msgEl.textContent = "กำลังโหลด...";
  try {
    const res = await callApi({ action: ACTION_LIST });
    rows = Array.isArray(res?.rows) ? res.rows
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res) ? res
      : [];

    msgEl.textContent = rows.length ? `พบ ${rows.length} รายการ` : "ยังไม่มีข้อมูล";
  } catch (err) {
    console.error(err);
    msgEl.textContent = "โหลดข้อมูลไม่สำเร็จ";
    rows = [];
  }
}

/* ================== RENDER ================== */
function render() {
  const keyword = (q?.value || "").trim().toLowerCase();

  const filtered = !keyword ? rows : rows.filter(r => {
    const id = String(r.STUDENT_ID ?? r.studentId ?? r.id ?? r.UID ?? "").toLowerCase();
    const name = String(r.NAME ?? r.name ?? "").toLowerCase();
    return id.includes(keyword) || name.includes(keyword);
  });

  tbody.innerHTML = filtered.map((r) => {
    const id = esc(String(r.STUDENT_ID ?? r.studentId ?? r.id ?? r.UID ?? ""));
    const name = esc(String(r.NAME ?? r.name ?? ""));
    return `
      <tr>
        <td>${id}</td>
        <td>${name}</td>
        <td>
          <div class="row-actions">
            <button class="btn-mini" data-edit="${id}">แก้ไข</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const row = rows.find(r => String(r.STUDENT_ID ?? r.studentId ?? r.id ?? r.UID ?? "") === String(id));
      openModal("edit", row);
    });
  });

  msgEl.textContent = filtered.length
    ? `แสดง ${filtered.length} จาก ${rows.length} รายการ`
    : "ไม่พบข้อมูลตามที่ค้นหา";
}

/* ================== MODAL ================== */
function openModal(mode, row = null) {
  const isAdd = (mode === "add");

  if (isAdd) {
    editingId = null;
    modalTitle.textContent = "เพิ่มนักเรียน";
    fId.value = "";
    fName.value = "";
    fPass.value = "";
    fId.disabled = false;

    if (passField) passField.style.display = "none";
  } else {
    editingId = String(row?.STUDENT_ID ?? row?.studentId ?? row?.id ?? row?.UID ?? "");
    modalTitle.textContent = "แก้ไขนักเรียน";
    fId.value = editingId;
    fName.value = String(row?.NAME ?? row?.name ?? "");
    fPass.value = "";
    fId.disabled = true;

    if (passField) passField.style.display = "";
  }

  modal.hidden = false;
  setTimeout(() => (fId.disabled ? fName.focus() : fId.focus()), 0);
}

function closeModal() {
  modal.hidden = true;
}

/* ================== SAVE ================== */
async function onSave() {
  const studentId = (fId.value || "").trim();
  const name = (fName.value || "").trim();
  const password = (fPass.value || "").trim();

  if (!studentId) { toast("กรอกรหัสนักเรียนก่อน"); fId.focus(); return; }
  if (!name) { toast("กรอกชื่อ-นามสกุลก่อน"); fName.focus(); return; }

  const isEdit = !!editingId;

  const payload = {
    action: ACTION_UPSERT,
    studentId,
    STUDENT_ID: studentId,
    NAME: name,
    name,
  };

  if (isEdit && password) payload.password = password;

  btnSave.disabled = true;
  btnSave.textContent = "กำลังบันทึก...";
  try {
    const res = await callApi(payload);
    if (res?.success === false) throw new Error(res?.message || "save failed");

    toast("บันทึกเรียบร้อย");
    closeModal();
    await loadStudents();
    render();
  } catch (err) {
    console.error(err);
    toast("บันทึกไม่สำเร็จ");
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "บันทึก";
  }
}

/* ================== UTILS ================== */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function toast(text) {
  if (msgEl) msgEl.textContent = text;
}
