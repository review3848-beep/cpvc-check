// js/admin-dashboard.js
import { callApi } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const adminRaw = sessionStorage.getItem("admin");
  if (!adminRaw) {
    window.location.href = "login.html";
    return;
  }

  const admin = JSON.parse(adminRaw);
  const adminNameEl  = document.getElementById("adminName");
  const adminEmailEl = document.getElementById("adminEmail");
  const logoutBtn    = document.getElementById("logoutBtn");

  const sumTeachersEl   = document.getElementById("sumTeachers");
  const sumStudentsEl   = document.getElementById("sumStudents");
  const sumSessionsEl   = document.getElementById("sumSessions");
  const sumAttendanceEl = document.getElementById("sumAttendance");

  const chips     = document.querySelectorAll(".chip");
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");
  const tableTitle= document.getElementById("tableTitle");
  const msgEl     = document.getElementById("msg");

  // set admin name
  adminNameEl.textContent  = admin.name || "Admin";
  adminEmailEl.textContent = admin.email || "";

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("admin");
    window.location.href = "login.html";
  });

  const setMsg = (text, isError = false) => {
    msgEl.textContent = text || "";
    msgEl.className = "";
    if (!text) return;
    msgEl.classList.add(isError ? "msg-err" : "msg-ok");
  };

  // ดึง summary
  const loadSummary = async () => {
    try {
      const res = await callApi("getAdminSummary", {});
      if (!res.success) {
        setMsg(res.message || "โหลดสรุประบบไม่สำเร็จ", true);
        return;
      }
      const s = res.summary || {};
      sumTeachersEl.textContent   = s.teachers ?? 0;
      sumStudentsEl.textContent   = s.students ?? 0;
      sumSessionsEl.textContent   = s.sessions ?? 0;
      sumAttendanceEl.textContent = s.attendance ?? 0;
    } catch (err) {
      console.error(err);
      setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (summary)", true);
    }
  };

  // Render table helpers
  const renderEmpty = (text) => {
    tableHead.innerHTML = "";
    tableBody.innerHTML = `<tr><td class="empty" colspan="10">${text}</td></tr>`;
  };

  const renderTeachers = (rows) => {
    tableHead.innerHTML = `
      <tr>
        <th>ชื่อครู</th>
        <th>อีเมล</th>
        <th>รหัสผ่าน</th>
        <th>วันที่สร้าง</th>
      </tr>
    `;
    if (!rows || rows.length === 0) {
      renderEmpty("ยังไม่มีข้อมูลครู");
      return;
    }
    tableBody.innerHTML = rows.map(r => {
      const name  = r[0] || "";
      const email = r[1] || "";
      const pass  = r[2] || "";
      const dt    = r[3] ? new Date(r[3]) : "";
      const dtStr = dt ? dt.toLocaleString("th-TH") : "";
      return `
        <tr>
          <td>${name}</td>
          <td>${email}</td>
          <td>${pass}</td>
          <td>${dtStr}</td>
        </tr>
      `;
    }).join("");
  };

  const renderStudents = (rows) => {
    tableHead.innerHTML = `
      <tr>
        <th>รหัสนักเรียน</th>
        <th>ชื่อ</th>
        <th>มีรหัสผ่าน?</th>
        <th>อื่น ๆ</th>
      </tr>
    `;
    if (!rows || rows.length === 0) {
      renderEmpty("ยังไม่มีข้อมูลนักเรียน");
      return;
    }
    tableBody.innerHTML = rows.map(r => {
      const id   = r[0] || "";
      const name = r[1] || "";
      const pass = r[2] || "";
      const hasPass = pass ? "✅ ตั้งแล้ว" : "⏳ ยังไม่ได้ตั้ง";
      const other = (r.slice(3) || []).join(" | ");
      return `
        <tr>
          <td>${id}</td>
          <td>${name}</td>
          <td>${hasPass}</td>
          <td>${other}</td>
        </tr>
      `;
    }).join("");
  };

  const renderSessions = (rows) => {
    tableHead.innerHTML = `
      <tr>
        <th>อีเมลครู</th>
        <th>รายวิชา</th>
        <th>ห้อง</th>
        <th>TOKEN</th>
        <th>สถานะ</th>
        <th>เวลาเริ่มคาบ</th>
      </tr>
    `;
    if (!rows || rows.length === 0) {
      renderEmpty("ยังไม่มีคาบเรียนในระบบ");
      return;
    }
    tableBody.innerHTML = rows.map(r => {
      const email   = r[0] || "";
      const subject = r[1] || "";
      const room    = r[2] || "";
      const token   = r[3] || "";
      const status  = (r[4] || "").toString().toUpperCase();
      const dt      = r[5] ? new Date(r[5]) : "";
      const dtStr   = dt ? dt.toLocaleString("th-TH") : "";
      const badgeClass = status === "OPEN" ? "badge-open" : "badge-closed";
      return `
        <tr>
          <td>${email}</td>
          <td>${subject}</td>
          <td>${room}</td>
          <td>${token}</td>
          <td><span class="badge-status ${badgeClass}">${status}</span></td>
          <td>${dtStr}</td>
        </tr>
      `;
    }).join("");
  };

  const renderAttendance = (rows) => {
    tableHead.innerHTML = `
      <tr>
        <th>ครู</th>
        <th>รหัส นร.</th>
        <th>ชื่อ นร.</th>
        <th>วันที่เวลา</th>
        <th>TOKEN</th>
        <th>สถานะ</th>
      </tr>
    `;
    if (!rows || rows.length === 0) {
      renderEmpty("ยังไม่มีการเช็คชื่อในระบบ");
      return;
    }
    tableBody.innerHTML = rows.map(r => {
      const teacher = r[0] || "";
      const id      = r[1] || "";
      const name    = r[2] || "";
      const dt      = r[3] ? new Date(r[3]) : "";
      const dtStr   = dt ? dt.toLocaleString("th-TH") : "";
      const token   = r[4] || "";
      const status  = (r[5] || "").toString().toUpperCase();
      let statusText = status;
      if (status === "OK")    statusText = "มา";
      if (status === "LATE")  statusText = "สาย";
      if (status === "ABSENT")statusText = "ขาด";

      return `
        <tr>
          <td>${teacher}</td>
          <td>${id}</td>
          <td>${name}</td>
          <td>${dtStr}</td>
          <td>${token}</td>
          <td>${statusText}</td>
        </tr>
      `;
    }).join("");
  };

  // โหลด data ตาม type
  const loadData = async (type) => {
    setMsg("");
    tableBody.innerHTML = `<tr><td class="empty" colspan="10">กำลังโหลดข้อมูล...</td></tr>`;

    try {
      let action;
      let title;
      switch (type) {
        case "teachers":
          action = "getTeachers";
          title = "แสดงรายการครูทั้งหมด";
          break;
        case "students":
          action = "getStudents";
          title = "แสดงรายชื่อนักเรียนทั้งหมด";
          break;
        case "sessions":
          action = "getSessions";
          title = "แสดงคาบเรียนทั้งหมด";
          break;
        case "attendance":
          action = "getAttendance";
          title = "แสดงประวัติการเช็คชื่อทั้งหมด";
          break;
        default:
          action = "getTeachers";
          title = "แสดงรายการครูทั้งหมด";
      }

      tableTitle.textContent = title;

      const res = await callApi(action, {});
      if (!res.success) {
        renderEmpty(res.message || "โหลดข้อมูลไม่สำเร็จ");
        return;
      }

      const rows = res.data || [];

      if (type === "teachers")    renderTeachers(rows);
      if (type === "students")    renderStudents(rows);
      if (type === "sessions")    renderSessions(rows);
      if (type === "attendance")  renderAttendance(rows);

    } catch (err) {
      console.error(err);
      renderEmpty("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // event chips
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const type = chip.dataset.type;
      loadData(type);
    });
  });

  // init
  loadSummary();
  loadData("teachers");
});
