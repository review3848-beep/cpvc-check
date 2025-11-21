// js/teacher-login.js
import { callApi } from "./api.js";

const form = document.getElementById("teacher-login-form");
const msgEl = document.getElementById("login-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "";
  msgEl.className = "message-area";

  const email = document.getElementById("teacherEmail").value.trim();
  const password = document.getElementById("teacherPassword").value.trim();

  try {
    const res = await callApi("loginTeacher", { email, password });
    // สมมติ GAS ส่ง data: { id, name, email }
    const teacher = res.data;
    sessionStorage.setItem("teacher", JSON.stringify(teacher));

    msgEl.textContent = "เข้าสู่ระบบสำเร็จ กำลังไปหน้าเปิดคาบ...";
    msgEl.classList.add("success");

    setTimeout(() => {
      window.location.href = "open-session.html";
    }, 600);
  } catch (err) {
    msgEl.textContent = err.message || "เข้าสู่ระบบไม่สำเร็จ";
    msgEl.classList.add("error");
  }
});