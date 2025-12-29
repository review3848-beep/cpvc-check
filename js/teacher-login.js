import { callApi } from "./api.js";

const emailInput = document.getElementById("email");
const pwInput    = document.getElementById("password");
const btn        = document.getElementById("loginBtn");
const msgEl      = document.getElementById("msg");

btn.addEventListener("click", login);
pwInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

async function login(){
  const email = emailInput.value.trim();
  const password = pwInput.value.trim();

  msgEl.textContent = "";

  if (!email || !password){
    msgEl.textContent = "กรุณากรอกข้อมูลให้ครบ";
    msgEl.style.color = "#f87171";
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    // ✅ ตรงนี้ต้องเป็น password เท่านั้น
    const res = await callApi("teacherLogin", { email, password });
    console.log("LOGIN RES =", res);

    if (!res.success) {
      throw new Error(res.message);
    }

    localStorage.setItem("cpvc_teacher", JSON.stringify(res.teacher));
    location.href = "dashboard.html";

  } catch (err) {
    msgEl.textContent = "❌ " + err.message;
    msgEl.style.color = "#f87171";
  } finally {
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
}
localStorage.setItem(
  "teacherSession",
  JSON.stringify({
    id: res.teacherId,
    name: res.name
  })
);

location.href = "open-session.html";

