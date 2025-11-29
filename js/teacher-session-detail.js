// js/teacher-session-detail.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const teacherJson = sessionStorage.getItem("teacher");
  if (!teacherJson) {
    window.location.href = "login.html";
    return;
  }

  const teacher = JSON.parse(teacherJson);

  const teacherNameEl = document.getElementById("teacherName");
  const teacherEmailEl= document.getElementById("teacherEmail");
  const navTokenEl    = document.getElementById("navToken");

  const subjEl   = document.getElementById("sessSubject");
  const roomEl   = document.getElementById("sessRoom");
  const statusEl = document.getElementById("sessStatus");
  const timeEl   = document.getElementById("sessStartTime");

  const sumTotalEl = document.getElementById("sumTotal");
  const sumOkEl    = document.getElementById("sumOk");
  const sumLateEl  = document.getElementById("sumLate");
  const sumAbsEl   = document.getElementById("sumAbsent");

  const tableBody = document.getElementById("attTable");
  const msgEl     = document.getElementById("msg");

  teacherNameEl.textContent  = teacher.name || "-";
  teacherEmailEl.textContent = teacher.email || "";

  const token = getQueryParam("token");
  if (!token) {
    msgEl.textContent = "ไม่พบ TOKEN ในลิงก์ (เช่น ?token=XXXXXX)";
    msgEl.style.color = "#f97373";
    tableBody.innerHTML = `<tr><td colspan="4" class="empty">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  navTokenEl.textContent = token;

  msgEl.textContent = "กำลังโหลดข้อมูลคาบ...";
  msgEl.style.color = "#e5e7eb";

  try {
    const res = await callApi("getSessionAttendance", { token });

    if (!res || !res.success) {
      throw new Error(res?.message || "โหลดข้อมูลคาบไม่สำเร็จ");
    }

    const sess = res.session;
    const sum  = res.summary || {};
    const list = res.attendance || [];

    subjEl.textContent = sess.subject || "-";
    roomEl.textContent = sess.room ? `กลุ่มเรียน: ${sess.room}` : "-";
    statusEl.textContent = sess.status || "-";
    timeEl.textContent   = sess.startTime ? `เริ่มคาบ: ${sess.startTime}` : "-";

    sumTotalEl.textContent = sum.total ?? 0;
    sumOkEl.textContent    = sum.ok ?? 0;
    sumLateEl.textContent  = sum.late ?? 0;
    sumAbsEl.textContent   = sum.absent ?? 0;

    if (list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="empty">ยังไม่มีข้อมูลการเช็คชื่อในคาบนี้</td></tr>`;
    } else {
      tableBody.innerHTML = "";
      list.forEach((row) => {
        const tr = document.createElement("tr");

        const tdId   = document.createElement("td");
        const tdName = document.createElement("td");
        const tdTime = document.createElement("td");
        const tdStat = document.createElement("td");

        tdId.textContent   = row.studentId || "-";
        tdName.textContent = row.studentName || "-";
        tdTime.textContent = row.datetime || "-";

        const s = (row.status || "").toUpperCase();
        if (s === "OK") {
          tdStat.textContent = "มาเรียน";
          tdStat.className = "status-ok";
        } else if (s === "LATE") {
          tdStat.textContent = "สาย";
          tdStat.className = "status-late";
        } else if (s === "ABSENT") {
          tdStat.textContent = "ขาด";
          tdStat.className = "status-absent";
        } else {
          tdStat.textContent = s || "-";
        }

        tr.appendChild(tdId);
        tr.appendChild(tdName);
        tr.appendChild(tdTime);
        tr.appendChild(tdStat);

        tableBody.appendChild(tr);
      });
    }

    msgEl.textContent = "";
  } catch (err) {
    console.error(err);
    msgEl.textContent = err.message || "เกิดข้อผิดพลาด";
    msgEl.style.color = "#f97373";
    tableBody.innerHTML = `<tr><td colspan="4" class="empty">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
  }
});

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
