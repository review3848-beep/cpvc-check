export const API_BASE = "https://script.google.com/macros/s/AKfycbwJzhGkEariy1qYaCxCm5NT0GJcH5GiYwVab5Z29ETRXysZy3arp-RtMZHcQ8N0q9qowA/exec";
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