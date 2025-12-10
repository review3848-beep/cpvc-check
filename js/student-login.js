// js/student-login.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const passwordInput  = document.getElementById("password");
  const loginBtn       = document.getElementById("loginBtn");
  const msgBox         = document.getElementById("msg");

  // ---------- ถ้ามี session แล้ว ให้เด้งไป Dashboard ----------
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
    console.warn("อ่าน cpvc_student ไม่ได้:", err);
    localStorage.removeItem("cpvc_student");
  }

  if (!studentIdInput || !passwordInput || !loginBtn) {
    console.warn("ตรวจ id: studentId / password / loginBtn ใน HTML อีกที");
    return;
  }

  function setMessage(text, type) {
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

  function saveStudentSession(studentObj) {
    try {
      localStorage.setItem("cpvc_student", JSON.stringify(studentObj));
    } catch (err) {
      console.error("saveStudentSession error:", err);
    }
  }

  async function handleLogin() {
    setMessage("", "");

    const studentId = (studentIdInput.value || "").trim();
    const password  = (passwordInput.value  || "").trim();

    if (!studentId || !password) {
      setMessage("กรุณากรอกรหัสนักเรียนและรหัสผ่าน", "error");
      return;
    }

    setLoading(true);

    try {
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

      // รองรับทั้ง resp.student และ resp.data
      const student =
        resp.student ||
        resp.data || {
          studentId,
          name: resp.name || "",
        };

      saveStudentSession(student);

      setMessage("เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า Dashboard...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (err) {
      console.error("loginStudent error:", err);
      setLoading(false);
      setMessage("ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ", "error");
    }
  }

  // คลิกปุ่มเข้าสู่ระบบ
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });

  // กด Enter ในช่อง input ใด ๆ ก็ล็อกอิน
  [studentIdInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });
});
