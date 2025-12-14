import { callApi } from "../js/api.js";

const type = new URLSearchParams(location.search).get("type");

const titleMap = {
  students:"รายชื่อนักเรียน",
  teachers:"รายชื่อครู",
  absent:"ขาดเรียนวันนี้",
  attendance:"สถิติการเข้าเรียน"
};

document.getElementById("title").textContent =
  titleMap[type] || "รายละเอียด";

async function loadDetail(){
  try{
    const data = await callApi("adminKpiDetail",{ type });
    renderTable(data);
  }catch{
    document.getElementById("tbody").innerHTML =
      "<tr><td>โหลดข้อมูลไม่สำเร็จ</td></tr>";
  }
}

function renderTable(data){
  const thead = document.getElementById("thead");
  const tbody = document.getElementById("tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if(!data || !data.length){
    tbody.innerHTML = "<tr><td>ไม่มีข้อมูล</td></tr>";
    return;
  }

  const keys = Object.keys(data[0]);
  thead.innerHTML = `<tr>${keys.map(k=>`<th>${k}</th>`).join("")}</tr>`;

  data.forEach(r=>{
    tbody.innerHTML += `<tr>${keys.map(k=>`<td>${r[k]}</td>`).join("")}</tr>`;
  });
}

loadDetail();
