// js/student-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const passwordInput  = document.getElementById("password");
  const loginBtn       = document.getElementById("loginBtn");
  const msgBox         = document.getElementById("msg");

  // ---------- ถ้ามี session อยู่แล้ว ให้ไปหน้า Dashboard เลย ----------
  try {
    const raw = localStorage.getItem("cpvc_student");
    if (raw) {
      const st = JSON.parse(raw);
      if (st && st.studentId) {
        window.location.href = "dashboard.html";
        return;
      }
    }
  } catch (err) {
    console.warn("อ่าน cpvc_student ไม่ได้ เคลียร์ทิ้ง", err);
    localStorage.removeItem("cpvc_student");
    sessionStorage.removeItem("student");
  }

  // ถ้า element ไม่ครบ ให้หยุดไว้ก่อน
  if (!studentIdInput || !passwordInput || !loginBtn) {
    console.warn("เช็ก id: studentId, password, loginBtn ใน HTML อีกที");
    return;
  }

  // ---------- helper แสดงข้อความ ----------
  function setMessage(text, type = "") {
    if (!msgBox) return;
    msgBox.textContent = text || "";
    msgBox.style.marginTop = text ? "1rem" : "0";

    if (!text) {
      msgBox.style.color = "";
      return;
    }

    if (type === "error") {
      msgBox.style.color = "#fca5a5"; // แดงอ่อน
    } else {
      msgBox.style.color = "#bbf7d0"; // เขียวอ่อน
    }
  }

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
  }

  // ---------- flow หลัก: ล็อกอิน ----------
  async function handleLogin() {
    setMessage("");

    const studentId = (studentIdInput.value || "").trim();
    const password  = (passwordInput.value || "").trim();

    if (!studentId || !password) {
      setMessage("กรุณากรอกรหัสนักเรียนและรหัสผ่าน", "error");
      return;
    }

    setLoading(true);

    const resp = await callApi("loginStudent", {
      studentId,
      password
    });

    setLoading(false);

    if (!resp || !resp.success) {
      const msg =
        resp && resp.message
          ? resp.message
          : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      setMessage(msg, "error");
      return;
    }

    // ดึงข้อมูลนักเรียนจาก response
    const student =
      resp.student ||
      resp.data || {
        studentId: studentId,
        name: resp.name || "",
      };

    // เก็บ session ให้ใช้ key เดียวกับ dashboard
    try {
      localStorage.setItem("cpvc_student", JSON.stringify(student));
      sessionStorage.setItem("student", JSON.stringify(student));
    } catch (err) {
      console.error("บันทึก session ไม่ได้:", err);
    }

    setMessage("เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า Dashboard...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  }

  // ---------- event ----------
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });

  [studentIdInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });
});
