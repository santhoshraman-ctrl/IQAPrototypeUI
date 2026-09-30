/* IQA triage: the status of each issue or difference, who corrected it and why, and the audit log.
   Replaces the earlier triage.js. There is no Owner any more.

   Public API (used by index.html and compare.js):
     setCampaign(id)      load the saved state for a campaign (kept in this browser for now)
     setActor({name,role}) who is signed in; stamped on every change
     get(id)              {status, method, reason, by, role, at, run}
     counts(ids)          {total, open, resolved, waived}
     controlsHtml(id,title)  the status buttons + "how was it corrected" form
     summaryHtml(id)      one line: status, who, when, how, reason
     correction(id)       null while open, else {name, role, method, methodLabel, reason, when, run}
     log([all])           audit entries, newest first (failed re-runs only when all = true, for admins)
     fail(reason)         record a failed re-run (shown to admins only)
     lastRerun()          the latest re-check {by, at, when, run} or null
     stamp(iso)           full date and time, e.g. 1 Oct 2026, 7:05 PM
     logHtml()            the audit log as a table
     rerun([{name,role}]) record a re-run of the checks (run number goes up); pass a person to record a teammate's
     runNumber()          current run number
     feedback()           {human, ai, total, withReason} across everything currently corrected
     onChange(fn), bind(), clearAll(), statusLabel(s)

   Production: replace load()/save() with calls to your backend. The entry shape in log() is what to store. */
