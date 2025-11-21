// js/student-login.js
import { callApi } from "./api.js";

const form = document.getElementById("student-login-form");
const msgEl = document.getElementById("login-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "";
  msgEl.className = "message-area";

  const studentId = document.getElementById("studentId").value.trim();
  const password = document.getElementById("studentPassword").value.trim();

  try {
    const res = await callApi("loginStudent", { studentId, password });
    // สมมติ GAS ส่ง data: { id, name, classRoom? }
    const student = res.data;
    sessionStorage.setItem("student", JSON.stringify(student));

    msgEl.textContent = "เข้าสู่ระบบสำเร็จ กำลังไปหน้าเช็คชื่อ...";
    msgEl.classList.add("success");

    setTimeout(() => {
      window.location.href = "scan.html";
    }, 600);
  } catch (err) {
    msgEl.textContent = err.message || "เข้าสู่ระบบไม่สำเร็จ";
    msgEl.classList.add("error");
  }
});
