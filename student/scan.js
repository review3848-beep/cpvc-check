import { callApi } from "../js/api.js";

/* ================= DOM ================= */
const tokenInput = document.getElementById("tokenInput");
const submitBtn  = document.getElementById("submitTokenBtn");
const msgEl      = document.getElementById("scanMsg");
const dotEl      = document.getElementById("sessionStatusDot");
const statusText = document.getElementById("sessionStatusText");
const shell      = document.querySelector(".scan-shell");
const userNameEl = document.getElementById("pillUserName");

/* ================= INIT ================= */
const student = JSON.parse(localStorage.getItem("cpvc_student") || "null");
if (!student) location.href = "login.html";
userNameEl.textContent = student.name || "นักเรียน";

submitBtn.addEventListener("click", submit);
tokenInput.addEventListener("keydown", e=>{
  if(e.key==="Enter") submit();
});

/* ================= SUBMIT ================= */
async function submit(){
  const token = tokenInput.value.trim().toUpperCase();
  resetUI();

  if(!token){
    showInline("⚠️ กรุณากรอก TOKEN", "error");
    vibrate(80);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังเช็คชื่อ...";

  try{
    const res = await callApi("studentCheckin", {
      studentId: student.studentId,
      token
    });

    if(!res.success) throw new Error(res.message);

    // ===== STATUS LOGIC =====
    // default = OK
    let status = res.status || "OK";
    showResult(status);

  }catch(err){
    showResult("ERROR", err.message);
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "ยืนยันเช็คชื่อ";
  }
}

/* ================= RESULT ================= */
function showResult(status, errorMsg=""){
  let title="", detail="", color="";

  if(status==="OK"){
    title="✅ เช็คชื่อสำเร็จ";
    detail="บันทึกเวลาเข้าเรียนเรียบร้อย";
    color="ok";
    dotEl.className="dot open";
  }
  else if(status==="LATE"){
    title="⏰ เช็คชื่อสำเร็จ (สาย)";
    detail="ระบบบันทึกว่าสาย";
    color="late";
    dotEl.className="dot open";
  }
  else{
    title="❌ เช็คชื่อไม่สำเร็จ";
    detail=errorMsg || "TOKEN ไม่ถูกต้องหรือคาบปิดแล้ว";
    color="error";
    dotEl.className="dot error";
  }

  statusText.textContent = title;
  applyCardColor(color);
  showPopup(title, detail, color);
  vibrate(color==="error" ? 200 : 80);

  if(color!=="error"){
    setTimeout(()=>location.href="dashboard.html",3000);
  }
}

/* ================= POPUP ================= */
function showPopup(title, detail, type){
  const popup = document.createElement("div");
  popup.innerHTML = `
    <div class="popup-backdrop">
      <div class="popup ${type}">
        <div class="popup-icon">
          ${type==="ok"?"🎉":type==="late"?"⏰":"❌"}
        </div>
        <h3>${title}</h3>
        <p>${detail}</p>
        <small>กำลังกลับอัตโนมัติ...</small>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  setTimeout(()=>popup.remove(),3200);
}

/* ================= UI HELPERS ================= */
function resetUI(){
  msgEl.textContent="";
  shell.classList.remove("result-ok","result-error");
}

function showInline(text,type){
  msgEl.textContent=text;
  msgEl.className = type==="error" ? "" : "scanMsg-success";
}

function applyCardColor(type){
  shell.classList.remove("result-ok","result-error");
  if(type==="ok"||type==="late") shell.classList.add("result-ok");
  if(type==="error") shell.classList.add("result-error");
}

function vibrate(ms){
  if(navigator.vibrate) navigator.vibrate(ms);
}

/* ================= POPUP STYLE ================= */
const style=document.createElement("style");
style.textContent=`
.popup-backdrop{
  position:fixed;inset:0;
  background:rgba(2,6,23,.65);
  backdrop-filter:blur(10px);
  display:flex;align-items:center;justify-content:center;
  z-index:9999;
  animation:fadeIn .25s;
}
.popup{
  width:85%;max-width:320px;
  background:rgba(15,23,42,.98);
  border-radius:24px;
  padding:22px 18px;
  text-align:center;
  color:#fff;
  animation:pop .35s cubic-bezier(.2,.8,.2,1);
}
.popup.ok{box-shadow:0 0 40px rgba(34,197,94,.5)}
.popup.late{box-shadow:0 0 40px rgba(250,204,21,.5)}
.popup.error{box-shadow:0 0 40px rgba(248,113,113,.5)}

.popup-icon{font-size:2.2rem;margin-bottom:.4rem}
.popup h3{margin:.2rem 0;font-size:1.2rem}
.popup p{margin:.2rem 0 .6rem;font-size:.9rem;color:#cbd5f5}
.popup small{font-size:.7rem;color:#94a3b8}

@keyframes pop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;
document.head.appendChild(style);
