import { callApi } from "../api.js";

/* ================= DOM ================= */
const studentNameDisplay = document.getElementById("studentNameDisplay");
const studentIdDisplay   = document.getElementById("studentIdDisplay");
const lastUpdateEl       = document.getElementById("lastUpdate");

const totalEl  = document.getElementById("totalClasses");
const okEl     = document.getElementById("presentCount");
const lateEl   = document.getElementById("lateCount");
const absentEl = document.getElementById("absentCount");

const tbodyEl  = document.getElementById("recentTbody");
const msgEl    = document.getElementById("msg");
const dashStatus = document.getElementById("dashStatus");

const btnScan    = document.getElementById("btnScan");
const btnHistory = document.getElementById("btnHistory");
const btnRefresh = document.getElementById("btnRefresh");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  wireButtons();

  const session = getStudentSession();
  if(!session){
    toast("ยังไม่ได้เข้าสู่ระบบ");
    // ถ้าจะบังคับเด้งไปหน้า login ให้เปิดบรรทัดนี้
    // location.href = "./login.html";
    return;
  }

  hydrateHeader(session);

  await loadDashboard(session.studentId);
}

/* ================= SESSION ================= */
function getStudentSession(){
  // รองรับหลาย key + bridge จากหน้าอื่น (cpvc_student <-> studentSession)
  const raw =
    localStorage.getItem("studentSession") ||
    localStorage.getItem("cpvc_student") ||
    localStorage.getItem("student") ||
    localStorage.getItem("session") ||
    "";

  if(!raw) return null;

  try{
    const s = JSON.parse(raw);

    // กรณีเก็บแบบ {student:{studentId,name}} หรือ {studentId,name}
    if(s && s.student){
      const st = s.student;
      return {
        studentId: st.studentId || st.id || st.code || st.STUDENT_ID || "",
        name: st.name || st.studentName || st.fullname || "STUDENT"
      };
    }

    if(s && (s.studentId || s.id || s.code || s.STUDENT_ID)){
      return {
        studentId: s.studentId || s.id || s.code || s.STUDENT_ID || "",
        name: s.name || s.studentName || s.fullname || "STUDENT"
      };
    }

    return null;
  }catch{
    return null;
  }
}

/* ================= UI ================= */
function hydrateHeader(s){
  const name = s.name || "STUDENT";
  const sid  = s.studentId || "";

  if(studentNameDisplay) studentNameDisplay.textContent = name;
  if(studentIdDisplay)   studentIdDisplay.textContent = sid ? sid : "-";

  setLastUpdate("-");
}

function wireButtons(){
  btnScan?.addEventListener("click", ()=> location.href = "./scan.html");
  btnHistory?.addEventListener("click", ()=> location.href = "./history.html");

  btnRefresh?.addEventListener("click", async ()=>{
    const s = getStudentSession();
    if(!s) return toast("ไม่พบ session");
    await loadDashboard(s.studentId, true);
  });
}

