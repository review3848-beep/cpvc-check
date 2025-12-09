// js/student-register.js
// ใช้ร่วมกับ js/api.js ที่มีฟังก์ชัน callApi(action, payload)
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const nameInput = document.getElementById("name");
  const passwordInput = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");
  const msgBox = document.getElementById("msg");

  if (!studentIdInput || !nameInput || !passwordInput || !registerBtn) {
    console.warn(
      "เช็ก id: studentId, name, password, registerBtn ใน HTML อีกที"
    );
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
    registerBtn.disabled = isLoading;
    registerBtn.textContent = isLoading ? "กำลังสมัคร..." : "สมัครใช้งาน";
  }

  async function handleRegister() {
    setMessage("");

    const studentId = (studentIdInput.value || "").trim();
    const name = (nameInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (!studentId || !name || !password) {
      setMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }

    setLoading(true);

    try {
      // เรียกฟังก์ชัน registerStudent ที่ฝั่ง GAS
      const resp = await callApi("registerStudent", {
        studentId,
        name,
        password,
      });

      setLoading(false);

      if (!resp || !resp.success) {
        const msg =
          resp && resp.message
            ? resp.message
            : "สมัครใช้งานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
        setMessage(msg, "error");
        return;
      }

      const successMsg =
        resp.message || "สมัครใช้งานสำเร็จแล้ว สามารถเข้าสู่ระบบได้เลย";

      setMessage(successMsg, "success");

      // เคลียร์ฟอร์ม
      studentIdInput.value = "";
      nameInput.value = "";
      passwordInput.value = "";

      // หน่วงนิดหน่อยแล้วพาไปหน้า login
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (err) {
      console.error("handleRegister error:", err);
      setLoading(false);
      setMessage("ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ", "error");
    }
  }

  // คลิกปุ่ม = สมัคร
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleRegister();
  });

  // กด Enter ในช่อง input ใด ๆ = สมัคร
  [studentIdInput, nameInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleRegister();
      }
    });
  });
});
