import { API_BASE } from "./api.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function show(t, type="error") {
  msg.textContent = t;
  msg.style.color = type === "success" ? "#4ade80" : "#fb7185";
}

async function loginAdmin() {
  if (!email.value || !password.value) {
    return show("กรุณากรอกข้อมูลให้ครบ");
  }

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        action: "loginAdmin",
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();
    console.log("loginAdmin >", data);

    if (data.success) {
      show("เข้าสู่ระบบสำเร็จ","success");
      sessionStorage.setItem("adminName", data.data.name);
      sessionStorage.setItem("adminEmail", data.data.email);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    } else {
      show(data.message || "เข้าสู่ระบบไม่สำเร็จ");
    }

  } catch(e) {
    show("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }
  
  btn.disabled = false;
  btn.textContent = "เข้าสู่ระบบ";
}

btn.addEventListener("click", loginAdmin);
