// js/teacher-manage-students.js
import { callApi } from "./api.js";

/* ================= DOM ================= */
const teacherNameEl  = document.getElementById("teacherName");
const teacherEmailEl = document.getElementById("teacherEmail");

const idInput   = document.getElementById("studentId");
const nameInput = document.getElementById("studentName");
const addBtn    = document.getElementById("addStudentBtn");
const msgEl     = document.getElementById("msg");

const tableBody = document.getElementById("studentsTable");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  const teacher = getTeacherSession();
  if (!teacher){
    location.href = "login.html";
    return;
  }

  teacherNameEl.textContent  = teacher.name || "-";
  teacherEmailEl.textContent = teacher.email || "-";

  addBtn.addEventListener("click", addStudent);

  await loadStudents();
}

/* ================= SESSION ================= */
function getTeacherSession(){
  try{
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  }catch(e){
    return null;
  }
}

/* ================= LOAD STUDENTS ================= */
async function loadStudents(){
  tableBody.innerHTML =
    `<tr><td colspan="3" class="empty">กำลังโหลดข้อมูล...</td></tr>`;

  try{
    const res = await callApi("teacherListStudents", { limit: 10 });

    if (!res || !res.success){
      throw new Error(res?.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    renderTable(res.students || []);
  }catch(err){
    tableBody.innerHTML =
      `<tr><td colspan="3" class="empty" style="color:#f87171;">${err.message}</td></tr>`;
  }
}

/* ================= ADD STUDENT ================= */
async function addStudent(){
  const studentId = idInput.value.trim();
  const name      = nameInput.value.trim();

  setMsg("");

  if (!studentId){
    setMsg("⚠️ กรุณากรอกรหัสนักเรียน", "#fbbf24");
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "กำลังเพิ่ม...";

  try{
    const res = await callApi("teacherAddStudent", {
      studentId,
      name
    });

    if (!res || !res.success){
      throw new Error(res?.message || "เพิ่มนักเรียนไม่สำเร็จ");
    }

    setMsg("✅ เพิ่มรหัสนักเรียนเรียบร้อย", "#4ade80");
    idInput.value = "";
    nameInput.value = "";

    await loadStudents();

  }catch(err){
    setMsg("❌ " + err.message, "#f87171");
  }finally{
    addBtn.disabled = false;
    addBtn.textContent = "เพิ่มรหัสนักเรียน";
  }
}

/* ================= TABLE ================= */
function renderTable(rows){
  tableBody.innerHTML = "";

  if (!rows.length){
    tableBody.innerHTML =
      `<tr><td colspan="3" class="empty">ยังไม่มีข้อมูลนักเรียน</td></tr>`;
    return;
  }

  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.studentId}</td>
      <td>${r.name || "-"}</td>
      <td>
        <span class="pill">
          ${r.registered ? "สมัครแล้ว" : "ยังไม่สมัคร"}
        </span>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ================= HELPERS ================= */
function setMsg(text, color){
  msgEl.textContent = text || "";
  msgEl.style.color = color || "#e5e7eb";
}
