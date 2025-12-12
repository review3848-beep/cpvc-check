// js/student-history.js
// แสดงประวัติการเช็คชื่อ พร้อม วิชา / ห้อง / ครู
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("studentNameDisplay");
  const idEl = document.getElementById("studentIdDisplay");
  const tbody = document.getElementById("historyBody");
  const msgEl = document.getElementById("historyMsg");

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

  // ✅ แปลงเวลาให้สวย (ไทย + พ.ศ. + เวลาเครื่องผู้ใช้)
  function formatDateTimeTH(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value); // ถ้าพังให้โชว์เดิม

    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
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
  if (idEl) idEl.textContent = student.studentId || "-";

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
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // ใหม่สุดอยู่บน
    const list = history.slice().reverse();

    list.forEach((row) => {
      const tr = document.createElement("tr");

      const rawTime = row.time || "";
      const status = row.status || "-";
      const subject = row.subject || "-";
      const room = row.room || "-";
      const teacherName = row.teacherName || row.teacherEmail || "-";

      // เวลา (สวยขึ้น)
      const tdTime = document.createElement("td");
      tdTime.textContent = formatDateTimeTH(rawTime || "-");
      tdTime.classList.add("time-col");
      // เก็บค่าเดิมไว้ดู (hover)
      if (rawTime) tdTime.title = rawTime;
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
