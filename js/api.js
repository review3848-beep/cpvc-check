export const API_BASE = "https://script.google.com/macros/s/AKfycbwrjtB0PjqySgp71udVdix5TjDYPyX_82cWl9xcZha3Uy1nmfYCQWWlGfN8GxLqaVNhcQ/exec";
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