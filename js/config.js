// Central settings. Loaded before every other script.
window.IQA_CONFIG = {
  // true  = read sample data from /data (prototype demo)
  // false = call the real comparison service (agent / backend)
  USE_MOCKS: true,

  // Used only when USE_MOCKS is false. Fill these in when the agent is ready.
  API_BASE: "",                       // e.g. "https://iqa.dentsu.com/api"
  ENDPOINTS: {
    compare: "/compare"               // POST { campaignId } -> same JSON shape as data/compare-result.json
  },

  // Fake network delay so loading states can be shown in demos (ms).
  MOCK_DELAY_MS: 600
};
