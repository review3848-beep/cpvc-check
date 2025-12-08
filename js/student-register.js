// js/student-register.js

// ================= CONFIG API =================
// ถ้าใช้ไฟล์ api.js และมีตัวแปร API_BASE อยู่แล้ว จะใช้ API_BASE อัตโนมัติ
// ถ้าไม่ได้ใช้ api.js ให้แก้ "YOUR_GAS_WEB_APP_EXEC_URL" เป็น URL /exec ของ Web App GAS
const API_ENDPOINT =
  typeof API_BASE !== "undefined"
    ? API_BASE
    : "YOUR_GAS_WEB_APP_EXEC_URL"; // แก้ตรงนี้ถ้าไม่ได้ใช้ api.js

// helper เรียก API ฝั่ง GAS
async function callStudentApi(action, payload) {
  if (!API_ENDPOINT || API_ENDPOINT.startsWith("YOUR_GAS_WEB_APP")) {
    console.error("ยังไม่ได้ตั้งค่า API_ENDPOINT ให้ถูกต้อง");
    return { success: false, message: "API ยังไม่พร้อมใช้งาน (ยังไม่ได้ตั้งค่า URL)" };
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("callStudentApi error:", err);
    return { success: false, message: "ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ" };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const nameInput = document.getElementById("name");
  const passwordInput = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");
  const msgBox = document.getElementById("msg");

  if (!studentIdInput || !nameInput || !passwordInput || !registerBtn) {
    console.warn("เช็ก id: studentId, name, password, registerBtn ใน HTML อีกที");
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
    registerBtn.disabled = isLoading;
    registerBtn.textContent = isLoading ? "กำลังสมัคร..." : "สมัครใช้งาน";
  }

  async function handleRegister() {
    setMessage("", "");

    const studentId = (studentIdInput.value || "").trim();
    const name = (nameInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (!studentId || !name || !password) {
      setMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }

    setLoading(true);

    // เรียกฟังก์ชัน registerStudent ใน GAS
    // โครง payload: { studentId, name, password }
    const resp = await callStudentApi("registerStudent", {
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

    // สมัครสำเร็จ
    const successMsg =
      resp.message ||
      "สมัครใช้งานสำเร็จแล้ว สามารถเข้าสู่ระบบได้เลย";

    setMessage(successMsg, "success");

    // เคลียร์ฟอร์ม
    studentIdInput.value = "";
    nameInput.value = "";
    passwordInput.value = "";

    // หน่วงนิดหน่อยแล้วพาไปหน้า login
    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
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
