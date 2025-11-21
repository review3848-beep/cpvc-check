// js/api.js

// TODO: แก้เป็น Web App URL ของ Google Apps Script ของคุณ
export const API_BASE = "https://script.google.com/macros/s/AKfycbx0TtGAc0RU4xksCRvsW2j0S9ABinyOqVz7gwCJ8-3kJoUWB8Z5kK0gsYAWo8XkyUFu/exec";


/**
 * เรียก API ที่ GAS
 * โครงสร้าง body: { action: "loginTeacher" | "openSession" | ... , ...payload }
 * ให้ Code.gs ฝั่ง GAS อ่าน action แล้วไปทำงานตามฟังก์ชันที่ต้องการ
 */
export async function callApi(action, payload = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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