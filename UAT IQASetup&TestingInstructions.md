# IQA Programmatic Display - UAT Guide

Live prototype: https://santhoshraman-ctrl.github.io/IQAPrototypeUI/

This is a click-through prototype. There is no real backend, no real SharePoint connection,
no real DV360 connection and no real sign-in. Everything is simulated so the user journey
can be tested end to end.

## 0. Before you start

| Item | Detail |
|---|---|
| Browser | Latest Chrome, Edge or Safari. Use `https://`, not `http://`. |
| Fresh start | Open the link in a **new private/incognito window** (closes cleanly between runs). |
| Sign in | Any email and any password works. |
| Demo bar | Hidden by default. Show it with `?demo=1` on the URL (for example `.../IQAPrototypeUI/?demo=1`), or press **Ctrl+Shift+D**, or click the logo 5 times. |
| Demo bar controls | **First-time view**, **Returning view**, **Teammate re-run**, **Fail re-check** (checkbox), **Role** (dropdown). |
| Demo campaign | Q4 Regional Auto, CMP-4821. 4 potential issues, 7 line items and 2 insertion orders compared. |
| If something looks stale | Hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If it still looks wrong: F12, Application, Storage, **Clear site data**. |

## 1. Happy path script (about 10 minutes, use this for the demo)

1. Open the link with `?demo=1`. Sign in with any email and password.
2. Click **Connect to SharePoint**. Choose the sample link, then **Connect**.
3. Browse to **2026 Campaigns**, then **Q4 Regional Auto**. Click **Use this folder**.
4. Confirm the campaign with **Yes, validate this campaign**, then **Continue**.
5. On the documents screen, click **Check documents**.
6. On the results page, open a row in the comparison table, mark one issue **Resolved**
   (choose Human or AI correction and give a reason), mark another **Waived**.
7. Click **Re-check**, confirm, and watch it finish.
8. Open the **QA summary** tab and review the Re-Check Summary, audit log and confidence score.
9. Click **Back to upload**, then **Check documents** again. Your resolved and waived
   decisions and the audit log are still there.

## 2. Test cases

Mark each one Pass or Fail. Anything that does not match "Expected" is a finding.

### A. Sign in and connect (first-time user)

| ID | Steps | Expected |
|---|---|---|
| A1 | Open the link in a private window. | Redirected to the sign-in page. |
| A2 | Enter any email and password, click **Sign in**. Try with the email empty. | Signs in and lands on the welcome card. Empty email or password shows an error and does not sign in. |
| A3 | Click **Connect to SharePoint**. Paste a wrong link (for example `https://onedrive.live.com/test`) and connect. | A clear "couldn't connect" error. No dead end. |
| A4 | Use the sample link: `https://dentsu.sharepoint.com/sites/DrivenBrands/CampaignDocuments`, then connect. | Connects and shows the folder browser. |
| A5 | Open **Archive**, then **Templates**. | Archive and Templates show the "no campaign files" state, on purpose. |
| A6 | Open **2026 Campaigns**, then **Q4 Regional Auto**. | A file list with notes: older versions, unsupported types, temp files (`~$...`), and a file you do not have access to are skipped or flagged with a reason. |
| A7 | Click **Use this folder**. | A short "reading files" state, then a summary of files found, ready and skipped. |
| A8 | On the summary, check the campaign question. | "Is this the campaign you want to validate?" with the detected campaign. If several QA SDF files exist, you can pick the right one. **Yes, validate this campaign** then **Continue**. |

### B. Documents screen

| ID | Steps | Expected |
|---|---|---|
| B1 | After Continue, look at the document boxes. | Campaign Briefs, DV360 QA SDF, Geo mapping doc and Supporting documents are filled in from SharePoint. |
| B2 | Check the Extracted campaign details tile. | A collapsible tile with line items, insertion orders and campaign name. |
| B3 | Try dropping a file from your computer. | A message says uploading from the computer is not available and to add the file to SharePoint. |
| B4 | Click the **?** help icon in the top bar. | A short tip about how files are matched to boxes. |
| B5 | Click **Check documents**. | The progress bar moves from step 2 to step 3 and the results page opens. |

### C. Progress bar and page title

