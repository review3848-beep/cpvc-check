// js/student-history.js
import { API_BASE } from "./api.js";

const nameSpan = document.getElementById("histName");
const idSpan = document.getElementById("histId");
const tableBody = document.getElementById("historyTable");

function createStatusCell(statusRaw) {
  const td = document.createElement("td");
  const status = (statusRaw || "").toUpperCase();

  td.textContent =
    status === "OK"
      ? "มาเรียน"
      : status === "LATE"
      ? "สาย"
      : status === "ABSENT"
      ? "ขาด"
      : statusRaw || "-";

  if (status === "OK") {
    td.classList.add("status-ok");
  } else if (status === "LATE") {
    td.style.color = "#fbbf24"; // เหลือง ๆ
    td.style.fontWeight = "600";
  } else if (status === "ABSENT") {
    td.style.color = "#f97373";
    td.style.fontWeight = "600";
  }

  return td;
}

function showEmptyRow(text) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 3;
  td.textContent = text;
  td.style.textAlign = "center";
  td.style.padding = "1rem 0";
  tr.appendChild(td);
  tableBody.appendChild(tr);
}

document.addEventListener("DOMContentLoaded", () => {
  const studentId = sessionStorage.getItem("studentId");
  const studentName = sessionStorage.getItem("studentName");

  if (!studentId || !studentName) {
    // ยังไม่ล็อกอิน → เด้งกลับหน้า login นักเรียน
    window.location.href = "login.html";
    return;
  }

  if (nameSpan) nameSpan.textContent = studentName;
  if (idSpan) idSpan.textContent = studentId;

  loadHistory(studentId);
});

async function loadHistory(studentId) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "getStudentHistory",
        studentId,
      }),
    });

    const data = await res.json();
    console.log("getStudentHistory >", data);

    if (!data.success) {
      showEmptyRow(data.message || "โหลดประวัติไม่สำเร็จ");
      return;
    }

    const history = data.history || [];

    tableBody.innerHTML = "";

    if (history.length === 0) {
      showEmptyRow("ยังไม่มีประวัติการเช็คชื่อ");
      return;
    }

    history.forEach((item) => {
      // รองรับทั้งแบบ object (ตาม Code.gs ใหม่) และแบบ array (เผื่อของเก่า)
      const teacherEmail =
        item.teacherEmail !== undefined ? item.teacherEmail : item[0];
      const token = item.token !== undefined ? item.token : item[4];
      const datetime =
        item.datetime !== undefined ? item.datetime : item[3];
      const status =
        item.status !== undefined ? item.status : item[5];

      const tr = document.createElement("tr");

      // ----- คอลัมน์ วิชา / คาบ -----
      const tdSubject = document.createElement("td");
      const main = document.createElement("div");
      main.textContent = token ? `TOKEN: ${token}` : "-";

      const sub = document.createElement("div");
      sub.style.fontSize = "0.75rem";
      sub.style.color = "#9ca3af";
      sub.textContent = teacherEmail ? `ครู: ${teacherEmail}` : "";

      tdSubject.appendChild(main);
      tdSubject.appendChild(sub);

      // ----- คอลัมน์ วันที่เวลา -----
      const tdDate = document.createElement("td");
      if (datetime) {
        try {
          const d = new Date(datetime);
          tdDate.textContent = d.toLocaleString("th-TH", {
            dateStyle: "short",
            timeStyle: "short",
          });
        } catch (e) {
          tdDate.textContent = datetime;
        }
      } else {
        tdDate.textContent = "-";
      }

      // ----- คอลัมน์ สถานะ -----
      const tdStatus = createStatusCell(status);

      tr.appendChild(tdSubject);
      tr.appendChild(tdDate);
      tr.appendChild(tdStatus);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    showEmptyRow("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }
}
