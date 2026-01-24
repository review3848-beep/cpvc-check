//api.js
export const API_BASE =
  "https://script.google.com/macros/s/AKfycbxBjro-I9EPdAHGkOiq11TsFRaz5EoO-t38Twv3vgy5c2GV3JhpKExWPvdCJdK0vxPKqQ/exec";

/* ================= API CALL ================= */
export async function callApi(action, params = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action,
      ...params
    })
  });

  return await res.json();
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
