// api.js
export const API_BASE =
  "https://script.google.com/macros/s/AKfycby5bmWiRLlMCkbcTHp-LuHpBvCu15dCZUdHnPHdopWaH9hr9sEezZtXY3N792GjSP3Tbw/exec";

/* ================= API CALL ================= */
export async function callApi(action, params = {}) {
  const body = new URLSearchParams({ action, ...params });

  const res = await fetch(API_BASE, {
    method: "POST",
    body,
    redirect: "follow",
  });

  const text = await res.text();

  // ถ้าฝั่ง GAS ส่ง JSON กลับมา
  try {
    return JSON.parse(text);
  } catch {
    // เผื่อ error เป็นข้อความ/HTML
    return { ok: false, message: "Non-JSON response", raw: text };
  }
}

/* ================= helpers ================= */
export function getStudentSession() {
  try {
    return JSON.parse(localStorage.getItem("cpvc_student"));
  } catch {
    return null;
  }
}

export function getTeacherSession() {
  try {
    return JSON.parse(localStorage.getItem("cpvc_teacher"));
  } catch {
    return null;
  }
}

export function clearAllSession() {
  localStorage.removeItem("cpvc_student");
  localStorage.removeItem("cpvc_teacher");
  sessionStorage.clear();
}

export function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem("admin"));
  } catch {
    return null;
  }
}
