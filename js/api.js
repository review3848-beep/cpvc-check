export const API_BASE = "https://script.google.com/macros/s/AKfycbwUWZKVxs8aJ307gOAqjLLh3c3fb4SgT-iR5B091YwA-K-aktCK0LT9VANN5C80nGPD5Q/exec";
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