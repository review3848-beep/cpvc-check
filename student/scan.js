// student/scan.js
import { callApi } from "../js/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const pillNameEl = document.getElementById("pillUserName");
  const tokenInput = document.getElementById("tokenInput");
  const submitBtn  = document.getElementById("submitTokenBtn");
  const msgEl      = document.getElementById("scanMsg");

  const dotEl  = document.getElementById("sessionStatusDot");
  const textEl = document.getElementById("sessionStatusText");

  // ===== AUTH =====
  const raw = localStorage.getItem("cpvc_student");
  if (!raw) {
    location.href = "login.html";
    return;
  }

  const student = JSON.parse(raw);
  const studentId = student.studentId;
  pillNameEl.textContent = student.name || "นักเรียน";

  // ===== INIT STATUS =====
  setStatus("ready", "รอกรอก TOKEN เพื่อเช็คชื่อ");

  submitBtn.addEventListener("click", submit);
  tokenInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submit();
  });

  async function submit() {
    const token = tokenInput.value.trim().toUpperCase();
    msgEl.textContent = "";
    msgEl.classList.remove("scanMsg-success");

    if (!token) {
      showError("กรุณากรอก TOKEN");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังบันทึก...";

    let res;
    try {
      res = await callApi("studentCheckIn", {
        studentId,
        token
      });
    } catch (e) {
      setStatus("error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      showError("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
      resetBtn();
      return;
    }

    if (!res.success) {
      setStatus("error", res.message || "TOKEN ไม่ถูกต้อง");
      showError(res.message || "TOKEN ไม่ถูกต้อง");
      resetBtn();
      return;
    }

    // ✅ SUCCESS
    setStatus("open", "บันทึกเวลาเข้าเรียนเรียบร้อย");
    msgEl.textContent = "✅ เช็คชื่อสำเร็จ";
    msgEl.classList.add("scanMsg-success");

    tokenInput.value = "";

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "ยืนยันเช็คชื่อ";
    }, 1200);
  }

  function setStatus(type, text) {
    dotEl.classList.remove("open", "error");
    if (type === "open") dotEl.classList.add("open");
    if (type === "error") dotEl.classList.add("error");
    textEl.textContent = text;
  }

  function showError(text) {
    msgEl.textContent = text;
    msgEl.classList.remove("scanMsg-success");
  }

  function resetBtn() {
    submitBtn.disabled = false;
    submitBtn.textContent = "ยืนยันเช็คชื่อ";
  }
});
