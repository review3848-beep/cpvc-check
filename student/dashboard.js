import { callApi } from "../api.js";

/* ================= DOM ================= */
const nameEl = pickEl(["studentName", "nameEl", "name", "hdrName", "profileName"]);
const idEl   = pickEl(["studentId", "idEl", "studentCode", "codeEl", "hdrId", "profileId"]);

const totalEl  = pickEl(["totalClasses", "total", "statTotal", "totalCount"]);
const okEl     = pickEl(["presentCount", "okCount", "statOk", "ok"]);
const lateEl   = pickEl(["lateCount", "statLate", "late"]);
const absentEl = pickEl(["absentCount", "statAbsent", "absent"]);

const tbodyEl  = pickEl(["recentTbody", "recentBody", "tbody", "recentSessions", "recentHistory"]);
const msgEl    = pickEl(["msg", "message", "statusMsg"]);

const btnScan   = pickEl(["btnScan", "goScan", "scanBtn"]);
const btnHistory= pickEl(["btnHistory", "goHistory", "historyBtn"]);
const btnRefresh= pickEl(["btnRefresh", "refreshBtn"]);

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  wireButtons();

  const session = getStudentSession();
  if(!session){
    toast("ยังไม่ได้เข้าสู่ระบบ");
    // ปรับ path login ให้ตรงโปรเจกต์ของคุณ
    // location.href = "./login.html";
    return;
  }

  hydrateHeader(session);

  await loadDashboard(session.studentId);
}

/* ================= SESSION ================= */
function getStudentSession(){
  // รองรับหลาย key เผื่อของเดิมคุณเก็บต่างกัน
  const raw =
    localStorage.getItem("studentSession") ||
    localStorage.getItem("student") ||
    localStorage.getItem("session") ||
    "";

  if(!raw) return null;

  try{
    const s = JSON.parse(raw);
    // รองรับสไตล์ {student:{studentId,name}} หรือ {studentId,name}
    if(s && s.student) return { ...s.student, studentId: s.student.studentId, name: s.student.name };
    if(s && (s.studentId || s.id)) return { studentId: s.studentId || s.id, name: s.name || s.studentName || "STUDENT" };
    return null;
  }catch{
    return null;
  }
}

/* ================= UI ================= */
function hydrateHeader(s){
  const name = s.name || s.studentName || s.fullname || "STUDENT";
  const sid  = s.studentId || s.id || s.code || s.STUDENT_ID || "";

  // ✅ กัน null ไม่ให้พังทั้งหน้า
  if(nameEl) nameEl.textContent = name;
  if(idEl)   idEl.textContent = sid ? sid : "-";
}

function wireButtons(){
  if(btnScan){
    btnScan.addEventListener("click", ()=> {
      // ปรับ path ตามไฟล์จริงของคุณ
      location.href = "./scan.html"; // หรือ ./checkin.html / ./scanner.html
    });
  }

  if(btnHistory){
    btnHistory.addEventListener("click", ()=> {
      location.href = "./history.html";
    });
  }

  if(btnRefresh){
    btnRefresh.addEventListener("click", async ()=>{
      const s = getStudentSession();
      if(!s) return;
      await loadDashboard(s.studentId, true);
    });
  }
}

/* ================= DATA ================= */
async function loadDashboard(studentId, silent=false){
  try{
    if(!silent) toast("กำลังอัปเดตข้อมูล...");

    // ✅ เรียก action ฝั่ง GAS ที่คุณมีอยู่แล้ว
    const res = await callApi("studentGetDashboard", { studentId });

    if(!res || res.success !== true){
      throw new Error(res && res.message ? res.message : "โหลดข้อมูลไม่สำเร็จ");
    }

    const stats  = res.stats || (res.data && res.data.stats) || {};
    const recent = res.recent || (res.data && res.data.recent) || [];

    setStats(stats);
    renderRecent(recent);

    toast("อัปเดตแล้ว ✅");
  }catch(err){
    toast("โหลดข้อมูลไม่ได้: " + String(err.message || err));
  }
}

function setStats(stats){
  // รองรับ key หลายแบบ
  const total  = num(stats.total ?? stats.totalClasses ?? 0);
  const ok     = num(stats.ok ?? stats.present ?? stats.okc ?? 0);
  const late   = num(stats.late ?? 0);
  const absent = num(stats.absent ?? stats.miss ?? 0);

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
    const time = fmtTime(r.time);
    const subject = safe(r.subject || "-");
    const room = safe(r.room || "-");
    const status = safe(thStatus(r.status || "-"));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${time}</td>
      <td>${subject}${room && room !== "-" ? ` <span style="opacity:.7">(${room})</span>` : ""}</td>
      <td>${statusBadge(status)}</td>
      <td style="text-align:right;opacity:.75">${safe(r.token || "")}</td>
    `;
    tbodyEl.appendChild(tr);
  }
}

/* ================= HELPERS ================= */
function pickEl(ids){
  for(const id of ids){
    const el = document.getElementById(id);
    if(el) return el;
  }
  return null;
}

function toast(t){
  if(msgEl){
    msgEl.textContent = t;
    msgEl.style.opacity = "1";
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ if(msgEl) msgEl.style.opacity="0.85"; }, 2500);
  }else{
    // เผื่อไม่มี msg element ก็ไม่พัง
    console.log("[MSG]", t);
  }
}

function num(x){
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function safe(s){
  return String(s ?? "").replace(/[<>]/g, "");
}

function fmtTime(v){
  if(!v) return "-";
  const d = new Date(v);
  if(isNaN(d.getTime())) return safe(String(v));
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const mo = String(d.getMonth()+1).padStart(2,"0");
  return `${dd}/${mo} ${hh}:${mm}`;
}

function thStatus(s){
  const x = String(s).toUpperCase();
  if(x === "OK") return "มาเรียน";
  if(x === "LATE") return "สาย";
  if(x === "ABSENT") return "ขาด";
  if(x === "DUPLICATE") return "เช็คแล้ว";
  return s;
}

function statusBadge(text){
  // ไม่กำหนดสีแบบ hardcode เยอะ ให้เข้ากับธีมเดิม
  return `<span style="padding:6px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.35);display:inline-block;">
    ${safe(text)}
  </span>`;
}
