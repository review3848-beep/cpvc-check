import { callApi } from "../api.js";

/* ===== DOM ===== */
const adminNameEl       = document.getElementById("adminName");

const totalTeachersEl   = document.getElementById("totalTeachers");
const totalStudentsEl   = document.getElementById("totalStudents");
const todaySessionsEl   = document.getElementById("todaySessions");
const totalAttendanceEl = document.getElementById("totalAttendance");

const subTeachersEl     = document.getElementById("subTeachers");
const subStudentsEl     = document.getElementById("subStudents");
const subTodayEl        = document.getElementById("subToday");
const subAttendanceEl   = document.getElementById("subAttendance");

const qEl               = document.getElementById("q");
const filterStatusEl    = document.getElementById("filterStatus");

const tbodyEl           = document.getElementById("recentSessions");
const footerNoteEl      = document.getElementById("footerNote");

const btnRefresh        = document.getElementById("btnRefresh");
const btnManage         = document.getElementById("btnManage");
const btnExport         = document.getElementById("btnExport");
const btnAudit          = document.getElementById("btnAudit");
const btnViewAll        = document.getElementById("btnViewAll");

/* ===== STATE ===== */
let sessions = []; // [{subject,teacher,room,status,time}]
let stats = { teachers:0, students:0, todaySessions:0, openSessions:0, attendance:0 };

document.addEventListener("DOMContentLoaded", init);

function guardAdmin(){
  const raw = localStorage.getItem("adminSession");
  if(!raw){
    location.href = "./login.html";
    return null;
  }
  try{
    return JSON.parse(raw);
  }catch{
    localStorage.removeItem("adminSession");
    location.href = "./login.html";
    return null;
  }
}

async function init(){
  const ses = guardAdmin();
  if(!ses) return;

  adminNameEl.textContent = ses.admin?.name || ses.admin?.username || ses.name || "Admin";

  btnRefresh?.addEventListener("click", () => load());
  btnExport?.addEventListener("click", exportCsv);
  btnAudit?.addEventListener("click", () => toast("Audit: เร็ว ๆ นี้ (อย่ากดถี่ เดี๋ยวระบบเขิน)"));
  btnViewAll?.addEventListener("click", () => toast("View all: ถ้าต้องการหน้า sessions.html เดี๋ยวจัดให้"));
  btnManage?.addEventListener("click", () => {
    // เปลี่ยนปลายทางได้: teachers.html / students.html
    location.href = "./teachers.html";
  });

  qEl?.addEventListener("input", renderTable);
  filterStatusEl?.addEventListener("change", renderTable);

  await load();
}

async function load(){
  setLoading(true);

  // ใช้ action ที่คุณมีใน doPost: adminDashboard
  const res = await callApi("adminDashboard", { limit: 30 });

  if(!res || !res.success){
    tbodyEl.innerHTML = `<tr><td colspan="5" class="empty">${esc(res?.message || "โหลดข้อมูลไม่สำเร็จ")}</td></tr>`;
    toast("โหลดไม่ผ่าน: เช็ค WebApp URL / action / callApi");
    setLoading(false);
    return;
  }

  const data = res.data || res;

  stats = data.stats || {
    teachers: data.totalTeachers ?? 0,
    students: data.totalStudents ?? 0,
    todaySessions: data.todaySessions ?? 0,
    openSessions: data.openSessions ?? 0,
    attendance: data.totalAttendance ?? 0
  };

  sessions = data.recentSessions || data.data?.recentSessions || [];

  renderStats();
  renderTable();
  footerNoteEl.textContent = `Last sync: ${fmt(new Date())}`;

  setLoading(false);
}

function renderStats(){
  totalTeachersEl.textContent   = num(stats.teachers);
  totalStudentsEl.textContent   = num(stats.students);
  todaySessionsEl.textContent   = num(stats.todaySessions);
  totalAttendanceEl.textContent = num(stats.attendance);

  const nowText = fmt(new Date());
  subTeachersEl.textContent   = `อัปเดตล่าสุด: ${nowText}`;
  subStudentsEl.textContent   = `อัปเดตล่าสุด: ${nowText}`;
  subTodayEl.textContent      = `กำลังเปิดอยู่: ${num(stats.openSessions)}`;
  subAttendanceEl.textContent = `รายการสะสมทั้งระบบ`;
}

function renderTable(){
  const key = String(qEl?.value || "").trim().toLowerCase();
  const statusFilter = String(filterStatusEl?.value || "ALL").toUpperCase();

  let list = [...sessions];

  if(statusFilter !== "ALL"){
    list = list.filter(s => String(s.status || "").toUpperCase() === statusFilter);
  }

  if(key){
    list = list.filter(s => {
      const subject = String(s.subject || "").toLowerCase();
      const teacher = String(s.teacher || "").toLowerCase();
      const room    = String(s.room || "").toLowerCase();
      const status  = String(s.status || "").toLowerCase();
      return subject.includes(key) || teacher.includes(key) || room.includes(key) || status.includes(key);
    });
  }

  if(!list.length){
    tbodyEl.innerHTML = `<tr><td colspan="5" class="empty">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>`;
    return;
  }

  tbodyEl.innerHTML = list.map(s => {
    const st = String(s.status || "").toUpperCase();
    const cls = st === "OPEN" ? "pill open" : "pill closed";
    const label = st || "CLOSED";
    return `
      <tr>
        <td>${esc(s.subject || "-")}</td>
        <td>${esc(s.teacher || "-")}</td>
        <td>${esc(s.room || "-")}</td>
        <td>
          <span class="${cls}">
            <span class="dot"></span>${esc(label)}
          </span>
        </td>
        <td class="right muted">${esc(s.time || "")}</td>
      </tr>
    `;
  }).join("");
}

function exportCsv(){
  const key = String(qEl?.value || "").trim().toLowerCase();
  const statusFilter = String(filterStatusEl?.value || "ALL").toUpperCase();

  let list = [...sessions];
  if(statusFilter !== "ALL") list = list.filter(s => String(s.status || "").toUpperCase() === statusFilter);
  if(key){
    list = list.filter(s => {
      const subject = String(s.subject || "").toLowerCase();
      const teacher = String(s.teacher || "").toLowerCase();
      const room    = String(s.room || "").toLowerCase();
      const status  = String(s.status || "").toLowerCase();
      return subject.includes(key) || teacher.includes(key) || room.includes(key) || status.includes(key);
    });
  }

  const headers = ["subject","teacher","room","status","time"];
  const lines = [headers.join(",")];
  list.forEach(s => lines.push(headers.map(h => csvCell(s[h] ?? "")).join(",")));

  download(`admin_recent_sessions_${Date.now()}.csv`, lines.join("\n"));
  toast("Export CSV ✅");
}

function setLoading(on){
  btnRefresh && (btnRefresh.disabled = on);
  btnExport  && (btnExport.disabled  = on);
  btnManage  && (btnManage.disabled  = on);

  if(on){
    tbodyEl.innerHTML = `<tr><td colspan="5" class="empty">กำลังโหลดข้อมูล…</td></tr>`;
  }
}

function toast(t){
  footerNoteEl.textContent = String(t);
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    footerNoteEl.textContent = `Last sync: ${fmt(new Date())}`;
  }, 2200);
}

function download(filename, content){
  const blob = new Blob([content], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function csvCell(v){
  const s = String(v ?? "").replaceAll(`"`,`""`);
  return `"${s}"`;
}

function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(d){
  const pad = (x)=>String(x).padStart(2,"0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
