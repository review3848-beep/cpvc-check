export const API_BASE = "https://script.google.com/macros/s/AKfycbxfPE2-GzbzDKF5kzNV3gaqk2ibitwfBucTe-b2oGu493pao-DKh5lvbLtDrjexOmj6_Q/exec";

export async function callApi(action, payload = {}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  return res.json();
}
