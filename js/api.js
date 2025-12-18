// js/api.js
// 🔧 แก้เป็น URL Web App ของ Google Apps Script ที่ Deploy แล้ว
export const API_BASE =
  "https://script.google.com/macros/s/AKfycbyjeoKm1wIbUJqRnvA4_siM-C5el3CRkkR5VxjGSK3D2ncZQqX2bIHNIbrEslBDoxK6wg/exec";

/* =========================
   CORE API CALL
========================= */
export async function callApi(action, payload = {}) {
  const body = {
    action,
    ...payload
  };

  let res;
  try {
    res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(body),
      redirect: "follow"
    });
  } catch (err) {
    throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
  }

  if (!res.ok) {
    throw new Error(`Server error (${res.status})`);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("ข้อมูลตอบกลับไม่ถูกต้อง");
  }

  return data;
}

/* =========================
   OPTIONAL HELPERS
========================= */

// ตรวจ session นักเรียน
export function getStudentSession() {
  try {
    return JSON.parse(localStorage.getItem("cpvc_student"));
  } catch {
    return null;
  }
}

// ตรวจ session ครู
export function getTeacherSession() {
  try {
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  } catch {
    return null;
  }
}

// ล้าง session ทั้งหมด (ใช้ตอน logout)
export function clearAllSession() {
  try {
    localStorage.removeItem("cpvc_student");
    localStorage.removeItem("cpvc_teacher");
    sessionStorage.clear();
  } catch {}
}
