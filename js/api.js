// js/api.js
// ไฟล์กลางไว้เก็บ URL ของ Web App (GAS)
export const API_BASE = "https://script.google.com/macros/s/AKfycbzA1qNwN1uDs40YWoEfg1rrN9Y_sYumjqDdLyiAM-n2dgZmOMbRkDG3PnF1LyVI1UfS/exec";

/**
 * เรียก API ที่ GAS
 * โครงสร้าง body: { action: "loginTeacher" | "openSession" | ... , ...payload }
 */
export async function callApi(action, payload = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },   // ใส่ header ให้เรียบร้อย
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }

  const data = await res.json();
  // ❌ ไม่ต้อง throw ถ้า success = false
  // ให้แต่ละหน้า (login, register, etc.) ไปเช็ก data.success กันเอง
  return data;
}
