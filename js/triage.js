// Shared "working list" state: every issue or difference gets a status and an owner.
// Used by the Summary tab (Potential issues) and the Line-by-line comparison (differences).
// Stored per campaign in this browser for the prototype. For production, replace load()/save()
// with calls to your backend and keep the rest as it is.
window.IQA_TRIAGE = (function () {
  const OWNERS = [
    "Unassigned",
    "Alex Morgan (you)",
    "Jordan Lee · Trafficker",
    "Sam Patel · Media planner",
    "Taylor Brooks · Account lead"
  ];
  const STATUSES = [["open", "Open"], ["resolved", "Resolved"], ["waived", "Waived"]];
  const listeners = [];
  let campaignId = "default";

  const key = () => "iqa_triage:" + campaignId;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function load() { try { return JSON.parse(localStorage.getItem(key()) || "{}"); } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(key(), JSON.stringify(d)); } catch (e) {} }

  function setCampaign(id) { campaignId = id || "default"; }
  function get(id) { return Object.assign({ status: "open", owner: OWNERS[0], updatedAt: null }, load()[id] || {}); }
  function set(id, patch) {
    const d = load();
    d[id] = Object.assign(get(id), patch, { updatedAt: Date.now() });
    save(d);
    listeners.forEach((fn) => fn(id, d[id]));
  }
  function onChange(fn) { listeners.push(fn); }
  function clearAll() {
    try { Object.keys(localStorage).filter((k) => k.indexOf("iqa_triage:") === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  }
  function counts(ids) {
    const c = { total: ids.length, open: 0, resolved: 0, waived: 0 };
    ids.forEach((id) => { c[get(id).status]++; });
    return c;
  }
  function statusLabel(s) { return (STATUSES.find((x) => x[0] === s) || STATUSES[0])[1]; }
  function shortOwner(o) { return String(o || OWNERS[0]).split(" · ")[0].replace(" (you)", ""); }
  function ago(ts) {
    if (!ts) return "";
    const m = Math.round((Date.now() - ts) / 60000);
    return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + " h ago";
  }

  // The two dropdowns. `label` names the item for screen readers.
  function controlsHtml(id, label) {
    const t = get(id);
    const sOpts = STATUSES.map(([v, l]) => '<option value="' + v + '"' + (t.status === v ? " selected" : "") + ">" + l + "</option>").join("");
    const oOpts = OWNERS.map((o) => '<option value="' + esc(o) + '"' + (t.owner === o ? " selected" : "") + ">" + esc(o) + "</option>").join("");
    return '<div class="triage">' +
      '<label>Status<select class="tri-' + t.status + '" data-triage="' + esc(id) + '" data-field="status" aria-label="Status for ' + esc(label) + '">' + sOpts + "</select></label>" +
      '<label>Owner<select data-triage="' + esc(id) + '" data-field="owner" aria-label="Owner for ' + esc(label) + '">' + oOpts + "</select></label>" +
      (t.updatedAt ? '<span class="triage-when">Updated ' + ago(t.updatedAt) + "</span>" : "") +
      "</div>";
  }

  // Listen for changes on any container that holds controlsHtml() output.
  function bind(root) {
    root.addEventListener("change", (e) => {
      const el = e.target.closest("select[data-triage]");
      if (!el) return;
      if (el.dataset.field === "status") el.className = "tri-" + el.value;
      set(el.dataset.triage, { [el.dataset.field]: el.value });
    });
  }

  return { OWNERS, setCampaign, get, set, onChange, counts, clearAll, controlsHtml, bind, statusLabel, shortOwner, ago };
})();
