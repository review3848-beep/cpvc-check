// admin/js/admin-guard.js
if (localStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "login.html";
}
