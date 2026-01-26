import { callApi, getAdminSession, clearAllSession } from "../api.js";

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
const fPass = document.getElementById("fPass");

let rows = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", init);

function guardAdmin() {
  const admin = getAdminSession();
  if (!admin) {
    location.replace("./login.html");
    return null;
  }
  return admin;
}

async function init() {
  const ses = guardAdmin();
  if (!ses) return;

  btnAdd?.addEventListener("click", () => openModal());
  btnExport?.addEventListener("click", exportCsv);

  btnLogout?.addEventListener("click", () => {
    if (!confirm("ออกจากระบบ?")) return;
    clearAllSession();
    localStorage.removeItem("admin");
    location.replace("./login.html");
  });

  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ✅ ESC to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) closeModal();
  });

  btnSave?.addEventListener("click", save);
  q?.addEventListener("input", render);

  await load();
}

async function load() {
  msg.textContent = "Loading...";
  try {
    const res = await callApi("adminGetStudents", {});
    if (!res?.success) {
      msg.textContent = res?.message || "โหลดไม่สำเร็จ";
      rows = [];
      render();
      return;
    }

    const rawRows = res.rows || res.data?.rows || res.data || res.list || [];
    rows = normalizeRows(rawRows);

    msg.textContent = "";
    render();
  } catch (e) {
    console.error(e);
    msg.textContent = "โหลดไม่สำเร็จ (เชื่อมต่อผิดพลาด)";
    rows = [];
    render();
  }
}

function normalizeRows(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    if (Array.isArray(r)) return { __raw: r };
    const o = { ...r };

    o.STUDENT_ID = o.STUDENT_ID ?? o.studentId ?? o.STUDENTID ?? o.id ?? o.UID ?? o.uid ?? "";
    o.NAME = o.NAME ?? o.name ?? o.FullName ?? o.fullname ?? "";
    o.PASSWORD = o.PASSWORD ?? o.password ?? "";
    o.CREATED_AT = o.CREATED_AT ?? o.createdAt ?? o.timestamp ?? o.เวลา ?? "";

    return o;
  });
}

function norm(v) {
  return String(v ?? "").toLowerCase().trim();
}

function render() {
  const key = norm(q?.value);
  const filtered = !key
    ? rows
    : rows.filter((r) => norm(r.STUDENT_ID).includes(key) || norm(r.NAME).includes(key));

  countEl && (countEl.textContent = `${filtered.length} รายการ`);

  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="4">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((r) => {
      const id = esc(r.STUDENT_ID);
      const name = esc(r.NAME);
      const created = esc(r.CREATED_AT || "");
      return `
      <tr>
        <td class="mono muted" data-label="STUDENT_ID">${id}</td>
        <td data-label="NAME">${name}</td>
        <td class="muted nowrap" data-label="CREATED_AT">${created}</td>
        <td data-label="ACTIONS">
          <div class="right">
            <button class="btn" data-edit="${id}">แก้ไข</button>
            <button class="btn btn--danger" data-del="${id}">ลบ</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-edit");
      const r = rows.find((x) => String(x.STUDENT_ID) === String(id));
      openModal(r);
    });
  });

  tbody.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", () => del(b.getAttribute("data-del")));
  });
}

/* ✅ FIX: aria-hidden warning + focus management */
function openModal(r = null) {
  editingId = r ? String(r.STUDENT_ID) : null;
  modalTitle && (modalTitle.textContent = r ? "แก้ไขนักเรียน" : "เพิ่มนักเรียน");

  fId.value = r ? (r.STUDENT_ID || "") : "";
  fId.disabled = !!r;

  fName.value = r ? (r.NAME || "") : "";
  fPass.value = "";

  modal?.classList.add("show");

  // ถ้า HTML มี aria-hidden="true" ติดมา ต้องเอาออกตอนเปิด
  modal?.removeAttribute("aria-hidden"); // หรือจะ set "false" ก็ได้

  // โฟกัสเข้า modal
  setTimeout(() => {
    const target = fId.disabled ? fName : fId;
    target?.focus();
  }, 0);
}

function closeModal() {
  // ย้ายโฟกัสออกจาก modal ก่อน กัน Chrome เตือน
  btnAdd?.focus();

  modal?.classList.remove("show");
  modal?.setAttribute("aria-hidden", "true");
}

async function save() {
  const STUDENT_ID = String(fId.value || "").trim();
  const NAME = String(fName.value || "").trim();
  const PASSWORD = String(fPass.value || "").trim();

  if (!NAME) return toast("กรอกชื่อ (NAME)");
  if (!STUDENT_ID) return toast("กรอก STUDENT_ID");
  if (!editingId && !PASSWORD) return toast("เพิ่มนักเรียนต้องใส่ PASSWORD");

  btnSave.disabled = true;

  try {
    const params = { STUDENT_ID, NAME };
    if (PASSWORD) params.PASSWORD = PASSWORD;

    const res = await callApi("adminUpsertStudent", params);
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
  if (!confirm(`ลบนักเรียน ${id} ?`)) return;

  try {
    const res = await callApi("adminDeleteStudent", { STUDENT_ID: id });
    if (!res?.success) return toast(res?.message || "ลบไม่สำเร็จ");

    await load();
    toast("ลบแล้ว 🧹");
  } catch (e) {
    console.error(e);
    toast("ลบไม่สำเร็จ (เชื่อมต่อผิดพลาด)");
  }
}

function exportCsv() {
  const headers = ["STUDENT_ID", "NAME", "PASSWORD", "CREATED_AT"];
  const lines = [headers.join(",")];

  rows.forEach((r) => {
    lines.push(headers.map((h) => csvCell(r[h] ?? "")).join(","));
  });

  download(`students_${Date.now()}.csv`, lines.join("\n"));
  toast("Export CSV ✅");
}

function toast(t) {
  if (!msg) return alert(t);
  msg.textContent = String(t);
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    if (msg.textContent === t) msg.textContent = "";
  }, 2500);
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
