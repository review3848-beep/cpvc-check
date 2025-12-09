export const API_BASE = "https://script.google.com/macros/s/AKfycbxXZy_ebPiGJEDMa2Q7EPfaTCE5RkSe7OnlZ_et3-HtR74uGP1EVigXjbbucDJBRSqRTw/exec";
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