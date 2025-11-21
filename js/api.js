// js/api.js
// ไฟล์กลางไว้เก็บ URL ของ Web App (GAS)
export const API_BASE = "https://script.google.com/macros/s/AKfycbzBGSBlnXB-Ol9Z0kAmexx-ZB1c7wRpZ5-q7kGvL_EP9l9GlMqz88Gv5Fhy17LTzLMoEg/exec";
/**
 * เรียก API ที่ GAS
 * โครงสร้าง body: { action: "loginTeacher" | "openSession" | ... , ...payload }
 * ให้ Code.gs ฝั่ง GAS อ่าน action แล้วไปทำงานตามฟังก์ชันที่ต้องการ
 */
export async function callApi(action, payload = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }

  const data = await res.json();
  // แนะนำให้ GAS ส่งรูปแบบ { success: true/false, message: "", data: {...} }
  if (!data.success) {
    throw new Error(data.message || "เกิดข้อผิดพลาดจากฝั่งเซิร์ฟเวอร์");
  }
  return data;
}