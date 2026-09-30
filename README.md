# IQAPrototypeUI
IQA UI prototype


<img width="1306" height="1210" alt="image" src="https://github.com/user-attachments/assets/80fbf6d2-ae22-40bc-ab99-1c284b98c3f0" />
**How to read it:**

Grey (sources): where documents come from. DV360 is dashed because pulling the SDF straight from DV360 is a later option; today the QA SDF is uploaded.
Purple (steps 1–5): plain code, no AI. Classifying, parsing, mapping, comparing and scoring severity should be predictable and testable, because they decide what gets flagged.
Coral (step 6): the only step that needs an LLM. It writes the plain-English note and suggested fix for each difference. It never decides whether something is a mismatch.
Teal: what you've already built. The agent's only job is to return JSON in the same shape as compare-result.json. Then you flip USE_MOCKS to false in config.js, and the UI works unchanged.
Dashed line from the UI back to step 6: the Open / Resolved / Waived decisions people make can be fed back, so the notes and severity rules improve over time.
