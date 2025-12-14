import { callApi } from "./api.js";

/* ===== READ QUERY ===== */
const params = new URLSearchParams(location.search);
const type = params.get("type");

/* ===== TITLE ===== */
const titleMap = {
  students: "รายชื่อนักเรียน",
  teachers: "รายชื่อครู",
  absent: "ขาดเรียนวันนี้",
  attendance: "สถิติการเข้าเรียน"
};

const titleEl = document.getElementById("title");
if (titleEl) {
  titleEl.textContent = titleMap[type] || "รายละเอียด";
}

/* ===== LOAD DATA ===== */
async function loadDetail() {
  try {
    if (!type) {
      renderEmpty("ไม่พบประเภทข้อมูล");
      return;
    }

    const data = await callApi("adminKpiDetail", { type });
    renderTable(data);

  } catch (err) {
    console.error(err);
    renderEmpty("โหลดข้อมูลไม่สำเร็จ");
  }
}

/* ===== RENDER ===== */
function renderTable(data) {
  const thead = document.getElementById("thead");
  const tbody = document.getElementById("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    renderEmpty("ไม่มีข้อมูล");
    return;
  }

  const keys = Object.keys(data[0]);

  thead.innerHTML =
    `<tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>`;

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      keys.map(k => `<td>${row[k] ?? "-"}</td>`).join("");
    tbody.appendChild(tr);
  });
}

function renderEmpty(text) {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = `<tr><td class="muted">${text}</td></tr>`;
}

/* ===== INIT ===== */
loadDetail();
