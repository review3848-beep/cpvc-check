// js/student-history.js

const name = sessionStorage.getItem("studentName");
const id = sessionStorage.getItem("studentId");

if (!id) {
  window.location.href = "login.html";
}

document.getElementById("histName").textContent = name || "-";
document.getElementById("histId").textContent = id;

// ยังไม่มี API getHistory จริง ใช้ mock data ไว้โชว์หน้าให้สวย ๆ ก่อน
const tbody = document.getElementById("historyTable");

const dummy = [
  { subject: "CPVC101", datetime: "2025-11-21 09:00", status: "OK" },
  { subject: "CPVC102", datetime: "2025-11-22 10:00", status: "OK" },
];

dummy.forEach(row => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${row.subject}</td>
    <td>${row.datetime}</td>
    <td class="status-ok">${row.status}</td>
  `;
  tbody.appendChild(tr);
});
