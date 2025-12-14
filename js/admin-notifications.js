import { callApi } from "../js/api.js";
import { guardAdmin } from "./js/admin-guard.js";

guardAdmin(); // ทุก role เข้าได้

const list = document.getElementById("notifyList");

async function loadNotifications(){
  try{
    const data = await callApi("adminNotifications");
    list.innerHTML = "";

    if(!data || !data.length){
      list.innerHTML = "<p>ไม่มีแจ้งเตือน</p>";
      return;
    }

    data.forEach(n=>{
      const div = document.createElement("div");
      div.className = "card" + (n.read ? "" : " unread");
      div.innerHTML = `
        <h4>${n.title}</h4>
        <p>${n.text}</p>
        <div class="time">${n.time}</div>
      `;
      list.appendChild(div);
    });
  }catch(e){
    list.textContent = "โหลดข้อมูลไม่สำเร็จ";
  }
}

loadNotifications();
