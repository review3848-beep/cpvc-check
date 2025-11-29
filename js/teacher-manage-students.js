// js/teacher-manage-students.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const teacherJson = sessionStorage.getItem("teacher");
  if (!teacherJson) {
    window.location.href = "login.html";
    return;
  }

  const teacher = JSON.parse(teacherJson);
  const nameEl   = document.getElementById("teacherName");
  const emailEl  = document.getElementById("teacherEmail");
  const idInput  = document.getElementById("studentId");
  const nameInput= document.getElementById("studentName");
  const btn      = document.getElementById("addStudentBtn");
  const msgEl    = document.getElementById("msg");
  const tableBody= document.getElementById("studentsTable");

  nameEl.textContent  = teacher.name || "-";
  emailEl.textContent = teacher.email || "";

  // โหลดตัวอย่างนักเรียนล่าสุด (ใช้ getStudentHistory ไม่ได้ เราอ่านจากชีตตรงไม่ได้ผ่าน frontend
  // แต่เพื่อความง่าย จะให้ฝั่งครูเห็นเฉพาะ List ล่าสุดจาก API ใหม่ก็ได้ ถ้ายังไม่ได้ทำ
  // ตอนนี้จะยังไม่มี API ดึง list ทั้ง STUDENTS เลยจำลองเป็นไม่โหลดจริงก็ได้
  // ---- ถ้าอยากให้ดึงจริง ต้องเขียนฟังก์ชันใน GS เพิ่ม เช่น getStudentsPreview ----
  // เพื่อไม่ให้ error เราจะแค่เคลียร์ state ไว้เฉย ๆ

  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="3" class="empty">(ฟีเจอร์ดูตัวอย่างนักเรียนทั้งระบบ – สามารถเพิ่มใน Code.gs ภายหลัง)</td></tr>`;
  }

  // เพิ่มนักเรียน
  btn.addEventListener("click", async () => {
    msgEl.textContent = "";
    msgEl.style.color = "#e5e7eb";

    const studentId   = idInput.value.trim();
    const studentName = nameInput.value.trim();

    if (!studentId) {
      msgEl.textContent = "กรุณากรอกรหัสนักเรียน";
      msgEl.style.color = "#f97373";
      return;
    }

    btn.disabled = true;
    msgEl.textContent = "กำลังเพิ่มรหัสนักเรียน...";

    try {
      const res = await callApi("addStudentByTeacher", {
        teacherEmail: teacher.email,
        studentId,
        name: studentName,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "เพิ่มรหัสไม่สำเร็จ");
      }

      msgEl.textContent = res.message || "เพิ่มรหัสนักเรียนเรียบร้อย ✅";
      msgEl.style.color = "#4ade80";
      idInput.value = "";
    } catch (err) {
      console.error(err);
      msgEl.textContent = err.message || "เกิดข้อผิดพลาด";
      msgEl.style.color = "#f97373";
    } finally {
      btn.disabled = false;
    }
  });
});
