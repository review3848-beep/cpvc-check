// js/api.js
// ⚠️ อย่าลืมตรวจสอบ URL นี้ว่าเป็นอันล่าสุดที่คุณ Deploy หรือยังนะครับ
export const API_BASE = "https://script.google.com/macros/s/AKfycbzA1qNwN1uDs40YWoEfg1rrN9Y_sYumjqDdLyiAM-n2dgZmOMbRkDG3PnF1LyVI1UfS/exec";

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