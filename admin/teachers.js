// js/admin-teachers.js (ทับทั้งไฟล์)
import { callApi, getAdminSession, clearAllSession } from "../api.js";

/* ================= DOM ================= */
const tbody = document.getElementById("tbody");
const q = document.getElementById("q");
const countEl = document.getElementById("count");
const msg = document.getElementById("msg");

const btnAdd = document.getElementById("btnAdd");
const btnExport = document.getElementById("btnExport");
const btnLogout = document.getElementById("btnLogout");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const btnClose = document.getElementById("btnClose");
const btnCancel = document.getElementById("btnCancel");
const btnSave = document.getElementById("btnSave");

const fId = document.getElementById("fId");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fPass = document.getElementById("fPass");

/* ================= STATE ================= */
let rows = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", init);

/* ================= AUTH GUARD ================= */
function guardAdmin() {
  const admin = getAdminSession(); // localStorage key: "admin"
  if (!admin) {
    location.replace("./login.html");
    return null;
  }
  return admin;
}

/* ================= INIT ================= */
async function init() {
  const ses = guardAdmin();
  if (!ses) return;

  btnAdd?.addEventListener("click", () => openModal());
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  btnSave?.addEventListener("click", save);
  q?.addEventListener("input", render);
  btnExport?.addEventListener("click", exportCsv);

  btnLogout?.addEventListener("click", () => {
    // ล้าง session ให้หมด แล้วกลับ login
    localStorage.removeItem("admin");
    // เผื่อระบบอื่นใช้ร่วมกัน
    clearAllSession?.();
    location.replace("./login.html");
  });

  await load();
}

/* ================= LOAD ================= */
async function load() {
  setToast("กำลังโหลดข้อมูล…");
  setLoadingTable(true);

  try {
    const res = await callApi("adminGetTeachers", {});

    if (!res?.success) {
      setToast(res?.message || "โหลดไม่สำเร็จ");
      setEmpty("โหลดข้อมูลไม่สำเร็จ");
      return;
    }

    const rawRows = res.rows || res.data?.rows || res.data || res.list || [];
    rows = normalizeRows(rawRows);

    setToast("");
    render();
  } catch (e) {
    console.error(e);
    setToast("โหลดไม่สำเร็จ (เชื่อมต่อผิดพลาด)");
    setEmpty("เชื่อมต่อผิดพลาด");
  }
}

/* ================= NORMALIZE ================= */
function normalizeRows(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map((r) => {
    if (Array.isArray(r)) return { __raw: r };

    const o = { ...r };

    o.TEACHER_ID =
      o.TEACHER_ID ??
      o.teacherId ??
      o.TEACHERID ??
      o.id ??
      o.UID ??
      o.uid ??
      "";

    o.NAME =
      o.NAME ??
      o.name ??
      o.FullName ??
      o.fullname ??
      "";

    o.EMAIL =
      o.EMAIL ??
      o.email ??
      o.Mail ??
      "";

    o.PASSWORD =
      o.PASSWORD ??
      o.password ??
      "";

    o.CREATED_AT =
      o.CREATED_AT ??
      o.createdAt ??
      o.timestamp ??
      o.เวลา ??
      "";

    return o;
  });
}

/* ================= RENDER ================= */
function norm(v) {
  return String(v ?? "").toLowerCase().trim();
}

