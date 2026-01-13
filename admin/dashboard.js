// admin/dashboard.js

document.addEventListener("DOMContentLoaded", init);

function init() {
  // แสดงชื่อแอดมิน (ถ้ามี session ใน localStorage)
  const adminNameEl = document.getElementById("adminName");
  const admin = JSON.parse(localStorage.getItem("admin") || "null");
  if (admin && admin.name) {
    adminNameEl.textContent = admin.name;
  }

  // ปุ่ม Manage -> ไปหน้าครู
  const btnManage = document.getElementById("btnManage");
  if (btnManage) {
    btnManage.addEventListener("click", () => {
      // ปรับ path ให้ตรงโครงของคุณ
      // จากรูปคุณยังไม่มีโฟลเดอร์ teacher
      // ตอนนี้ลองพาไป student/login.html เพื่อพิสูจน์ว่าปุ่มทำงาน
      window.location.href = "../student/login.html";
      // ถ้าคุณสร้างโฟลเดอร์ teacher แล้ว ให้เปลี่ยนเป็น:
      // window.location.href = "../teacher/login.html";
    });
  }

  // ปุ่ม Refresh
  const btnRefresh = document.getElementById("btnRefresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      location.reload();
    });
  }

  // placeholder: โหลดข้อมูลแดชบอร์ด (ต่อ GAS ทีหลัง)
  renderEmpty();
}

function renderEmpty() {
  // ค่าเริ่มต้น
  setText("totalTeachers", "-");
  setText("totalStudents", "-");
  setText("todaySessions", "-");
  setText("totalAttendance", "-");

  const tbody = document.getElementById("recentSessions");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">ยังไม่ได้เชื่อม API</td></tr>`;
  }

  const footer = document.getElementById("footerNote");
  if (footer) {
    footer.textContent = "Last sync: -";
  }
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}
