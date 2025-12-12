// js/admin-users.js
// Admin Users: list/search/filter + manage user actions
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM ----
  const adminEmailEl = document.getElementById("adminEmail");

  const statAll = document.getElementById("statAll");
  const statTeachers = document.getElementById("statTeachers");
  const statStudents = document.getElementById("statStudents");
  const statSuspended = document.getElementById("statSuspended");

  const qEl = document.getElementById("q");
  const roleEl = document.getElementById("role");
  const statusEl = document.getElementById("status");

  const refreshBtn = document.getElementById("refreshBtn");
  const addTeacherBtn = document.getElementById("addTeacherBtn");

  const usersBody = document.getElementById("usersBody");
  const resultHint = document.getElementById("resultHint");
  const msgEl = document.getElementById("msg");

  // ---- state ----
  let allUsers = [];
  let filteredUsers = [];
  let loading = false;

  // ---- utils ----
  const setMsg = (text = "", tone = "muted") => {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color =
      tone === "ok" ? "#4ade80" :
      tone === "warn" ? "#facc15" :
      tone === "err" ? "#f87171" :
      "#94a3b8";
  };

  const setText = (el, t) => { if (el) el.textContent = t; };

  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const fmtDate = (isoOrAny) => {
    if (!isoOrAny) return "-";
    const d = new Date(isoOrAny);
    if (isNaN(d.getTime())) return String(isoOrAny);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
    // ถ้าจะเอาเวลาเพิ่ม: `${y}-${m}-${day} ${hh}:${mm}`
  };

  // session ที่แนะนำให้ set ตอน login
  // localStorage.setItem("adminSession", JSON.stringify({ email, token }))
  const getAdminSession = () => {
    try { return JSON.parse(localStorage.getItem("adminSession") || "null"); }
    catch { return null; }
  };

  const session = getAdminSession();
  if (adminEmailEl && session?.email) adminEmailEl.textContent = session.email;

  const badgeRoleClass = (role) => {
    const r = String(role || "").toUpperCase();
    if (r === "ADMIN") return "b-admin";
    if (r === "TEACHER") return "b-teacher";
    return "b-student";
  };

  const badgeStatusClass = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUSPENDED") return "b-suspend";
    if (s === "DELETED") return "b-deleted";
    return "b-active";
  };

  const norm = (x) => String(x ?? "").trim().toLowerCase();

  // ---- render ----
  function renderTable(rows) {
    if (!usersBody) return;

    if (!rows || rows.length === 0) {
      usersBody.innerHTML = `
        <tr>
          <td colspan="6" style="color:#94a3b8;padding:1rem;">ไม่พบข้อมูล</td>
        </tr>
      `;
      return;
    }

    usersBody.innerHTML = rows.map(u => {
      const name = escapeHtml(u.name || "-");
      const idOrEmail = escapeHtml(u.email || u.id || "-");
      const role = escapeHtml(String(u.role || "STUDENT").toUpperCase());
      const status = escapeHtml(String(u.status || "ACTIVE").toUpperCase());
      const createdAt = escapeHtml(fmtDate(u.createdAt || u.created_at));

      // ใช้ data-* เก็บไว้ยิง action
      return `
        <tr data-id="${escapeHtml(u.userId || u.id || "")}"
            data-role="${escapeHtml(role)}"
            data-email="${escapeHtml(u.email || "")}"
            data-status="${escapeHtml(status)}">
          <td>${name}</td>
          <td>${idOrEmail}</td>
          <td><span class="badge ${badgeRoleClass(role)}">${role}</span></td>
          <td><span class="badge ${badgeStatusClass(status)}">${status}</span></td>
          <td>${createdAt}</td>
          <td>
            <div class="row-actions">
              <button class="mini" data-act="edit">แก้ไข</button>
              <button class="mini" data-act="toggle">
                ${status === "SUSPENDED" ? "ปลดระงับ" : "ระงับ"}
              </button>
              <button class="mini" data-act="reset">รีเซ็ตรหัส</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderStats(list) {
    const total = list.length;
    const teachers = list.filter(u => String(u.role || "").toUpperCase() === "TEACHER").length;
    const students = list.filter(u => String(u.role || "").toUpperCase() === "STUDENT").length;
    const suspended = list.filter(u => String(u.status || "").toUpperCase() === "SUSPENDED").length;

    setText(statAll, String(total || 0));
    setText(statTeachers, String(teachers || 0));
    setText(statStudents, String(students || 0));
    setText(statSuspended, String(suspended || 0));
  }

  function applyFilters() {
    const q = norm(qEl?.value || "");
    const role = String(roleEl?.value || "ALL").toUpperCase();
    const status = String(statusEl?.value || "ALL").toUpperCase();

    filteredUsers = allUsers.filter(u => {
      const uRole = String(u.role || "").toUpperCase();
      const uStatus = String(u.status || "").toUpperCase();

      if (role !== "ALL" && uRole !== role) return false;
      if (status !== "ALL" && uStatus !== status) return false;

      if (!q) return true;

      const blob = [
        u.name, u.email, u.id, u.userId, u.role, u.status
      ].map(norm).join(" ");
      return blob.includes(q);
    });

    renderStats(allUsers); // สถิติ “ทั้งหมด” ของระบบ (ไม่ถูกกรอง)
    renderTable(filteredUsers);

    if (resultHint) {
      const hint = `${filteredUsers.length} รายการ (จากทั้งหมด ${allUsers.length})`;
      resultHint.textContent = hint;
    }
  }

  // ---- API calls ----
  async function loadUsers() {
    if (loading) return;
    loading = true;
    setMsg("กำลังโหลดข้อมูลผู้ใช้…");

    try {
      const res = await callApi({
        action: "adminListUsers",
        adminSession: session || null
      });

      if (!res || res.ok !== true) {
        throw new Error(res?.error || "โหลดข้อมูลไม่สำเร็จ (adminListUsers)");
      }

      // คาดหวัง: { ok:true, data:{ users:[...] } } หรือ { ok:true, users:[...] }
      const users = res.data?.users || res.users || [];
      allUsers = Array.isArray(users) ? users : [];
      applyFilters();
      setMsg("โหลดข้อมูลเรียบร้อย", "ok");
    } catch (err) {
      console.error("[admin-users] loadUsers:", err);
      setMsg(
        `โหลดข้อมูลไม่สำเร็จ: ${err?.message || err}. (ต้องมี action: adminListUsers ใน Code.gs)`,
        "err"
      );
      // fallback: อย่าให้ตารางว่างแบบงง ๆ
      allUsers = [];
      applyFilters();
    } finally {
      loading = false;
    }
  }

  async function createTeacherFlow() {
    const name = prompt("ชื่อครู:");
    if (!name) return;

    const email = prompt("อีเมลครู:");
    if (!email) return;

    const password = prompt("ตั้งรหัสผ่านครู (หรือเว้นว่างให้ระบบสุ่ม):") || "";

    setMsg("กำลังเพิ่มครู…");
    try {
      const res = await callApi({
        action: "adminCreateTeacher",
        adminSession: session || null,
        teacher: { name, email, password }
      });

      if (!res || res.ok !== true) throw new Error(res?.error || "เพิ่มครูไม่สำเร็จ");
      setMsg("เพิ่มครูสำเร็จ", "ok");
      await loadUsers();
    } catch (err) {
      console.error("[admin-users] createTeacher:", err);
      setMsg(`เพิ่มครูไม่สำเร็จ: ${err?.message || err} (ต้องมี action: adminCreateTeacher)`, "err");
    }
  }

  async function editUserFlow(tr) {
    const id = tr?.dataset?.id || "";
    const role = tr?.dataset?.role || "";
    const email = tr?.dataset?.email || "";

    // หา user เดิม
    const u = allUsers.find(x => String(x.userId || x.id || "") === id) || {};

    const newName = prompt("แก้ชื่อ:", u.name || "");
    if (newName === null) return; // cancel

    // เฉพาะครู/แอดมินแก้อีเมลง่าย ๆ นักเรียนอาจใช้รหัสเป็นหลัก
    const newEmail = prompt("แก้อีเมล:", u.email || email || "");
    if (newEmail === null) return;

    setMsg("กำลังบันทึกการแก้ไข…");
    try {
      const res = await callApi({
        action: "adminUpdateUser",
        adminSession: session || null,
        user: {
          id,
          role,
          name: newName,
          email: newEmail
        }
      });

      if (!res || res.ok !== true) throw new Error(res?.error || "แก้ไขไม่สำเร็จ");
      setMsg("บันทึกสำเร็จ", "ok");
      await loadUsers();
    } catch (err) {
      console.error("[admin-users] editUser:", err);
      setMsg(`แก้ไขไม่สำเร็จ: ${err?.message || err} (ต้องมี action: adminUpdateUser)`, "err");
    }
  }

  async function toggleUserStatusFlow(tr) {
    const id = tr?.dataset?.id || "";
    const role = tr?.dataset?.role || "";
    const current = String(tr?.dataset?.status || "ACTIVE").toUpperCase();
    const next = current === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

    if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น ${next} ?`)) return;

    setMsg("กำลังอัปเดตสถานะ…");
    try {
      const res = await callApi({
        action: "adminSetUserStatus",
        adminSession: session || null,
        user: { id, role, status: next }
      });
      if (!res || res.ok !== true) throw new Error(res?.error || "อัปเดตสถานะไม่สำเร็จ");
      setMsg("อัปเดตสถานะสำเร็จ", "ok");
      await loadUsers();
    } catch (err) {
      console.error("[admin-users] toggleStatus:", err);
      setMsg(`อัปเดตสถานะไม่สำเร็จ: ${err?.message || err} (ต้องมี action: adminSetUserStatus)`, "err");
    }
  }

  async function resetPasswordFlow(tr) {
    const id = tr?.dataset?.id || "";
    const role = tr?.dataset?.role || "";
    const email = tr?.dataset?.email || "";

    if (!confirm(`รีเซ็ตรหัสผ่านผู้ใช้ ${email || id} ?`)) return;

    const newPass = prompt("ตั้งรหัสผ่านใหม่ (หรือเว้นว่างให้ระบบสุ่ม):") || "";

    setMsg("กำลังรีเซ็ตรหัสผ่าน…");
    try {
      const res = await callApi({
        action: "adminResetUserPassword",
        adminSession: session || null,
        user: { id, role, email },
        newPassword: newPass
      });

      if (!res || res.ok !== true) throw new Error(res?.error || "รีเซ็ตรหัสไม่สำเร็จ");

      // ถ้า backend ส่งรหัสที่สุ่มกลับมา
      const gen = res.data?.generatedPassword || res.generatedPassword;
      if (gen) {
        alert(`รีเซ็ตรหัสผ่านสำเร็จ\nรหัสใหม่: ${gen}\n(อย่าลืมส่งให้ผู้ใช้)`);
      }

      setMsg("รีเซ็ตรหัสผ่านสำเร็จ", "ok");
    } catch (err) {
      console.error("[admin-users] resetPassword:", err);
      setMsg(`รีเซ็ตรหัสไม่สำเร็จ: ${err?.message || err} (ต้องมี action: adminResetUserPassword)`, "err");
    }
  }

  // ---- events ----
  const onFilterChange = debounce(applyFilters, 200);

  if (qEl) qEl.addEventListener("input", onFilterChange);
  if (roleEl) roleEl.addEventListener("change", applyFilters);
  if (statusEl) statusEl.addEventListener("change", applyFilters);

  if (refreshBtn) refreshBtn.addEventListener("click", () => loadUsers());
  if (addTeacherBtn) addTeacherBtn.addEventListener("click", () => createTeacherFlow());

  // event delegation for row actions
  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-act]");
    if (!btn) return;

    const tr = btn.closest("tr");
    if (!tr) return;

    const act = btn.dataset.act;

    if (act === "edit") editUserFlow(tr);
    else if (act === "toggle") toggleUserStatusFlow(tr);
    else if (act === "reset") resetPasswordFlow(tr);
  });

  // ---- start ----
  loadUsers();
});