| ID | Steps | Expected |
|---|---|---|
| C1 | Look at the bar under the top navigation. | Four steps: Connect, Upload, Check, Summary, with "Step n of 4" and a percentage. Same width as the page content. |
| C2 | On the results page, read the title. | **Intelligent Quality Check · Q4 Regional Auto**. |
| C3 | Click an earlier step (Connect or Upload) in the bar. | Goes back to that screen. Later steps that are not available yet are disabled. |
| C4 | Run a **Re-check** (see section F). | A red **Re-Run 1** tag appears next to the title, and the step reads **Check & Re-Run**. A second re-check shows **Re-Run 2**. |
| C5 | Look at the browser tab title. | Matches the page title, with the Re-Run number after a re-check. |

### D. Results page: Mismatches tab

| ID | Steps | Expected |
|---|---|---|
| D1 | Look at the top bar of the results page. | **Back to upload**, **Re-check** and **Download SDF for review** are the same size and sit in one row. Re-check has a red dot and gentle pulse. |
| D2 | Check the page layout. | The title bar stays at the top while you scroll. The line-by-line comparison is first and full width. Below it, Potential issues and the other cards sit in a 3:2 layout. |
| D3 | In the comparison table, check the columns. | Campaign name is the first column. Long text wraps without overlapping. Status, Resolution and Corrected columns are present. |
| D4 | Click a row (or its **Open** control). | A wide side drawer slides out from the right with the Field / Media Plan / QA SDF table, nothing cut off, a Resolution section and **Previous / Next**. |
| D5 | Close the drawer with the X, with Esc, or by clicking the row again. | The drawer closes. |
| D6 | Use **Previous** and **Next** in the drawer. | Moves through the rows. |
| D7 | Click **Resolved** on an issue. | A form asks **Who corrected it?** (Human correction or AI correction) and a reason. Saving without choosing, or without a reason, shows an error. |
| D8 | Click **Waived**. | A reason is required ("Why are you accepting this risk?"). |
| D9 | Save a decision. | The row shows who, how and when. The tally (for example "3 open, 1 resolved") and the badge on the tab update. |
| D10 | Click **Open** again on a resolved item. | It returns to Open and the change is logged. |
| D11 | Look at **Potential issues**. | Each issue shows just a title, severity, estimated impact and geo tier. Click the arrow to read the description. |
| D12 | Open **Parameter validation**. | A compact collapsible card with a tooltip on the "i" icon. |
| D13 | Open **Here's what to fix**. | A collapsible list of fixes with time estimates. |
| D14 | Look at the **Revenue loss simulator**. | The first tile shows the dollar figures. It is collapsible. Switch between "This campaign's issues" and "Error scenario library". |
| D15 | Click **Download SDF for review**. | A file preparation step, then the download (Admin and Programmatic roles). |

### E. QA summary tab

| ID | Steps | Expected |
|---|---|---|
| E1 | Click the **QA summary** tab. | Hero numbers: Revenue saved, At risk, Accepted, Total exposure (hidden for roles without the simulator). |
| E2 | Look at the three columns. | Left: Issues and Line-by-line differences. Centre: **Re-Check Summary** with date and time. Right: **Confidence score** (vertical) with **AI correction** and **Human correction** factors. |
| E3 | Hover the tooltips on the confidence factors. | Short, plain-language explanations. |
| E4 | Resolve an issue as AI correction, then as Human correction. | The Re-Check Summary rows and the confidence score update. |
| E5 | Open the audit log. | Newest first, with who, what, how, when and reason. |

### F. Re-check and notifications

| ID | Steps | Expected |
|---|---|---|
| F1 | Click **Re-check**. | A confirmation pop-up lists what will be re-run, with a heads-up like the connect page. |
| F2 | Confirm. | A running state, then **Updated campaign successfully**. The run number goes up and the audit log shows the re-run. |
| F3 | Tick **Fail re-check** on the demo bar, then re-check as **Admin**. | The failure screen shows the reason, and the reason is logged. The audit log shows a failure row. |
| F4 | Same as F3 but with Role set to **QA**. | The failure screen shows a generic message with no technical reason, and no failure row in the audit log. |
| F5 | Look at the bell icon next to the user menu after fixing an issue and before re-checking. | A badge appears with "Re-run the checks" as the action. |
| F6 | Click **Teammate re-run** on the demo bar. | A new bell notification says a teammate re-ran the checks, with a link to the audit log. |

### G. Navigation and saved decisions (returning user)

