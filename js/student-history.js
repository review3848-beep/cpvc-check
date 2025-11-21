// js/student-history.js
import { callApi } from "./api.js";

const studentStr = sessionStorage.getItem("student");
const studentNameChip = document.getElementById("student-name");
const infoIdEl = document.getElementById("info-id");
const infoNameEl = document.getElementById("info-name");
const logoutBtn = document.getElementById("logout-btn");
const msgEl = document.getElementById("history-message");
const tableBody = document.querySelector("#history-table tbody");

// ถ้าไม่ได้ล็อกอิน → เด้งกลับ
if (!studentStr) {
  window.location.href = "login.html";
} else {
  const student = JSON.parse(studentStr);
  studentNameChip.textContent = `${student.name || "นักเรียน"} (${student.id || ""})`;
  infoIdEl.textContent = student.id || "";
  infoNameEl.textContent = student.name || "";
  loadHistory(student.id);
}

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("student");
  window.location.href = "login.html";
});

async function loadHistory(studentId) {
  msgEl.textContent = "";
  msgEl.className = "message-area";

  try {
    const res = await callApi("getStudentHistory", { studentId });
    const data = res.data || {};
    const records = data.records || [];

    tableBody.innerHTML = "";

    if (!records.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = "ยังไม่มีประวัติการเช็คชื่อในระบบ";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    records.forEach((r) => {
      const tr = document.createElement("tr");

      const tdDatetime = document.createElement("td");
      tdDatetime.textContent = r.datetime || "-";

      const tdSubject = document.createElement("td");
      tdSubject.textContent = r.subjectCode || "-";

      const tdToken = document.createElement("td");
      tdToken.textContent = r.token || "-";

      const tdStatus = document.createElement("td");
      tdStatus.textContent = r.status || "-";
      tdStatus.className = r.status === "OK" ? "badge-cell badge-open" : "badge-cell badge-closed";

      tr.appendChild(tdDatetime);
      tr.appendChild(tdSubject);
      tr.appendChild(tdToken);
      tr.appendChild(tdStatus);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    msgEl.textContent = err.message || "โหลดประวัติการเข้าเรียนไม่สำเร็จ";
    msgEl.classList.add("error");
  }
}
