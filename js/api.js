// Every data call goes through this file.
// Today it returns sample JSON; later it calls the agent. Pages never need to change.
(function () {
  const cfg = window.IQA_CONFIG;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function getCompareResult(campaignId) {
    if (cfg.USE_MOCKS) {
      await wait(cfg.MOCK_DELAY_MS);
      const res = await fetch("data/compare-result.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load sample data (" + res.status + ")");
      return res.json();
    }

    const res = await fetch(cfg.API_BASE + cfg.ENDPOINTS.compare, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId })
    });
    if (res.status === 401) throw new Error("Your session has expired. Please sign in again.");
    if (!res.ok) throw new Error("The comparison failed (" + res.status + "). Please try again.");
    return res.json();
  }

  window.IQA_API = { getCompareResult };
})();
