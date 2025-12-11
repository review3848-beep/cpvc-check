export const API_BASE = "https://script.google.com/macros/s/AKfycbwwQ6bK3gfW2QofjS6UpQjuvmzcV7SOxcd3MrqVi3gpF89otd-cW3Z_FUhh-U-WJhQ7Ig/exec";
export async function callApi(action, payload = {}) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
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