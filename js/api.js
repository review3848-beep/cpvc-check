// js/api.js
// ⚠️ อย่าลืมตรวจสอบ URL นี้ว่าเป็นอันล่าสุดที่คุณ Deploy หรือยังนะครับ
export const API_BASE = "https://script.google.com/macros/s/AKfycbyDtBc1SaBkP9z-m742a3IaTAkkWBCeb5oZtY1MFZf5gQ9aibOvZ7HWabA6OL_-Tfu_pg/exec";

export async function callApi(action, payload = {}) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      // ✅ เปลี่ยน header เป็น text/plain เพื่อแก้ CORS Error 100%
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
      body: JSON.stringify({
        action: action,
        ...payload
      })
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("API Error:", err);
    return { success: false, message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}