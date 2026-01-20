// ../js/admin-export.js
import { callApi } from "../api.js";

const msg = document.getElementById("msg");

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button[data-type]").forEach(btn => {
    btn.addEventListener("click", () => onExport(btn.dataset.type));
  });
});

async function onExport(type){
  setMsg("กำลังเตรียมไฟล์…");

  try{
    let action = "";

    switch(type){
      case "teachers":   action = "adminGetTeachers"; break;
      case "students":   action = "adminGetStudents"; break;
      case "sessions":   action = "adminExportSessions"; break;
      case "attendance": action = "teacherExportAll"; break;
      default: throw new Error("unknown type");
    }

    const res = await callApi(action, {});
    if(!res?.success) throw new Error(res?.message || "export failed");

    // กรณีที่ backend ส่ง csv ตรงมา
    if(res.csv){
      downloadText(res.csv, `${type}.csv`, "text/csv;charset=utf-8;");
      setMsg("ดาวน์โหลดไฟล์แล้ว");
      return;
    }

    // กรณีที่เป็น list ธรรมดา (teachers / students)
    if(res.data){
      const rows = res.data;
      const headers = Object.keys(rows[0] || {});
      const csv = [
        headers.join(","),
        ...rows.map(r => headers.map(h => csvCell(r[h])).join(","))
      ].join("\n");

      downloadText(csv, `${type}.csv`, "text/csv;charset=utf-8;");
      setMsg("ดาวน์โหลดไฟล์แล้ว");
      return;
    }

    throw new Error("ไม่พบข้อมูลสำหรับ export");

  }catch(e){
    setMsg(`ผิดพลาด: ${e.message || e}`);
  }
}

function setMsg(t){ if(msg) msg.textContent = t || ""; }

function csvCell(v){
  const s = (v ?? "").toString();
  return `"${s.replaceAll('"','""')}"`;
}

function downloadText(content, filename, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