/* ================= DATA ================= */
async function loadDashboard(studentId, silent=false){
  try{
    setDashStatus("กำลังโหลด...");
    if(!silent) toast("กำลังอัปเดตข้อมูล...");

    const res = await callApi("studentGetDashboard", { studentId });

    if(!res || res.success !== true){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    const stats  = res.stats  || res.data?.stats  || {};
    const recent = res.recent || res.data?.recent || [];

    setStats(stats);
    renderRecent(recent);

    const now = new Date();
    setLastUpdate(fmtDT(now));

    setDashStatus("พร้อมใช้งาน");
    toast("อัปเดตแล้ว ✅");
  }catch(err){
    setDashStatus("มีปัญหา");
    toast("โหลดข้อมูลไม่ได้: " + String(err?.message || err));
    renderRecent([]); // กันหน้าค้าง
  }
}

function setStats(stats){
  // รองรับ key หลายแบบเผื่อ backend ส่งต่างกัน
  const total  = num(stats.total ?? stats.totalClasses ?? stats.totalCount ?? 0);
  const ok     = num(stats.ok ?? stats.present ?? stats.presentCount ?? stats.okCount ?? 0);
  const late   = num(stats.late ?? stats.lateCount ?? 0);
  const absent = num(stats.absent ?? stats.miss ?? stats.absentCount ?? 0);

  if(totalEl)  totalEl.textContent = total;
  if(okEl)     okEl.textContent = ok;
  if(lateEl)   lateEl.textContent = late;
  if(absentEl) absentEl.textContent = absent;
}

function renderRecent(rows){
  if(!tbodyEl) return;

  tbodyEl.innerHTML = "";

  if(!rows || !rows.length){
    tbodyEl.innerHTML = `
      <tr><td colspan="4" style="text-align:center;opacity:.7;padding:14px;">ยังไม่มีประวัติ</td></tr>
    `;
    return;
  }

  for(const r of rows){
    const time = fmtTime(r.time || r.datetime || r.ts);
    const subject = safe(r.subject || r.course || "-");
    const room = safe(r.room || r.group || "-");
    const token = safe(r.token || "");

    const statusRaw = String(r.status || r.result || "-");
    const statusTh  = thStatus(statusRaw);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${time}</td>
      <td>${subject}${room && room !== "-" ? ` <span style="opacity:.7">(${room})</span>` : ""}</td>
      <td>${statusBadge(statusRaw, statusTh)}</td>
      <td style="text-align:right;opacity:.75">${token}</td>
    `;
    tbodyEl.appendChild(tr);
  }
}

/* ================= HELPERS ================= */
function toast(t){
  if(!msgEl){
    console.log("[MSG]", t);
    return;
  }
  msgEl.textContent = t;
  msgEl.style.opacity = "1";
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ msgEl.style.opacity="0.85"; }, 2500);
}

function setDashStatus(t){
  if(dashStatus) dashStatus.textContent = t;
}

function setLastUpdate(t){
  if(lastUpdateEl) lastUpdateEl.textContent = t;
}

function num(x){
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function safe(s){
  return String(s ?? "").replace(/[<>]/g, "");
}

function thStatus(s){
  const x = String(s).toUpperCase();
  if(x === "OK") return "มาเรียน";
  if(x === "LATE") return "สาย";
  if(x === "ABSENT") return "ขาด";
  if(x === "DUPLICATE") return "เช็คแล้ว";
  if(x === "OPEN") return "เปิดอยู่";
  if(x === "CLOSED") return "ปิดแล้ว";
  return safe(s);
}

function statusBadge(statusRaw, text){
  const x = String(statusRaw).toUpperCase();

  let border = "rgba(148,163,184,.35)";
  let bg = "rgba(2,6,23,.02)";
  let fg = "rgba(15,23,42,.9)";

  if(x === "OK"){ border = "rgba(34,197,94,.35)"; bg="rgba(34,197,94,.08)"; fg="rgba(22,163,74,.95)"; }
  if(x === "LATE"){ border = "rgba(245,158,11,.35)"; bg="rgba(245,158,11,.10)"; fg="rgba(217,119,6,.95)"; }
  if(x === "ABSENT"){ border = "rgba(239,68,68,.35)"; bg="rgba(239,68,68,.08)"; fg="rgba(220,38,38,.95)"; }
  if(x === "DUPLICATE"){ border = "rgba(99,102,241,.35)"; bg="rgba(99,102,241,.08)"; fg="rgba(79,70,229,.95)"; }

  return `
    <span style="
      padding:6px 10px;
      border-radius:999px;
      border:1px solid ${border};
      background:${bg};
      color:${fg};
      display:inline-flex;
      align-items:center;
      font-weight:1000;
      white-space:nowrap;
    ">${safe(text)}</span>
  `;
}

function fmtTime(v){
  if(!v) return "-";

  // รองรับ timestamp ที่เป็นตัวเลข/สตริง
  const d = new Date(v);
  if(isNaN(d.getTime())) return safe(String(v));

  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const mo = String(d.getMonth()+1).padStart(2,"0");

  return `${dd}/${mo} ${hh}:${mm}`;
}

function fmtDT(d){
  const dd = String(d.getDate()).padStart(2,"0");
  const mo = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${dd}/${mo}/${yy} ${hh}:${mm}`;
}
