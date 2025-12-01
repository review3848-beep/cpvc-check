// js/student-scan.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl      = document.getElementById("studentName");
  const idEl        = document.getElementById("studentId");
  const tokenInput  = document.getElementById("tokenInput");
  const checkBtn    = document.getElementById("scanBtn");
  const msgEl       = document.getElementById("msg");
  const readerEl    = document.getElementById("reader");

  let student = null;
  let html5QrCode = null;
  let cameras = [];
  let currentCameraId = null;

  const setMsg = (text, ok = false) => {
    msgEl.textContent = text || "";
    msgEl.style.color = ok ? "#4ade80" : "#f97373";
  };

  // ---------------- ดึงข้อมูลนักเรียนจาก sessionStorage ----------------
  try {
    const raw = sessionStorage.getItem("student");
    if (raw) student = JSON.parse(raw);
  } catch (e) {
    student = null;
  }

  if (!student || !student.id) {
    window.location.href = "login.html";
    return;
  }

  nameEl.textContent = student.name || "-";
  idEl.textContent   = student.id || "-";

  // ---------------- อ่าน token จาก URL ถ้ามี (จาก QR ลิงก์โดยตรง) ----------------
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      tokenInput.value = urlToken;
    }
  } catch (e) {
    // เงียบไป ไม่เป็นไร
  }

  // ---------------- ฟังก์ชันเริ่มกล้อง (บังคับกล้องหลัง / main camera) ----------------
  const startScanner = async () => {
    if (!readerEl) return;

    try {
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
      }

      // ดึงลิสต์กล้องทั้งหมด
      cameras = await Html5Qrcode.getCameras();

      let configCamera;

      if (cameras && cameras.length > 0) {
        // พยายามหาเลนส์หลักจาก label (back / rear / main)
        const preferred = cameras.find(c =>
          /back|rear|main/i.test(c.label || "")
        );

        const chosen = preferred || cameras[0];
        currentCameraId = chosen.id;
        configCamera = currentCameraId;
      } else {
        // fallback ใช้ facingMode (มือถือส่วนใหญ่จะเป็นกล้องหลัง)
        configCamera = { facingMode: "environment" };
      }

      await html5QrCode.start(
        configCamera,
        {
          fps: 10,
          qrbox: 250
        },
        onScanSuccess,
        onScanFailure
      );

    } catch (err) {
      console.error("startScanner error", err);
      setMsg("เปิดกล้องไม่สำเร็จ ลองอนุญาตสิทธิ์กล้อง หรือเปลี่ยนเบราว์เซอร์", false);
    }
  };

  // ---------------- callback ตอนสแกนได้ ----------------
  const onScanSuccess = async (decodedText/*, decodedResult*/) => {
    try {
      let tokenFromQr = decodedText;

      // ถ้า QR เป็นลิงก์ ให้ดึง token จาก query string
      try {
        const url = new URL(decodedText);
        const t = url.searchParams.get("token");
        if (t) tokenFromQr = t;
      } catch (e) {
        // ไม่ใช่ URL ก็ไม่เป็นไร ใช้ตัว decoded ตรง ๆ
      }

      tokenInput.value = tokenFromQr || "";
      setMsg(`อ่าน TOKEN จาก QR ได้แล้ว: ${tokenFromQr}`, true);

      // กันยิงซ้ำรัว ๆ ปิดกล้องหลังจากอ่านได้ 1 ครั้ง
      try {
        if (html5QrCode) {
          await html5QrCode.stop();
        }
      } catch (e) {
        console.warn("stop camera error", e);
      }
    } catch (e) {
      console.error("onScanSuccess error", e);
    }
  };

  const onScanFailure = (err) => {
    // ไม่ต้องแสดง error ทุกเฟรม เดี๋ยวแชทแตก
    // console.warn(err);
  };

  // ---------------- เริ่มกล้องทันทีเมื่อเข้าหน้า ----------------
  startScanner();

  // ---------------- กดปุ่ม "เช็คชื่อ" ----------------
  checkBtn.addEventListener("click", async () => {
    const token = (tokenInput.value || "").trim();
    if (!token) {
      setMsg("กรุณาสแกน QR หรือกรอก TOKEN ก่อนเช็คชื่อ");
      return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = "กำลังเช็คชื่อ...";
    setMsg("");

    try {
      const res = await callApi("markAttendance", {
        studentId:   student.id,
        studentName: student.name,
        token,
      });

      if (res.success) {
        const statusText =
          res.status === "OK"   ? "เช็คชื่อสำเร็จ (มาเรียน)" :
          res.status === "LATE" ? "เช็คชื่อสำเร็จ (มาสาย)" :
                                  "เช็คชื่อสำเร็จ";

        setMsg(statusText, true);
      } else {
        setMsg(res.message || "เช็คชื่อไม่สำเร็จ", false);
      }
    } catch (err) {
      console.error(err);
      setMsg(err.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", false);
    } finally {
      checkBtn.disabled = false;
      checkBtn.textContent = "เช็คชื่อ";
    }
  });

  // ---------------- กด Enter ในช่อง TOKEN ให้ทำงานเหมือนกดปุ่ม ----------------
  tokenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      checkBtn.click();
    }
  });
});
