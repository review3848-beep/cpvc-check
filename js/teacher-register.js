// js/teacher-register.js
import { callApi } from "./api.js";

const form = document.getElementById("teacher-register-form");
const msgEl = document.getElementById("register-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "";
  msgEl.className = "message-area";

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!name || !email || !password) {
    msgEl.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
    msgEl.classList.add("error");
    return;
  }

  try {
    const res = await callApi("registerTeacher", {
      name,
      email,
      password,
    });

    msgEl.textContent = res.message || "สมัครใช้งานครูสำเร็จ";
    msgEl.classList.add("success");

    // สมัครเสร็จ → ส่งไปหน้า login
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
  } catch (err) {
    msgEl.textContent = err.message || "สมัครใช้งานครูไม่สำเร็จ";
    msgEl.classList.add("error");
  }
});
