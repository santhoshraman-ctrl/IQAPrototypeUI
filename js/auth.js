// Shared sign-in gate + top-bar (avatar, profile menu, sign out) for every page except login.
// Loaded after config.js. Sets window.IQA_AUTH.ok = false when it redirects to sign-in.
(function () {
  const cfg = window.IQA_CONFIG || {};
  const SIGN_IN_URL = cfg.SIGN_IN_URL || "login.html";

  // Prototype user. Replace with the real signed-in user from your session/API later.
  const USER = { name: "Alex Morgan", email: "alex.morgan@company.com", role: "Campaign Manager" };
  window.IQA_USER = USER;

  // 1. Gate: same rule as index.html (sessionStorage flag set by login.html).
  const needsGate = cfg.USE_MOCKS !== false;
  if (needsGate && !sessionStorage.getItem("iqa_auth")) {
    window.IQA_AUTH = { ok: false };
    location.href = SIGN_IN_URL + "?return=" + encodeURIComponent(location.pathname + location.search);
    return;
  }
  window.IQA_AUTH = { ok: true };

  // 2. Top bar
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const avatar = $("#avatar"), userName = $("#user-name"), who = $("#menu-who");
  const btn = $("#user-btn"), menu = $("#user-menu"), signout = $("#signout");
  if (!btn || !menu) return;

  avatar.textContent = USER.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  userName.innerHTML = esc(USER.name) + "<small>" + esc(USER.role) + "</small>";
  who.innerHTML = "<strong>" + esc(USER.name) + "</strong>" + esc(USER.email);

  const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { close(); btn.focus(); } });
  signout.addEventListener("click", () => {
    close();
    sessionStorage.removeItem("iqa_auth");
    location.href = SIGN_IN_URL;
  });
})();