| ID | Steps | Expected |
|---|---|---|
| G1 | Resolve one issue and waive another. Click **Back to upload** (top bar button). | The documents screen opens. |
| G2 | Click **Check documents** again. | The same issues are still Resolved and Waived, with the same audit log and counts. |
| G3 | Repeat G1 using the **Back to upload** button at the bottom of the page. | Same result. The bottom button also works from the QA summary tab. |
| G4 | Reload the browser tab. | You stay signed in. Decisions and the audit log are still there. |
| G5 | Reload the page and look at the connect screen. | A returning user sees "Connected to Driven Brands" with **View files** and **Change location**, and no welcome screen. |
| G6 | Click **Returning view** on the demo bar. | Opens as a returning user and keeps the saved decisions and audit log. |
| G7 | Click **First-time view** on the demo bar. | Back to the welcome screen with every decision and log entry cleared. |

Decisions are saved in the browser, per campaign. They stay until you click **First-time view** or clear the browser's site data.

### H. Roles (Role dropdown on the demo bar)

| Role | Can do | Should not be able to |
|---|---|---|
| Admin | Everything, including the failure reason and failure rows in the audit log. | |
| QA | Connect, run checks, resolve or waive, revenue loss simulator. | Download SDF. See failure reasons. |
| Programmatic | Connect, run checks, resolve or waive, download SDF. | Revenue loss simulator. |
| Client (view only) | View results. | Connect, re-check, resolve or waive, simulate, download. A note explains what is locked. |
| QA + Programmatic | The combined permissions of both. | |

| ID | Steps | Expected |
|---|---|---|
| H1 | Switch the role from the dropdown on the results page. | The screen updates straight away with no reload, and a message says which role you are viewing as. |
| H2 | As Client, open the welcome screen. | A "You have view access" card with **View latest results**. |

### I. Upload scenarios (what a user can bring in)

Files are never uploaded from the computer. They are read from the connected SharePoint folder. Each folder below is a ready-made scenario in the demo.

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| I1 | Complete campaign (happy path) | Connect, open **2026 Campaigns / Q4 Regional Auto**, **Use this folder**. | Media plan, creative brief, QA SDF, Geo mapping doc and supporting files are all matched and marked Ready. |
| I2 | Several QA SDFs in one folder | Same folder as J1. It holds SDFs for Q4 Regional Auto, Q3 2026 Display and Spring Auto 2025. | You are asked which campaign to validate and the Q4 Regional Auto SDF is preselected. Switching the choice resets the confirmation and updates the campaign name and ID. |
| I3 | Required file missing | Open **2026 Campaigns / Q3 2026 Display** and **Use this folder**. | The QA SDF is missing. The confirm button is disabled with "Add the missing files first." |
| I4 | File added after the first check | Continue J3: click **Check again** on the summary (or **Check folder again** in the folder browser). Click it a second time. | First click: in the demo the QA SDF "arrives" and the toast says "Found 1 new file in the folder." The SDF is matched and you can continue. Second click: "No new files yet. Add the file to your SharePoint folder, then check again." |
| I5 | Files that get skipped | In the Q4 Regional Auto file list, look at the reasons. | Older version ("already replaced"), unsupported type (`.txt`), SharePoint temp file (`~$...`), a file over 100 MB, and a file you do not have access to are each skipped or flagged with a plain reason. |
| I6 | Template folder | Open **Templates**. | Template files are skipped as "A template, not campaign data". Nothing to use. |
| I7 | Empty folder | Open **Archive** (top level). | "No campaign files here. Open a folder to look inside." |
| I8 | Older campaign | Open **Archive / Spring_Auto_2025**. | Files for Spring Auto 2025 (CMP-3902) are matched. The campaign name and ID change. The comparison table shows the sample comparison data. |
| I9 | Add a single file by SharePoint link | On the documents screen, paste a file link in **Add a SharePoint file link**. | A valid `https://*.sharepoint.com/...` link is routed to the matching box, or to Supporting documents. A "Checking access to the link" message appears. |
| I10 | Bad links | Try each: empty; `http://...`; `https://onedrive.live.com/x`; `https://example.com/x`; a SharePoint folder link (`/:f:/`); the same link twice. | In order: "Paste a SharePoint link first", "Only secure (https://) links are accepted", "Only company SharePoint links are supported", "This isn't a SharePoint link", "This link opens a folder, not a file", "This link is already added as ...". |
| I11 | Box limits | Add more than 7 supporting documents. | "Supporting documents already has 7 files. Remove one to add another." Campaign Briefs accepts any number. QA SDF and Geo mapping take one file each, and replacing one asks for confirmation. |
| I12 | Wrong file type for a box | Add a link to a file of the wrong type for the QA SDF box (it needs csv or xlsx). | The box rejects it and names the types it accepts. |
| I13 | Link problems (failure scenarios) | Add `#scenarios` to the URL (for example `.../IQAPrototypeUI/#scenarios`), set **Next SharePoint link** to No access, File moved or deleted, or Session expired, then add a link. | A matching error on the file: no access, moved or deleted, or a prompt to sign in again. Choose **Access OK** to return to normal. |
| I14 | Offline | With `#scenarios`, click **Simulate going offline**. | An offline banner appears and adding links is blocked: "You're offline. Reconnect to add a link." **Simulate reconnecting** resumes. |

