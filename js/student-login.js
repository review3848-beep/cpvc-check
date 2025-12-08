// js/student-login.js

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

// เก็บ session นักเรียนใน localStorage
function saveStudentSession(studentObj) {
  try {
    localStorage.setItem("cpvc_student", JSON.stringify(studentObj));
  } catch (err) {
    console.error("saveStudentSession error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const studentIdInput = document.getElementById("studentId");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const msgBox = document.getElementById("msg");

  // ===== ถ้าล็อกอินอยู่แล้วให้เด้งไป Dashboard =====
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
    console.warn("อ่าน cpvc_student จาก localStorage ไม่ได้:", err);
    localStorage.removeItem("cpvc_student");
  }

  if (!studentIdInput || !passwordInput || !loginBtn) {
    console.warn("เช็ก id: studentId, password, loginBtn ใน HTML อีกที");
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

  async function handleLogin() {
    setMessage("", "");

    const studentId = (studentIdInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (!studentId || !password) {
      setMessage("กรุณากรอกรหัสนักเรียนและรหัสผ่าน", "error");
      return;
    }

    setLoading(true);

    // เรียกฟังก์ชัน loginStudent ใน GAS
    const resp = await callStudentApi("loginStudent", {
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
    const student =
      resp.student ||
      resp.data || {
        studentId: studentId,
        name: resp.name || "",
        email: resp.email || "",
      };

    saveStudentSession(student);

    setMessage("เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า Dashboard...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  }

  // คลิกปุ่มเข้าสู่ระบบ
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });

  // กด Enter ในช่องใดช่องหนึ่งแล้วล็อกอิน
  [studentIdInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
      }
    });
  });
});
