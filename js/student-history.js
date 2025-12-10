// js/student-history.js
// แสดงประวัติการเช็คชื่อ พร้อม วิชา / ห้อง / ครู
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl   = document.getElementById("studentNameDisplay");
  const idEl     = document.getElementById("studentIdDisplay");
  const tbody    = document.getElementById("historyBody");
  const msgEl    = document.getElementById("historyMsg");

  // ---------- helper ----------
  function setMsg(text) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
  }

  function statusClass(status) {
    const s = String(status || "").toUpperCase();
    if (s === "OK") return "status-ok";
    if (s === "LATE") return "status-late";
    if (s === "ABSENT") return "status-absent";
    return "";
  }

  // ---------- session นักเรียน ----------
  let student = null;
  try {
    const raw = localStorage.getItem("cpvc_student");
    if (!raw) throw new Error("no session");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) throw new Error("invalid");
    student = parsed;
  } catch (e) {
    window.location.href = "login.html";
    return;
  }

  if (nameEl) nameEl.textContent = student.name || "นักเรียน";
  if (idEl)   idEl.textContent   = student.studentId || "-";

  // ---------- โหลดประวัติ ----------
  loadHistory();

  async function loadHistory() {
    setMsg("กำลังโหลดประวัติการเข้าเรียน...");

    try {
      const res = await callApi("getStudentHistory", {
        studentId: student.studentId,
      });

      if (!res || !res.success) {
        throw new Error(res && res.message ? res.message : "โหลดข้อมูลไม่สำเร็จ");
      }

      const history = res.history || [];
      renderTable(history);

      if (!history.length) {
        setMsg("ยังไม่มีข้อมูลการเช็คชื่อในระบบ");
      } else {
        setMsg(`พบประวัติทั้งหมด ${history.length} รายการ`);
      }
    } catch (err) {
      console.error("loadHistory error:", err);
      setMsg(err.message || "โหลดข้อมูลไม่สำเร็จ");
      renderTable([]);
    }
  }

  function renderTable(history) {
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!history.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "ยังไม่มีข้อมูลการเช็คชื่อ";
      td.style.textAlign = "center";
      tbody.appendChild(tr);
      tr.appendChild(td);
      return;
    }

    // ใช้ 20 รายการล่าสุด (หรือจะเปลี่ยนเป็น 5 ก็ได้)
    const list = history.slice().reverse(); // ใหม่สุดอยู่บน

    list.forEach((row) => {
      const tr = document.createElement("tr");

      const time  = row.time || "-";
      const token = row.token || "-";
      const status = row.status || "-";
      const subject = row.subject || "-";
      const room = row.room || "-";
      const teacherName = row.teacherName || row.teacherEmail || "-";

      // เวลา
      const tdTime = document.createElement("td");
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      // วิชา + ห้อง
      const tdSubject = document.createElement("td");
      tdSubject.textContent = subject;
      tr.appendChild(tdSubject);

      const tdRoom = document.createElement("td");
      tdRoom.textContent = room;
      tr.appendChild(tdRoom);

      // สถานะ
      const tdStatus = document.createElement("td");
      tdStatus.textContent = status;
      tdStatus.className = statusClass(status);
      tr.appendChild(tdStatus);

      // ครู
      const tdTeacher = document.createElement("td");
      tdTeacher.textContent = teacherName;
      tr.appendChild(tdTeacher);

      tbody.appendChild(tr);
    });
  }
});
