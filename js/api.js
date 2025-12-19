// js/api.js
export const API_BASE =
  "https://script.google.com/macros/s/AKfycbxNpOWBi0WbHY7V4bljXS8K4LeedWx6slNQ8lE7WZrV8V6soqvT0j57UYWiAluAHivkAQ/exec";

export async function callApi(action, payload = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"   // ✅ ต้องเป็นแบบนี้
    },
    body: JSON.stringify({
      action,
      ...payload
    })
  });

  if (!res.ok) {
    throw new Error("Server error " + res.status);
  }

  return await res.json();
}

/* ===== helpers ===== */
export function getStudentSession() {
  try { return JSON.parse(localStorage.getItem("cpvc_student")); }
  catch { return null; }
}

export function getTeacherSession() {
  try { return JSON.parse(localStorage.getItem("cpvc_teacher")); }
  catch { return null; }
}

export function clearAllSession() {
  localStorage.removeItem("cpvc_student");
  localStorage.removeItem("cpvc_teacher");
  sessionStorage.clear();
}
