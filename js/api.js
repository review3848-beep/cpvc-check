// js/api.js
export const API_BASE =
  "https://script.google.com/macros/s/AKfycbyMW1Rlfp4ewVMO-L1-k8Hes0VQYAbD8XuAO1HrMQ747bFOfhbCBQ0uiMQ8k3-9Pe6G8A/exec";

export async function callApi(action, params = {}) {
  const query = new URLSearchParams({
    action,
    ...params
  }).toString();

  const res = await fetch(`${API_BASE}?${query}`);
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
