import { callApi, getAdminSession } from "../api.js";

const tbody = document.getElementById("tbody");
const q = document.getElementById("q");
const countEl = document.getElementById("count");
const msg = document.getElementById("msg");
const btnAdd = document.getElementById("btnAdd");
const btnExport = document.getElementById("btnExport");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const btnClose = document.getElementById("btnClose");
const btnSave = document.getElementById("btnSave");

const fId = document.getElementById("fId");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fPass = document.getElementById("fPass");

let rows = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", init);

/* ================== AUTH GUARD ================== */
function guardAdmin() {
  const admin = getAdminSession(); // ✅ ใช้คีย์เดียวกับระบบ: localStorage "admin"
  if (!admin) {
    location.href = "./login.html";
    return null;
  }
  return admin;
}

/* ================== INIT ================== */
async function init() {
  guardAdmin();

  btnAdd?.addEventListener("click", () => openModal());
  btnClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  btnSave?.addEventListener("click", save);
  q?.addEventListener("input", render);
  btnExport?.addEventListener("click", exportCsv);

  await load();
}

/* ================== LOAD ================== */
async function load() {
  msg.textContent = "Loading...";
  try {
    // รองรับ backend ที่คืนแบบ {success:true, headers, rows} หรือ {success:true, data:{headers,rows}}
    const res = await callApi("adminGetTeachers", {});

    if (!res?.success) {
      msg.textContent = res?.message || "โหลดไม่สำเร็จ";
      return;
    }

    // ✅ ดึง rows ให้ครอบจักรวาล
    const rawRows =
      res.rows ||
      res.data?.rows ||
      res.data ||
      res.list ||
      [];

    // ✅ normalize key ให้ใช้ได้ทั้ง TEACHER_ID / teacherId / id / UID + NAME/email/password/createdAt
    rows = normalizeRows(rawRows);

    msg.textContent = "";
    render();
  } catch (e) {
    console.error(e);
    msg.textContent = "โหลดไม่สำเร็จ (เชื่อมต่อผิดพลาด)";
  }
}

/* ================== NORMALIZE ================== */
function normalizeRows(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map((r) => {
    // เผื่อบางอันเป็น array (ไม่ควร แต่กันไว้)
    if (Array.isArray(r)) return { __raw: r };

    const o = { ...r };

    // id
    o.TEACHER_ID =
      o.TEACHER_ID ??
      o.teacherId ??
      o.TEACHERID ??
      o.id ??
      o.UID ??
      o.uid ??
      "";

    // name
    o.NAME =
      o.NAME ??
      o.name ??
      o.FullName ??
      o.fullname ??
      "";

    // email
    o.EMAIL =
      o.EMAIL ??
      o.email ??
      o.Mail ??
      "";

    // password (อาจโดนตัดออกตอน list ก็ไม่เป็นไร)
    o.PASSWORD =
      o.PASSWORD ??
      o.password ??
      "";

    // created
    o.CREATED_AT =
      o.CREATED_AT ??
      o.createdAt ??
      o.timestamp ??
      o.เวลา ??
      "";

    return o;
  });
}

/* ================== RENDER ================== */
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

  tbody.innerHTML = filtered
    .map((r) => {
      const id = esc(r.TEACHER_ID);
      const name = esc(r.NAME);
      const email = esc(r.EMAIL);
      const created = esc(r.CREATED_AT || "");
      return `
        <tr>
          <td class="muted">${id}</td>
          <td>${name}</td>
          <td class="muted">${email}</td>
          <td class="muted">${created}</td>
          <td>
            <div class="right">
              <button class="btn" data-edit="${id}">แก้ไข</button>
              <button class="btn danger" data-del="${id}">ลบ</button>
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

/* ================== MODAL ================== */
function openModal(r = null) {
  editingId = r ? String(r.TEACHER_ID) : null;
  modalTitle.textContent = r ? "แก้ไขครู" : "เพิ่มครู";

  fId.value = r ? (r.TEACHER_ID || "") : "";
  fId.disabled = !!r;

  fName.value = r ? (r.NAME || "") : "";
  fEmail.value = r ? (r.EMAIL || "") : "";
  fPass.value = ""; // ไม่โชว์ของเดิม

  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

/* ================== CRUD ================== */
async function save() {
  const TEACHER_ID = fId.value.trim();
  const NAME = fName.value.trim();
  const EMAIL = fEmail.value.trim();
  const PASSWORD = fPass.value.trim();

  if (!NAME) return toast("กรอกชื่อครู (NAME)");
  if (!EMAIL) return toast("กรอกอีเมล (EMAIL)");
  if (!editingId && !PASSWORD) return toast("เพิ่มครูต้องใส่รหัสผ่าน (PASSWORD)");

  btnSave.disabled = true;

  try {
    // ✅ callApi จะใส่ action ให้อัตโนมัติ -> ส่งแค่ params
    const params = { TEACHER_ID, NAME, EMAIL };
    if (PASSWORD) params.PASSWORD = PASSWORD;

    const res = await callApi("adminUpsertTeacher", params);

    if (!res?.success) return toast(res?.message || "บันทึกไม่สำเร็จ");

    closeModal();
    await load();
    toast("บันทึกแล้ว ✅");
  } catch (e) {
    console.error(e);
    toast("บันทึกไม่สำเร็จ (เชื่อมต่อผิดพลาด)");
  } finally {
    btnSave.disabled = false;
  }
}

async function del(id) {
  if (!confirm(`ลบครู ${id} ?`)) return;

  try {
    const res = await callApi("adminDeleteTeacher", { TEACHER_ID: id });
    if (!res?.success) return toast(res?.message || "ลบไม่สำเร็จ");

    await load();
    toast("ลบแล้ว 🧹");
  } catch (e) {
    console.error(e);
    toast("ลบไม่สำเร็จ (เชื่อมต่อผิดพลาด)");
  }
}

/* ================== EXPORT ================== */
function exportCsv() {
  const headers = ["TEACHER_ID", "NAME", "EMAIL", "PASSWORD", "CREATED_AT"];
  const lines = [headers.join(",")];

  rows.forEach((r) => {
    const row = headers.map((h) => csvCell(r[h] ?? ""));
    lines.push(row.join(","));
  });

  download(`teachers_${Date.now()}.csv`, lines.join("\n"));
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

/* ================== UI HELPERS ================== */
function toast(t) {
  msg.textContent = t;
  setTimeout(() => {
    if (msg.textContent === t) msg.textContent = "";
  }, 2500);
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
