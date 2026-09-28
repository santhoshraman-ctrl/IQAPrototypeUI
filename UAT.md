# IQA Programmatic Display - UAT Guide

Live prototype: https://santhoshraman-ctrl.github.io/IQAPrototypeUI/

This is a click-through prototype. No real backend, no real SharePoint connection,
no real file uploads. Everything is simulated to test the user journey.

## 1. Sign in

Any email and password works. There is no real authentication.

## 2. Connect SharePoint (first-time user)

You'll land on a welcome screen. Click **Connect SharePoint**.

- **Test a wrong link**: type anything else (e.g. `https://onedrive.live.com/test`)
  and click Connect. You should see a "couldn't connect" error.
- **Test the working link**: click **use the sample link** to auto-fill
  `https://dentsu.sharepoint.com/sites/DrivenBrands/CampaignDocuments`, then Connect.

## 3. Pick a folder

Three folders appear:

- **Archive** / **Templates** - empty on purpose, to test the "no files found" state.
- **Q3 2026 Display** - the one with files. Click it, review the file list, then
  **Use this folder**.

## 4. Review what was found

A summary shows files found / ready to use / skipped, with a reason next to each
skipped file. Click **Looks good, continue**.

## 5. Confirm ingestion

You should land on the normal upload screen with all 6 document slots already
filled in (Media Plan, Budget tracker, Geo mapping doc, MAF, T-Sheet, Tag Sheet),
plus the Extracted campaign details table populated below.

## 6. Reload the page

Reload the browser. You should NOT see the welcome screen again - instead you'll
see "Connected to Driven Brands / Q3 2026 Display" with **View files** and
**Change location** buttons. This simulates a returning user.

- **View files** re-runs the read/found flow.
- **Change location** clears the saved connection and reopens the connect modal.

## Resetting to demo as a new user

To redo the first-time experience (welcome screen, connect flow, etc.) instead of
seeing the returning-user "Connected to..." screen:

- **Easiest**: open the site in a private/incognito window. Fresh state every time.
- **In-app**: click **Change location** on the "Connected to..." screen. This
  resets just the SharePoint connection.
- **Full reset in the same window**: open DevTools (Cmd+Option+I) - Console tab,
  run `localStorage.clear(); sessionStorage.clear();`, then reload the page.
  This clears sign-in and the SharePoint connection.

## What to flag as a bug vs. expected behavior

| Expected (not a bug) | Actually a bug |
|---|---|
| File names/sizes are fake demo data | Buttons that do nothing / dead ends |
| Any email/password signs you in | Errors that don't match the scenario above |
| "Upload from your computer" tab still works standalone | Layout breaking on your screen size |
| No data persists after closing the browser (only the SharePoint connection does) | Slots not filling in after "Looks good, continue" |

## Known gaps (not in scope for this iteration)

- No real SharePoint/OneDrive or DV360 integration
- Review / Adjudicate / Summary stages after upload are not built yet
- Only one demo campaign (Driven Brands / Q3 2026 Display) is wired up
