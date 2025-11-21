// js/student-register.js
import { callApi } from "./api.js";

const form = document.getElementById("student-register-form");
const msgEl = document.getElementById("register-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "";
  msgEl.className = "message-area";

  const studentId = document.getElementById("regStudentId").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const passwordConfirm = document.getElementById("regPasswordConfirm").value.trim();

  if (!studentId || !password || !passwordConfirm) {
    msgEl.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
    msgEl.classList.add("error");
    return;
  }

  if (password.length < 6) {
    msgEl.textContent = "รหัสผ่านควรยาวอย่างน้อย 6 ตัวอักษร";
    msgEl.classList.add("error");
    return;
  }

  if (password !== passwordConfirm) {
    msgEl.textContent = "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
    msgEl.classList.add("error");
    return;
  }

  try {
    const res = await callApi("registerStudent", {
      studentId,
      password,
    });

    msgEl.textContent = res.message || "ตั้งรหัสผ่านสำเร็จ สามารถเข้าสู่ระบบได้แล้ว";
    msgEl.classList.add("success");

    // สมัครเสร็จ → ส่งไปหน้า login
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
  } catch (err) {
    msgEl.textContent = err.message || "สมัครใช้งานไม่สำเร็จ";
    msgEl.classList.add("error");
  }
});