### J. Re-checking the links and files that were used

| ID | Steps | Expected |
|---|---|---|
| J1 | Reload the page after connecting. | The returning-user screen shows the connected location (for example Driven Brands / 2026 Campaigns / Q4 Regional Auto). |
| J2 | Click **View files**. | The folder is read again and the file list shows the latest files and any new skipped files. |
| J3 | Click **Change location**. | The saved connection is cleared and the connect modal reopens, so you can pick another site or folder. |
| J4 | On the documents screen, look at each document card. | Each shows its source (SharePoint) and the file or link used. **Replace** swaps one. |
| J5 | After fixing something, click **Re-check** on the results page. | The confirmation pop-up names the folder and the documents that will be re-read. The run number goes up. |
| J6 | Open the QA summary audit log. | Each re-run is listed with who ran it and when. |

### K. Layout and polish

| ID | Steps | Expected |
|---|---|---|
| K1 | Resize the window to phone width. | No sideways scrolling on the main content. Buttons stack full width. The drawer fills most of the screen. |
| K2 | Scroll with a mouse wheel. | Smooth scrolling. |
| K3 | Keyboard: Tab through the page, Esc to close the drawer and pop-ups. | Focus is visible and Esc closes them. |

## 3. Where the files come from (DV360 SDF and the rest)

| Question | Answer |
|---|---|
| Where are the DV360 QA SDF files stored? | In SharePoint, in the **same campaign folder** as the media plan and brief. In the demo that is `2026 Campaigns/Q4 Regional Auto/DV360_QA_SDF_LineItems.csv`, on the sample site `https://dentsu.sharepoint.com/sites/DrivenBrands/CampaignDocuments`. |
| Who puts them there? | The programmatic team exports the Structured Data File (SDF) from DV360 and saves it into the campaign folder. The tool does not pull it from DV360 today. |
| How is a file recognised as the QA SDF? | By its name (it contains `SDF`, `DV360` or `structured data`) and its type (`.csv` or `.xlsx`). If several match, the user picks the campaign to validate. |
| Does the tool copy or upload the file? | No. Files are read from the connected folder and nothing is copied. Files over 100 MB, files the user cannot open, older versions and `~$` temp files are skipped. |
| Where does the Download SDF for review file go? | It is generated in the browser and saved to the user's own Downloads folder. It is not written back to SharePoint or DV360. |
| What about pulling the SDF straight from DV360? | A later option. It is not part of this prototype. |

## 4. Resetting the demo

- **Easiest:** open a new private/incognito window.
- **In-app, first-time view:** demo bar, **First-time view**. This clears the SharePoint connection and all decisions.
- **In-app, returning view:** demo bar, **Returning view**.
- **Full reset in the same window:** F12, Console, run `localStorage.clear(); sessionStorage.clear();`, then reload.

## 5. What to flag as a bug vs. expected behavior

| Expected (not a bug) | Actually a bug |
|---|---|
| File names, sizes, issues and dollar figures are demo data | Buttons that do nothing, or dead ends |
| Any email and password signs you in | Errors that do not match the scenario above |
| Uploading from your computer is not available | Layout breaking or text overlapping on your screen size |
| Decisions stay across navigation and reloads, and reset only on First-time view or clearing site data | Decisions or the audit log disappearing after Back to upload or a reload |
| Re-check always succeeds unless **Fail re-check** is ticked | Re-Run tag or "Check & Re-Run" not appearing after a successful re-check |
| The failure reason and failure log rows are visible to Admin only | Anyone other than Admin seeing the failure reason |
| QA SDF for Q3 appears only after you add it and check again (demo behavior) | Slots not filling after **Continue** |

## 6. Known gaps (not in scope for this iteration)

- No real SharePoint/OneDrive, Okta or DV360 integration. The comparison data is a sample file (`data/compare-result.json`).
- Only one demo campaign has comparison results (Q4 Regional Auto, CMP-4821).
- Confidence score weights and the AI correction factor use placeholder numbers until the agent is connected.
- Saved decisions live in the browser only, so they are not shared between people or devices.
- Client role is view only for now. Its permissions will be defined later.
