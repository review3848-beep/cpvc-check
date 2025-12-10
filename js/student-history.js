// js/student-history.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // ส่วนหัวโปรไฟล์บนขวา
  const nameEl = document.getElementById("studentNameDisplay");
  const idEl = document.getElementById("studentIdDisplay");

  // ตารางประวัติ
  let tableBody =
    document.getElementById("historyTableBody") ||
    document.querySelector("table tbody");
  const emptyRow = document.getElementById("historyEmptyRow");
  const msgBox = document.getElementById("msg");

  function setMsg(text) {
    if (!msgBox) return;
    msgBox.textContent = text || "";
  }

  function statusView(statusRaw) {
    const s = String(statusRaw || "").toUpperCase();
    if (s === "OK") return { text: "มา", cls: "status-ok" };
    if (s === "LATE") return { text: "สาย", cls: "status-late" };
    if (s === "ABSENT") return { text: "ขาด", cls: "status-absent" };
    return { text: statusRaw || "-", cls: "" };
  }

  // ---------- อ่าน session นักเรียน ----------
  let student = null;
  try {
    const rawLocal = localStorage.getItem("cpvc_student");
    const rawSession = sessionStorage.getItem("student");
    const raw = rawLocal || rawSession;
    if (!raw) throw new Error("no session");

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) throw new Error("invalid session");

    student = parsed;
  } catch (err) {
    console.warn("ไม่พบ session นักเรียน -> กลับไปหน้า login");
    window.location.href = "login.html";
    return;
  }

  if (nameEl) nameEl.textContent = student.name || "นักเรียน";
  if (idEl) idEl.textContent = student.studentId || "-";

  // ---------- โหลดประวัติจาก GAS ----------
  loadHistory();

  async function loadHistory() {
    setMsg("กำลังโหลดประวัติการเช็คชื่อ...");

    if (!tableBody) {
      tableBody = document.querySelector("table tbody");
    }

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center;color:#9ca3af;">
            กำลังโหลดข้อมูล...
          </td>
        </tr>
      `;
    }

    try {
      const res = await callApi("getStudentHistory", {
        studentId: student.studentId,
      });

      if (!res || !res.success) {
        const m =
          (res && res.message) || "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
        renderErrorRow(m);
        setMsg(m);
        return;
      }

      const history = res.history || [];
      renderHistory(history);

      if (!history.length) {
        setMsg("ยังไม่มีประวัติการเช็คชื่อในระบบ");
      } else {
        setMsg(`พบประวัติการเช็คชื่อทั้งหมด ${history.length} รายการ`);
      }
    } catch (err) {
      console.error("loadHistory error:", err);
      const m = err.message || "โหลดข้อมูลไม่สำเร็จ";
      renderErrorRow(m);
      setMsg(m);
    }
  }

  function renderErrorRow(message) {
    if (!tableBody) return;
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;color:#fca5a5;">
          ${message}
        </td>
      </tr>
    `;
  }

  function renderHistory(history) {
    if (!tableBody) return;

    tableBody.innerHTML = "";
    if (emptyRow) emptyRow.textContent = "";

    if (!history.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center;color:#9ca3af;">
            ยังไม่มีข้อมูลการเช็คชื่อ
          </td>
        </tr>
      `;
      return;
    }

    // เอา 20 รายการล่าสุด (เปลี่ยนเป็น 5 ถ้าอยากให้สั้น)
    const rows = history.slice().reverse(); // ใหม่สุดอยู่บน

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const time = row.time || "-";
      const token = row.token || "-"; // ตอนนี้ใช้ TOKEN แทนชื่อวิชา/คาบ
      const statusRaw = row.status || "-";
      const sv = statusView(statusRaw);

      const tdSubject = document.createElement("td");
      tdSubject.textContent = token;

      const tdTime = document.createElement("td");
      tdTime.textContent = time;

      const tdStatus = document.createElement("td");
      tdStatus.textContent = sv.text;
      if (sv.cls) tdStatus.classList.add(sv.cls);

      tr.appendChild(tdSubject);
      tr.appendChild(tdTime);
      tr.appendChild(tdStatus);

      tableBody.appendChild(tr);
    });
  }
});
