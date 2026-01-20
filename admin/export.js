// ../js/admin-export.js
import { callApi } from "../api.js";

/* ================== ACTION MAP (ต้องตรงกับ GS) ================== */
const ACTIONS = {
  // export csv
  export: {
    teachers:   "adminExportTeachers",
    students:   "adminExportStudents",
    sessions:   "adminExportSessions",
    attendance: "adminExportAttendance",
  },

  // counts (optional)
  // ถ้าไม่มี action ไหน ให้ปล่อยว่างไว้ได้ (จะโชว์ —)
  count: {
    teachers:   "adminGetTeachers",
    students:   "adminGetStudents",
    sessions:   "adminListSessions",
    attendance: "adminGetAttendance", // ถ้าไม่มีใน GS ก็จะ fallback เป็น —
  }
};

/* ================= DOM ================= */
const msgEl = document.getElementById("msg");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const admin = guardAdmin();
  if(!admin) return;

  bindExportButtons();
  await loadCountsSafe_();
}

/* ================= GUARD ================= */
function guardAdmin(){
  const raw = localStorage.getItem("adminSession");
  if(!raw){
    location.href = "./login.html";
    return null;
  }
  try{
    return JSON.parse(raw);
  }catch{
    location.href = "./login.html";
    return null;
  }
}

/* ================= UI ================= */
function setMsg(t){
  if(!msgEl) return;
  msgEl.textContent = t || "";
}
function toast(t){
  setMsg(t || "");
  if(t){
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>setMsg(""), 2200);
  }
}
function setBtnLoading(btn, loading){
  if(!btn) return;
  btn.disabled = !!loading;
  btn.dataset.loading = loading ? "1" : "0";
  btn.style.opacity = loading ? "0.75" : "1";
  btn.textContent = loading ? "กำลังเตรียมไฟล์..." : "ดาวน์โหลด CSV";
}

/* ================= EXPORT ================= */
function bindExportButtons(){
  document.querySelectorAll("button[data-export]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = btn.getAttribute("data-export");
      if(!type) return;

      const action = ACTIONS.export[type];
      if(!action){
        toast("ยังไม่ได้ตั้งค่า action สำหรับ: " + type);
        return;
      }

      setBtnLoading(btn, true);
      toast("กำลังสร้างไฟล์...");

      try{
        const res = await callApi(action, {});
        if(!res?.success) throw new Error(res?.message || "Export ไม่สำเร็จ");

        // GS ส่ง {csv:"..."} กลับมา
        if(res.csv){
          downloadText(res.csv, `${type}_${stamp()}.csv`, "text/csv;charset=utf-8;");
          toast("ดาวน์โหลดแล้ว");
        }else if(res.url){
          window.open(res.url, "_blank");
          toast("เปิดลิงก์ดาวน์โหลดแล้ว");
        }else{
          throw new Error("รูปแบบ response ไม่ถูกต้อง (ต้องมี csv หรือ url)");
        }
      }catch(err){
        toast("Export ไม่สำเร็จ: " + (err.message || err));
      }finally{
        setBtnLoading(btn, false);
      }
    });
  });
}

/* ================= COUNTS (OPTIONAL) ================= */
async function loadCountsSafe_(){
  // teachers
  await trySetCount_("teachers", async () => {
    const act = ACTIONS.count.teachers;
    if(!act) return null;
    const res = await callApi(act, {});
    const rows = res?.rows || res?.data || [];
    return Array.isArray(rows) ? rows.length : null;
  });

  // students
  await trySetCount_("students", async () => {
    const act = ACTIONS.count.students;
    if(!act) return null;
    const res = await callApi(act, {});
    const rows = res?.rows || res?.data || [];
    return Array.isArray(rows) ? rows.length : null;
  });

  // sessions
  await trySetCount_("sessions", async () => {
    const act = ACTIONS.count.sessions;
    if(!act) return null;
    const res = await callApi(act, {});
    const rows = res?.rows || res?.data || [];
    return Array.isArray(rows) ? rows.length : null;
  });

  // attendance
  await trySetCount_("attendance", async () => {
    const act = ACTIONS.count.attendance;
    if(!act) return null;
    const res = await callApi(act, {});
    const rows = res?.rows || res?.data || [];
    return Array.isArray(rows) ? rows.length : null;
  });
}

async function trySetCount_(key, getter){
  const el = document.querySelector(`[data-count="${key}"]`);
  if(!el) return;

  try{
    const n = await getter();
    if(typeof n === "number") el.textContent = `${n} รายการ`;
    else el.textContent = "—";
  }catch{
    el.textContent = "—";
  }
}

/* ================= HELPERS ================= */
function downloadText(content, filename, mime){
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp(){
  const d = new Date();
  const pad = (n) => String(n).padStart(2,"0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
