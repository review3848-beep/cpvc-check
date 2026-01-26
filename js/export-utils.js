// ../js/export-utils.js

export function stamp(){
  const d = new Date();
  const pad = (n) => String(n).padStart(2,"0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function downloadText(content, filename, mime){
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * ทำให้ Excel เปิด CSV ภาษาไทยไม่เพี้ยน:
 * - ใส่ BOM \uFEFF
 * - ใช้ CRLF
 */
export function downloadCsvExcelFriendly(csv, filename){
  const bom = "\uFEFF";
  const normalized = String(csv || "").replace(/\r?\n/g, "\r\n");
  downloadText(bom + normalized, filename, "text/csv;charset=utf-8;");
}

/**
 * แปลง array of objects -> CSV
 * @param {Array<Object>} rows
 * @param {Array<string>} headers
 */
export function objectsToCsv(rows, headers){
  const esc = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const lines = [];
  lines.push(headers.join(","));
  for(const r of rows){
    lines.push(headers.map(h => esc(r[h])).join(","));
  }
  return lines.join("\n");
}
