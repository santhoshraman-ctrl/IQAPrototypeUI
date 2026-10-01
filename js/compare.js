// Line-by-line comparison. Mounted inside the Results page (index.html) by IQA_COMPARE.mount().
// Data comes from IQA_API.getCompareResult(); every difference can be triaged (status, who corrected it, how and why).
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SEV_RANK = { high: 0, medium: 1, low: 2 };
  const SEV_LABEL = { high: "High", medium: "Medium", low: "Low" };
  const T = () => window.IQA_TRIAGE;

  let root = null, data = null, ctx = {}, loading = false;
  let sheetKey = null, selectedId = null, diffOnly = true, sortBy = "severity";

  const el = (n) => root.querySelector('[data-el="' + n + '"]');
  const isDiff = (r) => r.rowStatus !== "match";
  const sheetOf = (k) => data.sheets.find((s) => s.key === k);
  const tid = (sheet, row) => "cmp:" + sheet.key + ":" + row.id;

  function statusLabel(status) {
    const L = data.sources.left.label, R = data.sources.right.label;
    return { match: ["Match", "ok"], changed: ["Changed", "warn"], missing_in_right: ["Missing in " + R, "bad"], extra_in_right: ["Not in " + L, "info"] }[status] || [status, "info"];
  }

  /* ---------- summary the host page can read ---------- */
  function summary() {
    if (!data) return null;
    const ids = [];
    let rows = 0;
    data.sheets.forEach((s) => s.rows.forEach((r) => { rows++; if (isDiff(r)) ids.push(tid(s, r)); }));
    const c = T() ? T().counts(ids) : { total: ids.length, open: ids.length, resolved: 0, waived: 0 };
    return { rows, diffs: ids.length, open: c.open, resolved: c.resolved, waived: c.waived };
  }
  function notify() { if (ctx.onData) ctx.onData(summary()); }

  /* ---------- skeleton ---------- */
  function skeleton() {
    root.classList.add("cmp");
    root.innerHTML =
      '<div class="cmp-state" data-el="loading" role="status"><span class="cmp-spinner" aria-hidden="true"></span> Comparing documents…</div>' +
      '<div class="cmp-state cmp-error" data-el="error" role="alert" hidden><span data-el="error-text"></span><button class="btn btn-ghost btn-sm" type="button" data-el="retry">Try again</button></div>' +
      '<div class="cmp-stack" data-el="body" hidden>' +
        '<p class="cmp-sub" data-el="sub"></p>' +
        '<section class="cmp-tiles" data-el="tiles" aria-label="Comparison summary"></section>' +
        '<div class="cmp-toolbar">' +
          '<div class="cmp-tabs" data-el="tabs" role="tablist" aria-label="Sheets"></div>' +
          '<div class="cmp-controls">' +
            '<label class="cmp-check"><input type="checkbox" data-el="diffonly" checked><span>Differences only</span></label>' +
            '<label class="cmp-sort"><span>Sort</span><select data-el="sort"><option value="severity">By priority</option><option value="sheet">Sheet order</option></select></label>' +
          "</div>" +
        "</div>" +
        '<p class="cmp-count" data-el="count" aria-live="polite"></p>' +
        '<section class="cmp-tablewrap panel" aria-label="Comparison table"><div class="cmp-scroll"><table class="cmp-table" data-el="table"></table></div></section>' +
      "</div>" +
      '<aside class="cmp-drawer" data-el="drawer" role="dialog" aria-label="Row details" hidden></aside>';
    if (T()) T().bind(el("drawer"));
  }

  /* ---------- load ---------- */
  async function load() {
    loading = true;
    el("loading").hidden = false; el("error").hidden = true; el("body").hidden = true;
    try {
      const d = await window.IQA_API.getCompareResult(ctx.campaign && ctx.campaign.id);
      if (!d || !Array.isArray(d.sheets) || !d.sheets.length) throw new Error("The comparison returned no sheets.");
      data = d;
      sheetKey = d.sheets[0].key; selectedId = null;
      el("loading").hidden = true; el("body").hidden = false;
      renderAll();
      notify();
    } catch (err) {
      el("loading").hidden = true; el("error").hidden = false;
      el("error-text").textContent = err.message || "Something went wrong.";
    } finally { loading = false; }
  }

  /* ---------- render ---------- */
  function renderAll() {
    const c = ctx.campaign || data.campaign, s = data.sources;
    const when = data.generatedAt ? new Date(data.generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
    el("sub").innerHTML = esc(c.name) + " · " + esc(c.id) + " · <strong>" + esc(s.left.label) + "</strong> vs <strong>" + esc(s.right.label) + "</strong>" + (when ? " · Compared " + esc(when) : "");
    renderTiles(); renderTabs(); renderTable(); closeDrawer(false);
  }

  function renderTiles() {
    let t = { rows: 0, match: 0, changed: 0, missing: 0, extra: 0 };
    data.sheets.forEach((s) => s.rows.forEach((r) => {
      t.rows++;
      if (r.rowStatus === "match") t.match++;
      else if (r.rowStatus === "changed") t.changed++;
      else if (r.rowStatus === "missing_in_right") t.missing++;
      else if (r.rowStatus === "extra_in_right") t.extra++;
    }));
    const R = data.sources.right.label, L = data.sources.left.label;
    const tiles = [
      ["", t.rows, "Rows compared", "Across " + data.sheets.length + " sheet" + (data.sheets.length === 1 ? "" : "s")],
      ["ok", t.match, "Matching", "No differences"],
      ["warn", t.changed, "Changed", "Values differ"],
      ["bad", t.missing, "Missing in " + R, "In " + L + " only"],
      ["info", t.extra, "Not in " + L, "In " + R + " only"]
    ];
    el("tiles").innerHTML = tiles.map(([tone, n, l, s]) => '<div class="cmp-tile ' + tone + '"><div class="n">' + n + '</div><div class="l">' + esc(l) + '</div><div class="s">' + esc(s) + "</div></div>").join("");
  }

  function renderTabs() {
    el("tabs").innerHTML = data.sheets.map((sh) => {
      const diffs = sh.rows.filter(isDiff).length, on = sh.key === sheetKey;
      const badge = diffs ? '<span class="cmp-badge">' + diffs + "</span>" : '<span class="cmp-badge okb" title="No differences">✓</span>';
      return '<button class="cmp-tab" type="button" role="tab" id="cmp-tab-' + esc(sh.key) + '" data-key="' + esc(sh.key) + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + esc(sh.name) + badge + "</button>";
    }).join("");
  }

  function visibleRows(sheet) {
    let rows = sheet.rows.map((r, i) => ({ r, i })).filter((x) => !diffOnly || isDiff(x.r));
    if (sortBy === "severity") rows.sort((a, b) => ((SEV_RANK[a.r.severity] ?? 3) - (SEV_RANK[b.r.severity] ?? 3)) || (a.i - b.i));
    return rows.map((x) => x.r);
  }

  function cellHtml(cell) {
    if (!cell) return "";
    const L = data.sources.left.label, R = data.sources.right.label;
    switch (cell.status) {
      case "changed": return '<span class="was" title="' + esc(L) + '">' + esc(cell.left) + '</span><span class="arr" aria-hidden="true">→</span><span class="now" title="' + esc(R) + '">' + esc(cell.right) + '</span><span class="sr">changed from ' + esc(cell.left) + " to " + esc(cell.right) + "</span>";
      case "missing": return '<span class="gone">' + esc(cell.left) + '</span><span class="sr"> (missing in ' + esc(R) + ")</span>";
      case "extra": return esc(cell.right) + '<span class="sr"> (not in ' + esc(L) + ")</span>";
      default: return esc(cell.left);
    }
  }

  function resolutionHtml(sheet, row) {
    if (!isDiff(row)) return '<span class="dash">—</span>';
    const t = T().get(tid(sheet, row));
    const mark = { open: "○", resolved: "✓", waived: "⊘" }[t.status];
    return '<span class="tri tri-' + t.status + '"><span aria-hidden="true">' + mark + "</span> " + T().statusLabel(t.status) + "</span>";
  }
  // Who corrected it, how, and when. Empty until someone resolves or waives the difference.
  function correctedHtml(sheet, row) {
    if (!isDiff(row)) return '<span class="dash">—</span>';
    const c = T().correction(tid(sheet, row));
    if (!c) return '<span class="dash">—</span>';
    const how = c.status === "resolved" ? c.methodLabel : "Risk accepted";
    return '<span class="corr-who">' + esc(c.name) + '</span><span class="corr-meta" title="' + esc(c.whenFull) + '">' + esc(how) + " · " + esc(c.when) + "</span>";
  }

  // Column order: Campaign name, Insertion order, Line item, then Status, then the remaining columns,
  // whatever order the data file lists them in.
  function tableCols(sh) {
    const find = (re) => sh.columns.findIndex((c) => re.test(c.key + " " + c.label));
    const lead = [], rest = sh.columns.slice();
    [/campaign/i, /insertion/i, /line\s*item|lineitem/i].forEach((re) => {
      const i = rest.findIndex((c) => re.test(c.key + " " + c.label));
      if (i >= 0) lead.push(rest.splice(i, 1)[0]);
    });
    return { lead, rest };
  }
  function renderTable() {
    const sh = sheetOf(sheetKey), rows = visibleRows(sh), tc = tableCols(sh);
    const th = (c) => '<th scope="col">' + esc(c.label) + "</th>";
    const head = "<thead><tr>" + tc.lead.map(th).join("") + '<th scope="col">Status</th>' + tc.rest.map(th).join("") + '<th scope="col">Resolution</th><th scope="col">Corrected</th></tr></thead>';
    let body;
    if (!rows.length) {
      body = '<tbody><tr><td class="cmp-none" colspan="' + (sh.columns.length + 3) + '">Nothing to show here. Everything on this sheet matches.</td></tr></tbody>';
    } else {
      body = "<tbody>" + rows.map((r) => {
        const [label, tone] = statusLabel(r.rowStatus), sel = r.id === selectedId;
        const td = (c) => { const cell = r.cells[c.key]; return '<td class="c-' + esc(cell ? cell.status : "match") + '">' + cellHtml(cell) + "</td>"; };
        const sev = r.severity ? '<span class="sev sev-' + esc(r.severity) + '">' + esc(SEV_LABEL[r.severity]) + "</span>" : "";
        return '<tr class="row-' + esc(r.rowStatus) + (sel ? " sel" : "") + '" data-id="' + esc(r.id) + '">' +
          tc.lead.map(td).join("") +
          '<td class="st"><button type="button" class="pill ' + tone + '" data-id="' + esc(r.id) + '" aria-haspopup="dialog" aria-label="' + esc(label) + ". Open details for " + esc(r.id) + '">' + esc(label) + "</button>" + sev + "</td>" +
          tc.rest.map(td).join("") +
          '<td class="res">' + resolutionHtml(sh, r) + '</td><td class="corr">' + correctedHtml(sh, r) + "</td></tr>";
      }).join("") + "</tbody>";
    }
    el("table").innerHTML = head + body;
    renderCount();
  }

  function renderCount() {
    const sh = sheetOf(sheetKey), n = visibleRows(sh).length, diffs = sh.rows.filter(isDiff);
    const c = T().counts(diffs.map((r) => tid(sh, r)));
    el("count").textContent = "Showing " + n + " of " + sh.rows.length + " rows · " + diffs.length + " with differences · " + c.open + " open, " + c.resolved + " resolved, " + c.waived + " waived";
  }

  /* ---------- drawer ---------- */
  function openDrawer(id) {
    selectedId = id;
    renderTable();
    const sh = sheetOf(sheetKey), rows = visibleRows(sh), row = rows.find((r) => r.id === id);
    if (!row) return closeDrawer(false);
    const pos = rows.indexOf(row);
    const [label, tone] = statusLabel(row.rowStatus), L = data.sources.left.label, R = data.sources.right.label;
    const first = row.cells[sh.columns[0].key], title = (first && (first.left || first.right)) || row.id;
    const sev = row.severity ? '<span class="pill sev-' + esc(row.severity) + '">' + esc(SEV_LABEL[row.severity]) + " priority</span>" : "";
    const fields = sh.columns.map((c) => {
      const cell = row.cells[c.key] || {};
      const l = cell.left == null ? '<span class="dash">—</span>' : esc(cell.left), r = cell.right == null ? '<span class="dash">—</span>' : esc(cell.right);
      return '<tr class="dc-' + esc(cell.status || "match") + '"><th scope="row">' + esc(c.label) + "</th><td>" + l + "</td><td>" + r + "</td></tr>";
    }).join("");
    const triage = isDiff(row)
      ? '<div class="dr-triage"><h3>Resolution</h3>' + T().controlsHtml(tid(sh, row), row.id + " " + title) + "</div>"
      : '<p class="d-note muted">Nothing to resolve. This row matches.</p>';
    const d = el("drawer");
    d.innerHTML =
      '<div class="dr-head"><div><div class="d-id">' + esc(row.id) + " · " + esc(sh.name) + '</div><h2 tabindex="-1" data-el="dr-title">' + esc(title) + '</h2></div>' +
      '<button class="iconbtn" type="button" data-el="dr-close" aria-label="Close details"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="d-pills"><span class="pill ' + tone + '">' + esc(label) + "</span>" + sev + "</div>" +
      (row.note ? '<p class="d-note">' + esc(row.note) + "</p>" : '<p class="d-note muted">Every field matches between the two documents.</p>') +
      '<table class="d-table"><thead><tr><th scope="col">Field</th><th scope="col">' + esc(L) + '</th><th scope="col">' + esc(R) + "</th></tr></thead><tbody>" + fields + "</tbody></table>" +
      triage +
      '<div class="dr-nav"><button class="btn btn-ghost btn-sm" type="button" data-el="prev"' + (pos === 0 ? " disabled" : "") + '>← Previous</button><span>' + (pos + 1) + " of " + rows.length + '</span><button class="btn btn-ghost btn-sm" type="button" data-el="next"' + (pos === rows.length - 1 ? " disabled" : "") + ">Next →</button></div>";
    d.hidden = false;
    d.querySelector('[data-el="dr-title"]').focus({ preventScroll: true });
  }

  function closeDrawer(restoreFocus) {
    const d = el("drawer"), id = selectedId;
    if (d.hidden && !id) return;
    d.hidden = true; selectedId = null;
    if (data) renderTable();
    if (restoreFocus && id) { const b = root.querySelector('button.pill[data-id="' + id + '"]'); if (b) b.focus(); }
  }

  function step(dir) {
    const rows = visibleRows(sheetOf(sheetKey)), i = rows.findIndex((r) => r.id === selectedId), next = rows[i + dir];
    if (next) openDrawer(next.id);
  }

  /* ---------- events ---------- */
  function bindEvents() {
    root.addEventListener("click", (e) => {
      if (e.target.closest('[data-el="retry"]')) return load();
      if (e.target.closest('[data-el="dr-close"]')) return closeDrawer(true);
      if (e.target.closest('[data-el="prev"]')) return step(-1);
      if (e.target.closest('[data-el="next"]')) return step(1);
      const tab = e.target.closest(".cmp-tab");
      if (tab) { if (tab.dataset.key !== sheetKey) { sheetKey = tab.dataset.key; closeDrawer(false); renderTabs(); renderTable(); el("tabs").querySelector('[aria-selected="true"]').focus(); } return; }
      const tr = e.target.closest("tr[data-id]");
      if (tr && el("table").contains(tr)) { tr.dataset.id === selectedId && !el("drawer").hidden ? closeDrawer(true) : openDrawer(tr.dataset.id); }
    });
    root.addEventListener("change", (e) => {
      if (e.target === el("diffonly")) { diffOnly = e.target.checked; closeDrawer(false); renderTable(); }
      if (e.target === el("sort")) { sortBy = e.target.value; renderTable(); }
    });
    root.addEventListener("keydown", (e) => {
      if (e.target.closest && e.target.closest('[data-el="tabs"]') && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const keys = data.sheets.map((s) => s.key);
        sheetKey = keys[(keys.indexOf(sheetKey) + (e.key === "ArrowRight" ? 1 : -1) + keys.length) % keys.length];
        closeDrawer(false); renderTabs(); renderTable(); el("tabs").querySelector('[aria-selected="true"]').focus();
        return;
      }
      const pill = e.target.closest && e.target.closest("button.pill[data-id]");
      if (pill && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const all = [...el("table").querySelectorAll("button.pill[data-id]")], i = all.indexOf(pill), n = all[i + (e.key === "ArrowDown" ? 1 : -1)];
        if (n) n.focus();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root && !el("drawer").hidden) { e.preventDefault(); closeDrawer(true); }
    });
    if (T()) T().onChange(() => {
      if (!data) return;
      renderTable(); notify();
      const d = el("drawer");
      if (!d.hidden) { const w = d.querySelector(".triage-when"); /* keep controls as they are so focus is not lost */ if (w) w.remove(); }
    });
  }

  /* ---------- public ---------- */
  function mount(target, opts) {
    ctx = opts || {};
    if (root !== target) { root = target; skeleton(); bindEvents(); load(); }
    else if (!data && !loading) load();
  }
  window.IQA_COMPARE = { mount, summary };
})();
