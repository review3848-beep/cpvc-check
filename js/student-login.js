// js/student-login.js
// ใช้ร่วมกับ js/api.js ที่มีฟังก์ชัน callApi(action, payload)
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const msgBox = document.getElementById("msg");

  // ===== ถ้ามี session อยู่แล้ว ส่งไปหน้า dashboard เลย =====
  try {
    const existId = sessionStorage.getItem("studentId");
    if (existId) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (err) {
    console.warn("อ่าน sessionStorage ไม่ได้:", err);
    sessionStorage.clear();
  }

  if (!studentIdInput || !passwordInput || !loginBtn) {
    console.warn("เช็ก id: studentId, password, loginBtn ใน HTML อีกที");
    return;
  }

  function setMessage(text, type = "error") {
    if (!msgBox) return;
    msgBox.textContent = text || "";
    msgBox.style.marginTop = text ? "1rem" : "0";

    if (!text) {
      msgBox.style.color = "";
      return;
    }
    msgBox.style.color = type === "error" ? "#fca5a5" : "#bbf7d0";
  }

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
  }

  async function handleLogin() {
    setMessage("");

    const studentId = (studentIdInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (!studentId || !password) {
      setMessage("กรุณากรอกรหัสนักเรียนและรหัสผ่าน", "error");
      return;
    }

    setLoading(true);

    try {
      // เรียกไปที่ GAS ผ่าน api.js
      const resp = await callApi("loginStudent", {
        studentId,
        password,
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

      // รองรับโครง response หลายแบบ
      const s =
        resp.student ||
        resp.data || {
          studentId,
          name: resp.name || "",
        };

      // เก็บ session แบบที่ dashboard / history ใช้
      sessionStorage.setItem("studentId", s.studentId || studentId);
      sessionStorage.setItem(
        "studentName",
        s.name || s.studentName || "นักเรียน"
      );

      setMessage("เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า Dashboard...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (err) {
      console.error("handleLogin error:", err);
      setLoading(false);
      setMessage("ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ", "error");
    }
  }

  // คลิกปุ่มเข้าสู่ระบบ
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });

  // กด Enter เพื่อเข้าสู่ระบบ
  [studentIdInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });
});