function render() {
  const key = norm(q?.value);

  const filtered = !key
    ? rows
    : rows.filter((r) => {
        return (
          norm(r.TEACHER_ID).includes(key) ||
          norm(r.NAME).includes(key) ||
          norm(r.EMAIL).includes(key)
        );
      });

  countEl.textContent = `${filtered.length} รายการ`;

  if (!filtered.length) {
    setEmpty(key ? "ไม่พบข้อมูลที่ตรงกับการค้นหา" : "ยังไม่มีข้อมูลครูในระบบ");
    return;
  }

  tbody.innerHTML = filtered
    .map((r) => {
      const id = esc(r.TEACHER_ID);
      const name = esc(r.NAME);
      const email = esc(r.EMAIL);
      const created = esc(r.CREATED_AT || "");

      return `
        <tr>
          <td data-label="TEACHER_ID" class="mono muted">${id}</td>
          <td data-label="NAME">${name}</td>
          <td data-label="EMAIL" class="muted">${email}</td>
          <td data-label="CREATED_AT" class="muted nowrap">${created}</td>
          <td data-label="ACTIONS">
            <div class="right">
              <button class="btn" data-edit="${id}" type="button">แก้ไข</button>
              <button class="btn btn--danger" data-del="${id}" type="button">ลบ</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-edit");
      const r = rows.find((x) => String(x.TEACHER_ID) === String(id));
      openModal(r);
    });
  });

  tbody.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", () => del(b.getAttribute("data-del")));
  });
}

/* ================= MODAL ================= */
function openModal(r = null) {
  editingId = r ? String(r.TEACHER_ID) : null;
  modalTitle.textContent = r ? "แก้ไขครู" : "เพิ่มครู";

  fId.value = r ? (r.TEACHER_ID || "") : "";
  // edit ห้ามเปลี่ยน id
  fId.disabled = !!r;

  fName.value = r ? (r.NAME || "") : "";
  fEmail.value = r ? (r.EMAIL || "") : "";
  fPass.value = "";

  modal.classList.add("show");
  // focus สวยๆ
  setTimeout(() => (fName?.focus?.()), 30);
}

function closeModal() {
  modal.classList.remove("show");
}

/* ================= CRUD ================= */
async function save() {
  const TEACHER_ID = fId.value.trim();
  const NAME = fName.value.trim();
  const EMAIL = fEmail.value.trim();
  const PASSWORD = fPass.value.trim();

  if (!NAME) return setToast("กรอกชื่อครู (NAME)");
  if (!EMAIL) return setToast("กรอกอีเมล (EMAIL)");
  if (!editingId && !PASSWORD) return setToast("เพิ่มครูต้องใส่รหัสผ่าน (PASSWORD)");

  btnSave.disabled = true;
  setToast("กำลังบันทึก…");

  try {
    const params = { TEACHER_ID, NAME, EMAIL };
    if (PASSWORD) params.PASSWORD = PASSWORD;

    const res = await callApi("adminUpsertTeacher", params);

    if (!res?.success) {
      setToast(res?.message || "บันทึกไม่สำเร็จ");
      return;
    }

    closeModal();
    await load();
    setToast("บันทึกแล้ว ✅");
  } catch (e) {
    console.error(e);
    setToast("บันทึกไม่สำเร็จ (เชื่อมต่อผิดพลาด)");
  } finally {
    btnSave.disabled = false;
  }
}

async function del(id) {
  if (!confirm(`ลบครู ${id} ?`)) return;

  setToast("กำลังลบ…");

  try {
    const res = await callApi("adminDeleteTeacher", { TEACHER_ID: id });
    if (!res?.success) {
      setToast(res?.message || "ลบไม่สำเร็จ");
      return;
    }

    await load();
    setToast("ลบแล้ว 🧹");
  } catch (e) {
    console.error(e);
    setToast("ลบไม่สำเร็จ (เชื่อมต่อผิดพลาด)");
  }
}

/* ================= EXPORT ================= */
function exportCsv() {
  const headers = ["TEACHER_ID", "NAME", "EMAIL", "PASSWORD", "CREATED_AT"];
  const lines = [headers.join(",")];

  rows.forEach((r) => {
    const row = headers.map((h) => csvCell(r[h] ?? ""));
    lines.push(row.join(","));
  });

  download(`teachers_${Date.now()}.csv`, lines.join("\n"));
  setToast("Export CSV ✅");
}

/* ================= UI HELPERS ================= */
function setToast(t) {
  msg.textContent = String(t || "");
}

function setEmpty(text) {
  tbody.innerHTML = `<tr><td class="empty" colspan="5">${esc(text)}</td></tr>`;
}

function setLoadingTable(on) {
  if (on) setEmpty("กำลังโหลดข้อมูล…");
}

function csvCell(v) {
  const s = String(v ?? "").replaceAll(`"`, `""`);
  return `"${s}"`;
}

function download(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}
