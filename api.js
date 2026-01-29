// api.js
export const API_BASE =
  "https://script.google.com/macros/s/AKfycbweT2gmQHGDBbnPiYNfLd1vLZPpg06cvXq_DNByWNrk2rJ9CBxv-7Nke9CiIZ6Qe5x-kQ/exec";

/* ================= API CALL ================= */
export async function callApi(action, params = {}) {
  const method = pickMethod_(action);
  const qs = new URLSearchParams({ action, ...params });

  let res;
  if (method === "GET") {
    res = await fetch(`${API_BASE}?${qs.toString()}`, {
      method: "GET",
      redirect: "follow",
    });
  } else {
    res = await fetch(API_BASE, {
      method: "POST",
      body: qs,
      redirect: "follow",
    });
  }

  const text = await res.text();

  try {
    const json = JSON.parse(text);

    // ✅ normalize: ถ้าโค้ดไหนเผลอส่ง ok มา ให้แปลงเป็น success
    if (json && json.ok !== undefined && json.success === undefined) {
      json.success = !!json.ok;
      delete json.ok;
    }

    return json;
  } catch {
    // เผื่อ error เป็นข้อความ/HTML
    return { success: false, message: "Non-JSON response", raw: text };
  }
}

/* ================= METHOD ROUTER ================= */
function pickMethod_(action) {
  // ✅ action ที่อยู่ doGet
  const GET_ACTIONS = new Set([
    "studentFindById",
    "adminGetDashboard",
    "adminGetTeachers",
    "adminGetStudents",
    "adminGetSessions",
    "adminGetStats",
    "teacherGetDashboard",
    "teacherGetSessionDetail",
    "teacherExportSession",
    "teacherExportAll",
  ]);

  return GET_ACTIONS.has(String(action || "")) ? "GET" : "POST";
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
