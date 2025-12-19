export const API_BASE = "https://script.google.com/macros/s/AKfycbwPXhI-rDvG42gAkvpoyOXYiteBI_YBxrj_TiHD5E9CwpPt082t6dOgGF9WpCUal6ZkkQ/exec";

export async function callApi(action, payload = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  return res.json();
}
