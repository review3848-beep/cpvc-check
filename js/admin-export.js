// ../js/admin-export.js
import { callApi } from "../api.js";
import { stamp, downloadCsvExcelFriendly, objectsToCsv } from "./export-utils.js";

/**
 * เรียก action ของ GS แล้วดาวน์โหลด CSV
 * - ถ้า GS ส่ง {success:true, csv:"..."} -> ดาวน์โหลดเลย
 * - ถ้า GS ไม่ได้ส่ง csv -> fallback: ดึง list แล้วแปลงเป็น CSV
 */
export async function exportFromGs(actionExport, actionList, filenameBase, headers){
  // 1) ลอง export ตรงจาก GS ก่อน
  try{
    const res = await callApi(actionExport, {});
    if(res?.success && res.csv){
      downloadCsvExcelFriendly(res.csv, `${filenameBase}_${stamp()}.csv`);
      return { ok:true, mode:"gs_csv" };
    }
  }catch{
    // เงียบๆ แล้ว fallback
  }

  // 2) fallback: list แล้วแปลงเอง
  if(!actionList) return { ok:false, mode:"no_fallback", message:"ไม่มี actionList สำหรับ fallback" };

  const res2 = await callApi(actionList, {});
  if(!res2?.success) return { ok:false, mode:"fallback_failed", message: res2?.message || "โหลดข้อมูลไม่สำเร็จ" };

  const list = res2.rows || res2.data || res2.sessions || [];
  const csv = objectsToCsv(list, headers);
  downloadCsvExcelFriendly(csv, `${filenameBase}_${stamp()}.csv`);
  return { ok:true, mode:"fallback_list_to_csv" };
}

/* ====== preset exports (ให้เรียกง่ายในแต่ละหน้า) ====== */

// Sessions
export async function exportSessions(){
  // จาก GS ของคุณ:
  // - list (doPost) มี "adminSessions"
  // - export (doPost) มี "adminExportSessions"
  const headers = ["ID","TEACHER_EMAIL","SUBJECT","ROOM","TOKEN","STATUS","START_TIME"];
  return exportFromGs("adminExportSessions", "adminSessions", "sessions", headers);
}

// Students
export async function exportStudents(){
  // list: doPost มี "adminStudents"
  // export: ถ้ายังไม่มี ให้ใช้ fallback list->csv ก่อน (actionExport ใส่ null ได้)
  const headers = ["STUDENT_ID","NAME","CREATED_AT"]; // ปรับตามหัวตารางจริงของคุณ
  return exportFromGs(null, "adminStudents", "students", headers);
}

// Teachers
export async function exportTeachers(){
  const headers = ["TEACHER_ID","NAME","TEACHER_EMAIL","CREATED_AT"]; // ปรับตามชีตจริง
  return exportFromGs(null, "adminTeachers", "teachers", headers);
}

// Attendance
export async function exportAttendance(){
  // ถ้ามี action export ของ attendance ให้ใส่เพิ่ม (ตอนนี้ใน GS คุณมี teacherExportAll แต่เป็นฝั่งครู)
  const headers = ["SESSION_ID","STUDENT_ID","SUBJECT","TOKEN","TEACHER_EMAIL","STATUS","TIME","ROOM"]; // ปรับตามชีตจริง
  return exportFromGs(null, "adminAttendance", "attendance", headers);
}