(function () {
  "use strict";
  var STATUS = { open: "Open", resolved: "Resolved", waived: "Waived" };
  var METHOD = { human: "Human correction", ai: "AI correction" };
  var campaignId = "default", actor = { name: "Unknown", role: "" }, listeners = [];
  var state = fresh();
  var mem = {};   // fallback when localStorage is blocked

  function fresh() { return { items: {}, log: [], run: 1 }; }
  function key() { return "iqa_triage_v2:" + campaignId; }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(key()); } catch (e) { raw = mem[key()] || null; }
    try { var v = raw ? JSON.parse(raw) : null; state = v && v.items ? v : fresh(); } catch (e) { state = fresh(); }
  }
  function save() {
    var raw = JSON.stringify(state);
    try { localStorage.setItem(key(), raw); } catch (e) { mem[key()] = raw; }
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function when(at) {
    if (!at) return "";
    try { return new Date(at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
  }
  function whenFull(at) {
    if (!at) return "";
    try { return new Date(at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; }
  }
  function emit() { paintAll(); listeners.slice().forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }

  /* ---------- state ---------- */
  function get(id) { var it = state.items[id]; return it ? Object.assign({}, it) : { status: "open" }; }
  function counts(ids) {
    var c = { total: ids.length, open: 0, resolved: 0, waived: 0 };
    ids.forEach(function (id) { c[get(id).status]++; });
    return c;
  }
  function set(id, title, patch) {
    var prev = get(id).status, to = patch.status;
    if (to !== "open") {
      if (to === "resolved" && !METHOD[patch.method]) return { ok: false, error: "Choose who corrected it: a person or AI." };
      if (!String(patch.reason || "").trim()) return { ok: false, error: to === "waived" ? "Add a reason for accepting this risk." : "Add a short reason for the correction." };
    }
    var at = new Date().toISOString();
    if (to === "open") delete state.items[id];
    else state.items[id] = { status: to, method: to === "resolved" ? patch.method : null, reason: String(patch.reason).trim(), by: actor.name, role: actor.role, at: at, run: state.run, title: title || id };
    state.log.push({ type: "status", id: id, title: title || id, from: prev, to: to, method: to === "resolved" ? patch.method : null, reason: to === "open" ? "" : String(patch.reason).trim(), by: actor.name, role: actor.role, at: at, run: state.run });
    save(); emit();
    return { ok: true };
  }
  function rerun(who) {
    var a = who && who.name ? { name: who.name, role: who.role || "" } : actor;   // "who" lets the demo (or a backend event) record a teammate's re-run
    state.run += 1;
    state.log.push({ type: "rerun", by: a.name, role: a.role, at: new Date().toISOString(), run: state.run });
    save(); emit(); return state.run;
  }
  function feedback() {
    var f = { human: 0, ai: 0, total: 0, withReason: 0 };
    Object.keys(state.items).forEach(function (id) {
      var it = state.items[id]; if (it.status !== "resolved") return;
      f.total++; if (it.method === "ai") f.ai++; else f.human++;
      if (it.reason) f.withReason++;
    });
    return f;
  }
  function correction(id) {
    var it = state.items[id]; if (!it) return null;
    return { status: it.status, name: it.by, role: it.role, method: it.method, methodLabel: it.method ? METHOD[it.method] : "", reason: it.reason, when: when(it.at), whenFull: whenFull(it.at), at: it.at, run: it.run };
  }

  /* ---------- markup ---------- */
  function summaryHtml(id) {
    var c = correction(id); if (!c) return "";
    var how = c.status === "resolved" ? c.methodLabel : "Risk accepted";
    return '<span class="tri-line"><b>' + STATUS[c.status] + "</b> · " + esc(how) + " · " + esc(c.name) + " · " + esc(c.when) + " · Run " + c.run + "</span>" +
      (c.reason ? '<span class="tri-why">“' + esc(c.reason) + "”</span>" : "");
  }
  function controlsHtml(id, title) {
    var seg = ["open", "resolved", "waived"].map(function (s) {
      return '<button type="button" class="tri-b tri-b-' + s + '" data-tri-status="' + s + '" aria-pressed="false">' + STATUS[s] + "</button>";
    }).join("");
    return '<div class="tri-ctl" data-tri="' + esc(id) + '" data-title="' + esc(title || id) + '">' +
      '<div class="tri-seg" role="group" aria-label="Status for ' + esc(title || id) + '">' + seg + "</div>" +
      '<div class="tri-form" hidden></div><div class="tri-done"></div></div>';
  }
  function formHtml(status, uid) {
    var how = status === "resolved"
      ? '<fieldset class="tri-how"><legend>Who corrected it?</legend>' +
        '<label><input type="radio" name="how-' + uid + '" value="human"> <span><b>Human correction</b><small>You fixed it yourself.</small></span></label>' +
        '<label><input type="radio" name="how-' + uid + '" value="ai"> <span><b>AI correction</b><small>You applied the fix Claude suggested.</small></span></label></fieldset>'
      : "";
    return how + '<label class="tri-reason"><span>' + (status === "waived" ? "Why are you accepting this risk?" : "Reason for this correction") + '</span>' +
      '<textarea rows="2" maxlength="280" placeholder="' + (status === "waived" ? "e.g. Approved by the client, low spend at risk" : "e.g. Geo list replaced with the approved 12 DMAs") + '"></textarea></label>' +
      '<p class="tri-note">Saved with your name and time. Counts toward the confidence score.</p>' +
      '<p class="tri-err" role="alert" hidden></p>' +
      '<div class="tri-actions"><button type="button" class="tri-save">Save</button><button type="button" class="tri-cancel">Cancel</button></div>';
  }

  /* ---------- painting ---------- */
  var seq = 0;
  function paint(ctl) {
    var id = ctl.getAttribute("data-tri"), st = get(id), pending = ctl.getAttribute("data-pending");
    var shown = pending || st.status;
    ctl.querySelectorAll("[data-tri-status]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tri-status") === shown)); });
    var form = ctl.querySelector(".tri-form"), done = ctl.querySelector(".tri-done");
    if (pending) { done.innerHTML = ""; return; }   // leave the form alone while someone is typing
    form.hidden = true; form.innerHTML = "";
    done.innerHTML = st.status === "open" ? "" : summaryHtml(id);
  }
  function paintAll() { document.querySelectorAll(".tri-ctl").forEach(paint); }
  function openForm(ctl, status) {
    ctl.setAttribute("data-pending", status);
    var form = ctl.querySelector(".tri-form"); form.innerHTML = formHtml(status, ++seq); form.hidden = false;
    paint(ctl); var t = form.querySelector("textarea"); if (t) t.focus();
  }
  function closeForm(ctl) { ctl.removeAttribute("data-pending"); paint(ctl); }

  document.addEventListener("click", function (e) {
    // a pop-up form closes when you click anywhere outside it
    document.querySelectorAll(".tri-pop .tri-ctl[data-pending]").forEach(function (c) { if (!c.contains(e.target)) closeForm(c); });
    var b = e.target.closest && e.target.closest("[data-tri-status], .tri-save, .tri-cancel");
    if (!b) return;
    var ctl = b.closest(".tri-ctl"); if (!ctl) return;
    var id = ctl.getAttribute("data-tri"), title = ctl.getAttribute("data-title");
    if (b.matches("[data-tri-status]")) {
      var s = b.getAttribute("data-tri-status");
      if (s === "open") { closeForm(ctl); if (get(id).status !== "open") set(id, title, { status: "open" }); else paint(ctl); }
      else if (get(id).status === s && !ctl.getAttribute("data-pending")) { /* already in this status */ }
      else openForm(ctl, s);
    } else if (b.matches(".tri-cancel")) closeForm(ctl);
    else if (b.matches(".tri-save")) {
      var status = ctl.getAttribute("data-pending"), radio = ctl.querySelector("input[type=radio]:checked");
      var res = set(id, title, { status: status, method: radio && radio.value, reason: ctl.querySelector("textarea").value });
      var err = ctl.querySelector(".tri-err");
      if (!res.ok) { err.textContent = res.error; err.hidden = false; return; }
      ctl.removeAttribute("data-pending"); paint(ctl);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var ctl = e.target.closest && e.target.closest(".tri-ctl[data-pending]"); if (ctl) { e.stopPropagation(); closeForm(ctl); } }
  }, true);

  /* ---------- audit log ---------- */
  function log(all) { var r = state.log.slice().reverse(); return all ? r : r.filter(function (e) { return e.type !== "rerun_failed"; }); }   // failed re-runs are for admins only: pass true to include them
  function fail(reason) {
    state.log.push({ type: "rerun_failed", by: actor.name, role: actor.role, at: new Date().toISOString(), run: state.run, reason: String(reason || "Unknown error") });
    save(); emit();
  }
  function lastRerun() {
    for (var i = state.log.length - 1; i >= 0; i--) if (state.log[i].type === "rerun") { var r = state.log[i]; return { by: r.by, role: r.role, at: r.at, when: whenFull(r.at), run: r.run }; }
    return null;
  }
  function logHtml(all) {
    var rows = log(all);
    if (!rows.length) return '<p class="tri-empty">Nothing has been corrected yet. Each correction and re-run will be listed here with who did it and when.</p>';
    return '<div class="tri-logwrap"><table class="tri-log"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Change</th><th>How and why</th><th>Run</th></tr></thead><tbody>' +
      rows.map(function (r) {
        if (r.type === "rerun_failed") return "<tr class=\"rr bad\"><td>" + esc(whenFull(r.at)) + "</td><td>" + esc(r.by) + "</td><td colspan=\"3\"><b>Re-run failed</b> · " + esc(r.reason) + "</td><td>Run " + r.run + "</td></tr>";
        if (r.type === "rerun") return "<tr class=\"rr\"><td>" + esc(whenFull(r.at)) + "</td><td>" + esc(r.by) + "</td><td colspan=\"3\"><b>Re-ran the checks</b></td><td>Run " + r.run + "</td></tr>";
        var chg = STATUS[r.from] + " → " + STATUS[r.to];
        var how = r.to === "resolved" ? METHOD[r.method] : r.to === "waived" ? "Risk accepted" : "Reopened";
        return "<tr><td>" + esc(whenFull(r.at)) + "</td><td>" + esc(r.by) + (r.role ? "<small>" + esc(r.role) + "</small>" : "") + "</td><td>" + esc(r.title) + "</td><td>" + esc(chg) + "</td><td><b>" + esc(how) + "</b>" + (r.reason ? "<small>" + esc(r.reason) + "</small>" : "") + "</td><td>Run " + r.run + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  /* ---------- styles (self-contained) ---------- */
  var css = "" +
    ".tri-ctl{display:grid;gap:10px}" +
    ".tri-seg{display:inline-flex;border:1px solid var(--line,#CBD3DC);border-radius:8px;overflow:hidden;width:max-content;max-width:100%}" +
    ".tri-b{font:inherit;font-size:13px;font-weight:600;padding:6px 14px;border:0;background:#fff;color:var(--ink-2,#44505E);cursor:pointer;border-right:1px solid var(--line,#CBD3DC)}" +
    ".tri-b:last-child{border-right:0}.tri-b:hover{background:var(--sunken,#F1F4F7)}" +
    ".tri-b:focus-visible{outline:2px solid var(--accent,#1F4583);outline-offset:-2px}" +
    ".tri-b[aria-pressed=true].tri-b-open{background:#E8EEF8;color:#1F4583}" +
    ".tri-b[aria-pressed=true].tri-b-resolved{background:#E6F6EC;color:#1B6B3C}" +
    ".tri-b[aria-pressed=true].tri-b-waived{background:#FFF4DC;color:#8A5200}" +
    ".tri-form{display:grid;gap:10px;padding:12px 14px;border:1px solid var(--line,#DCE1E7);border-radius:10px;background:#fff;max-width:560px}" +
    ".tri-how{border:0;margin:0;padding:0;display:grid;gap:6px}.tri-how legend{font-size:13px;font-weight:600;margin-bottom:4px;padding:0}" +
    ".tri-how label{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line,#DCE1E7);border-radius:8px;cursor:pointer}" +
    ".tri-how small{display:block;color:var(--ink-3,#6B7785);font-size:12.5px}" +
    ".tri-reason{display:grid;gap:4px;font-size:13px;font-weight:600}.tri-reason textarea{font:inherit;font-weight:400;font-size:14px;padding:8px 10px;border:1px solid var(--line,#CBD3DC);border-radius:8px;resize:vertical}" +
    ".tri-note{margin:0;font-size:12.5px;color:var(--ink-3,#6B7785)}.tri-err{margin:0;font-size:13px;color:#B42318;font-weight:600}" +
    ".tri-actions{display:flex;gap:10px}.tri-save{font:inherit;font-size:13px;font-weight:600;padding:7px 16px;border-radius:8px;border:0;background:var(--accent,#1F4583);color:#fff;cursor:pointer}" +
    ".tri-cancel{font:inherit;font-size:13px;padding:7px 12px;border:0;background:none;color:var(--accent,#1F4583);cursor:pointer}" +
    ".tri-done{display:grid;gap:2px;font-size:13px;color:var(--ink-2,#44505E)}.tri-done:empty{display:none}.tri-why{color:var(--ink-3,#6B7785);font-style:italic}" +
    ".tri{font-weight:600;font-size:13px}.tri-resolved{color:#1B6B3C}.tri-waived{color:#8A5200}.tri-open{color:#44505E}" +
    ".corr-who{display:block;font-weight:600;font-size:13px}.corr-meta{display:block;font-size:12px;color:var(--ink-3,#6B7785)}" +
    ".tri-logwrap{overflow:auto}.tri-log{width:100%;border-collapse:collapse;font-size:13px}" +
    ".tri-log th,.tri-log td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line,#DCE1E7)}" +
    ".tri-log th{font-size:12px;color:var(--ink-3,#6B7785);font-weight:600}.tri-log small{display:block;color:var(--ink-3,#6B7785);font-size:12px}" +
    ".tri-log tr.rr.bad{background:#FDF1F0}.tri-log tr.rr{background:#F3F7FD}.tri-empty{margin:0;color:var(--ink-3,#6B7785);font-size:14px}" +
    ".tri-pop,.tri-pop .tri-ctl{position:relative}.tri-pop .tri-ctl{justify-items:end}" +
    ".tri-pop .tri-form{position:absolute;top:calc(100% + 6px);right:0;width:min(380px,calc(100vw - 32px));z-index:60;box-shadow:0 12px 32px rgba(24,33,43,.2);text-align:left}" +
    ".tri-pop .tri-done{text-align:right;max-width:320px}" +
    "@media (max-width:700px){.tri-pop .tri-ctl{justify-items:start}.tri-pop .tri-form{position:static;width:auto;box-shadow:none}.tri-pop .tri-done{text-align:left}}" +
    "@media (max-width:640px){.tri-seg{width:100%}.tri-b{flex:1}}";
  var st = document.createElement("style"); st.setAttribute("data-iqa-triage", ""); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  window.IQA_TRIAGE = {
    setCampaign: function (id) { campaignId = id || "default"; load(); paintAll(); },
    setActor: function (a) { actor = { name: (a && a.name) || "Unknown", role: (a && a.role) || "" }; },
    get: get, counts: counts, statusLabel: function (s) { return STATUS[s] || s; },
    controlsHtml: controlsHtml, summaryHtml: summaryHtml, correction: correction,
    log: log, fail: fail, lastRerun: lastRerun, stamp: whenFull, logHtml: logHtml, rerun: rerun, runNumber: function () { return state.run; }, feedback: feedback,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    bind: function () {},   // clicks are handled for the whole page, nothing to bind
    clearAll: function () { state = fresh(); save(); emit(); }
  };
})();
