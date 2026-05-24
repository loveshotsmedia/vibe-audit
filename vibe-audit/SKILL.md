---
name: tab-deep-audit
description: Tab-by-tab Playwright audit for vibe-coded apps. Finds broken KPIs, dead buttons, and missing data, then generates a living per-tab Playwright test suite customized to your codebase.
---

# Tab Deep Audit — Universal Web App Audit Engine

**Invocation**: `/tab-deep-audit`
**First run**: skill interviews you for app URL + auth, then runs fully autonomously.
**Subsequent runs**: loads `audit.profile.yml` from your project, skips the interview.

A four-phase audit that simultaneously researches your entire codebase and exercises every pixel of your UI in a real browser. It finds what the AI told you was working but isn't — then generates a living Playwright test suite customized to your app so you can catch regressions every time you ship.

**Built for vibe coders.** Your AI said "done." Your database has data. Your app is deployed. But nobody clicked the buttons. Nobody watched the data flow end to end. This skill does that.

---

## THE CORE RULES — NON-NEGOTIABLE

### Rule 1: Execute every action, not just API calls

Every discrete thing a user can do on a tab must be executed in the real browser via Playwright. Not curled. Not API-tested. Clicked, filled, submitted, and observed — exactly as your user would experience it.

This includes:
- Creating records (leads, campaigns, clients, orders, anything)
- Editing records and saving — verify the edit persists on reload
- Updating fields that cascade — verify every downstream field updated
- Generating content — verify the output is complete, not just "queued"
- Triggering pipeline runs — verify the run actually fired, not just a 200 toast
- Stopping or canceling in-progress actions — verify clean state, no orphaned records
- Status changes — verify the new status is reflected everywhere it appears
- Archiving — verify the item is gone from all list views

### Rule 2: Persistence must be verified by reloading

Any action that writes data is not verified until you reload the page and confirm the data is still there. A save that returns 200 but doesn't persist is a broken feature.

### Rule 3: Number changes must cascade

When interconnected numbers exist — change one and verify every downstream reference updated. If a KPI shows 3 in one place and 2 in another, they are reading from different sources. Log as schema mismatch.

### Rule 4: Generated content must be complete

Clicking a trigger button and getting a spinner is not a pass. The generation must complete, the output must be visible, and the output must be non-empty.

### Rule 5: Multi-step wizards must be walked step by step

Each step of any stepper or wizard must be verified individually:
1. Enter the step — confirm it renders and is not stuck loading
2. Check interactivity — at least one element must be enabled and clickable. If EVERY item is disabled: FAIL — log as Critical
3. Complete the step — make a real selection or input, then advance
4. Do not skip steps — auditing only the final submit misses broken upstream steps

### Rule 6: Outbound actions must arrive

For any action that sends something outside the app — call, email, message, social post — wait for it to physically arrive before marking PASS. A toast is not proof. A database row is not proof. Arrival is proof.

---

## ENVIRONMENT — CONFIG-DRIVEN

These values are never hardcoded in this skill. They come from `audit.profile.yml` in the user's project, written on first run.

```yaml
# audit.profile.yml — written by the skill after first session, never edit manually
app:
  name: "Your App Name"
  frontend_url: "https://your-app.lovable.app"
  backend_url: "https://your-api.railway.app"

auth:
  email: "your@email.com"
  password: "yourpassword"
  success_url_contains: "/dashboard"

delivery_contacts:
  phone: "+1XXXXXXXXXX"
  email: "your@email.com"

local_paths:
  frontend: "path/to/frontend/src"
  backend: "path/to/backend"
  playwright_auth_state: "path/to/tests/.auth/state.json"

trap_library: "tests/audit/trap-library.md"
```

On first run: skill asks for these values in conversation, writes `audit.profile.yml`.
On subsequent runs: skill loads the profile, skips the interview, goes straight to Phase 0.

---

## PHASE 0 — SIMULTANEOUS DISCOVERY

**Code research and browser audit run at the same time. Do not sequence them.**

Launch both tracks in parallel. Do not wait for one before starting the other. Both complete, then synthesize.

---

### TRACK A — 11-AGENT PARALLEL CODE RESEARCH

Deploy all 11 agents simultaneously. Each has a single focused mandate.

```
Agent 1 — Components
  Find: every React/Vue/Svelte component rendered on this tab
  Include: file path, props interface, hooks used, child components, conditional render logic
  Source: frontend src/pages/, src/components/, src/app/
  Check: routing file for the route that mounts this tab

Agent 2 — API Endpoints
  Find: every API call made by components on this tab
  Include: method (GET/POST/PATCH/DELETE), full URL pattern, expected response shape, error handling
  Source: frontend hooks/, lib/api.ts or equivalent
  Look for: fetch(), useQuery(), useMutation(), axios, authFetch()

Agent 3 — Backend Handlers
  Find: the backend handlers that serve these API calls
  Include: function signature, database queries, response shape, field names returned
  Source: backend route files, entry point (look for main server file)
  Flag: any column referenced in code that might not exist in the schema

Agent 4 — Navigation & Routes
  Find: every route this tab links to or navigates to
  Include: sidebar nav items, KPI card click destinations, button nav targets
  Source: App.tsx or routing file, navigate() calls, <Link> components

Agent 5 — Auth & Access
  Find: what auth is required, what guards exist
  Include: useAuth() checks, redirect conditions, role-based visibility
  Source: auth hooks, layout files

Agent 6 — Observability & Activity Trail
  Find: every action that should write a record somewhere
  Ask: does it write to the database? Send a notification? Log anywhere?
  Flag: any action the user takes that is NOT recorded anywhere

Agent 7 — Existing Test Coverage
  Find: every existing test file covering this tab
  Include: what's tested, what's NOT tested (gaps), last known pass/fail state
  Source: tests/ directory

Agent 8 — Known Issues & Disabled Features
  Find: known bugs, workarounds, deliberately disabled features
  Source: README, CLAUDE.md, CONTEXT.md, BUSINESS_BRAIN.md if present
  Look for: false && patterns, // TODO, // BROKEN, "Coming Soon" text, disabled props

Agent 9 — Third-Party Integrations
  Find: every external service this tab touches
  Include: which calls go to which service, what data is sent, expected response
  Flag: any integration that lacks error handling or doesn't surface failures

Agent 10 — Visual & UX Contract
  Find: expected render order, every modal, every empty state, every loading state
  Include: any sliced lists (.slice() calls — common pattern: slice(0, 5), slice(0, 8))
  Include: hardcoded values (numbers not sourced from an API)
  Source: main tab TSX + all child components

Agent 11 — Action Inventory
  Find: every discrete action a user can take on this tab
  For each action produce a test case:
    ACTION: [what the user does — be specific: "click Save button"]
    EXPECTED RESULT: [what the UI should show immediately after]
    PERSISTENCE CHECK: [what to verify after page reload]
    CASCADE CHECK: [if a number updates in multiple places, list every place]
    DELIVERY CHECK: [if the action sends something external — what must arrive and where]
  Source: main tab TSX, every modal it opens, every form, every button's onClick
  Do NOT invent actions. Only list actions that exist in the current codebase.
  Do NOT conflate "the API endpoint exists" with "the action is reachable in the UI."
```

---

### TRACK B — PLAYWRIGHT BROWSER AUDIT

While the 11 agents read code, Playwright exercises the live app simultaneously.

**Authentication**
Sign in using credentials from `audit.profile.yml`.
If auth state file exists, use it. If stale, re-run auth setup first.

**For every tab in the app:**

```
1. NAVIGATE
   - Load the tab URL
   - Record: full URL after navigation resolves
   - Record: whether page redirected (e.g., back to /auth)

2. CAPTURE
   - Full-page screenshot
   - Complete DOM snapshot: every visible heading, KPI label, KPI value
   - Every button visible on the page
   - Every list and item count
   - Every error toast, warning banner, empty state message
   - Every value showing 0, "?", "--", "undefined", "NaN", or "null"

3. EXERCISE
   - Click every button that is visible and enabled
   - Open every modal
   - Attempt every form submit (with valid test data)
   - Record: network request fired? API endpoint? HTTP status? Response contained data?
   - Record: what happened after each click — navigation, modal, toast, or nothing

4. RECORD NETWORK
   - Capture all API calls during page load
   - Capture all API calls triggered by user actions
   - Flag: any call returning 4xx or 5xx
   - Flag: any call returning 200 but with empty data where data is expected
```

**What to flag visually:**
- KPI cards showing 0 or placeholder when the database likely has data
- Lists with 0 rows
- Charts with no data
- Buttons that produce no response of any kind when clicked
- Features labeled "Coming Soon" that may actually be built
- Layout overflow, broken alignment, truncated text
- Loading spinners that never resolve

---

### SYNTHESIS — AFTER BOTH TRACKS COMPLETE

Build a structured spec combining both sources:

```
TAB: [Name]
URL: [Route]

COMPONENTS (from code):
  [List with file paths]

API CALLS (from code + network capture):
  [List with expected shape vs actual response captured]

FIELD NAME MISMATCHES (critical):
  [API returns "campaign_id" → frontend reads "id" → MISMATCH]

DB TABLES TOUCHED:
  [List with relevant column names]

VISUAL FINDINGS (from browser):
  [Screenshot: path]
  KPIs showing 0: [list]
  Buttons with no response: [list]
  Empty lists: [list]
  Errors/toasts seen: [list]

HARDCODED VALUES (from code):
  [List of values not sourced from API]

SLICED LISTS (hidden data):
  [List of .slice() patterns with the limit]

THIRD-PARTY INTEGRATIONS:
  [List with error handling status]

OBSERVABILITY GAPS:
  [Actions with no trail]

ACTION INVENTORY:
  [Complete test case list from Agent 11]

TRAPS DISCOVERED:
  [Specific failure patterns found in this app — becomes the trap library]

AMBIGUITIES — requires vibe coder input:
  [Everything the code cannot answer — intended behavior, correct KPI sources, etc.]
```

---

## GATE 0 → 1: BOTH TRACKS MUST COMPLETE

Do not proceed to Phase 1 until:
- All 11 agents have returned their findings
- Playwright has exercised every tab and captured screenshots
- Synthesis doc is complete

Post a brief status:
```
Discovery complete.
Code research: [N components, N endpoints, N DB tables mapped]
Browser audit: [N tabs visited, N buttons clicked, N anomalies captured]
Traps discovered: [N]
Ambiguities requiring your input: [N]

Generating questionnaire now.
```

---

## PHASE 1 — QUESTIONNAIRE GENERATION

Generate the questionnaire from both sources. Every question comes with evidence attached — a screenshot, a network response, a code snippet. The vibe coder answers with receipts in front of them, not from memory.

**Always ask (where relevant):**
- "This KPI shows 0 but the database has records. Should this count [X] or [Y]? Here's the screenshot: [attach]"
- "This button click produces no network request, no navigation, no modal, no toast. Was this feature intentionally disabled or is it broken? Here's what Playwright captured: [attach]"
- "The API returns field `campaign_id` but the frontend reads `id`. Which is correct? Here's the code: [attach]"
- "This list is sliced to show [0:5] items. Is this intentional or should there be a load more button?"
- "This action writes to the database but triggers no notification. Should you be alerted when this happens?"
- "Feature X is labeled Coming Soon. Should I document it as a gap or skip it entirely?"
- "Component X exists in the codebase but is not rendered anywhere. Was it removed intentionally?"

**Format every question with:**

```
Q[N]. [Tab: Name]
Visual evidence: [screenshot path or network response snippet]
Observation: [exactly what was seen]
Question: [what the correct behavior should be]
Options: [A] [B] [C] if multiple valid answers exist
```

**Deliver the complete questionnaire. Then stop.**

```
═══════════════════════════════════════════════════════════════
PHASE 1 QUESTIONNAIRE — [App Name]
Tabs audited: [N]
Anomalies found: [N]
Questions: [N]
═══════════════════════════════════════════════════════════════

[All questions with visual evidence]

═══════════════════════════════════════════════════════════════
AWAITING YOUR ANSWERS. Phase 2 will not begin until you respond.
Do not say "proceed" — answer every question specifically.
═══════════════════════════════════════════════════════════════
```

**Do not write any code. Do not push any deploy. Do not fix anything. Wait.**

---

## GATE 1 → 2: WHAT COUNTS AS A VALID ANSWER

Every question must be answered. "Looks good" and "proceed" are not valid.

A valid answer:
- Tells you what the correct behavior should be
- Tells you which data source or field name is authoritative
- Tells you whether a zero value is correct or broken
- Tells you what "passing" looks like for that feature

Once every question is answered, Phase 2 begins immediately.

---

## PHASE 2 — SELF-RECONFIGURATION

The system now knows what "correct" looks like for every feature. It writes that knowledge into three artifacts before executing anything.

### Step 1 — Write or update audit.profile.yml

If this is a first run, write the full profile from the grill session answers.
If the profile already exists, update it with any corrections from the questionnaire answers.

### Step 2 — Write or update audit.config.ts

Populate the config with:
- All routes discovered in Phase 0
- Auth configuration from the profile
- KPI labels and their correct expected values (from questionnaire answers)
- List selectors and minimum expected item counts
- Button selectors and their expected behaviors
- Timing values appropriate for this app's speed

```typescript
export const APP_CONFIG = {
  appName: '[from profile]',
  baseUrl:  '[from profile]',
  apiUrl:   '[from profile]',

  auth: {
    email:              '[from profile]',
    password:           '[from profile]',
    successUrlContains: '[from questionnaire]',
  },

  tabs: [
    // One entry per tab, populated from Phase 0 + questionnaire answers
    {
      name: '[Tab Name]',
      path: '[/route]',
      kpis: [
        {
          label:       '[KPI label]',
          selector:    '[selector from Phase 0 browser capture]',
          apiEndpoint: '[endpoint from Phase 0 code research]',
          expectedMin: [N from questionnaire answer],
        },
      ],
      lists: [ /* from Phase 0 */ ],
      buttons: [ /* from Phase 0 action inventory */ ],
    },
  ],

  timing: {
    pageLoad:    2000,
    afterClick:  1000,
    apiResponse: 5000,
  },
};
```

### Step 3 — Generate per-tab spec files

For every tab discovered in Phase 0, generate a dedicated spec file into `tests/audit/` in the user's project.

Each spec file is generated from the questionnaire answers — it knows exactly what "correct" means for this specific app.

```typescript
// tests/audit/[tab-name].spec.ts — generated by vibe-audit, do not edit manually
// Regenerate with: /vibe-audit (skill updates this file as your app evolves)

import { test, expect } from '@playwright/test';
import { APP_CONFIG } from '../../audit.config';

test.describe('[Tab Name]', () => {

  test('all KPIs show correct values', async ({ page }) => {
    // Generated from questionnaire answers — specific to this app
    await page.goto(APP_CONFIG.tabs.[tab].path);
    // ... assertions from answers
  });

  test('every button has a handler', async ({ page }) => {
    // Generated from Phase 0 action inventory
    // ... click each button, verify response
  });

  test('create [record type] persists on reload', async ({ page }) => {
    // Generated from action inventory + questionnaire
    // ... create, reload, verify
  });

  // One test per action in the inventory
});
```

### Step 4 — Write trap library

Write `tests/audit/trap-library.md` containing every trap discovered in Phase 0 for this specific app. This is the persistent memory of what breaks in this codebase.

```markdown
# Trap Library — [App Name]
Generated: [date]
Last updated: [date]

## [Tab Name]
- TRAP: [specific thing that fails in this app, with selector and root cause]
- TRAP: [another specific failure pattern]

## [Tab Name]
...
```

On subsequent audit runs, Phase 0 loads the trap library and uses it to direct Playwright attention to known failure points first.

---

## PHASE 3 — EXECUTION (FULLY AUTONOMOUS)

Once Phase 2 artifacts are written, execute everything from start to finish without stopping, without asking, and without waiting for approval.

No more questions. No more gates. The answers are in the config.

### PHASE 3A — FIX ALL BROKEN WIRES

For every anomaly documented in Phase 1, apply the fix the questionnaire answers specify.

Per-issue protocol:
1. Identify root cause (read the error, check network response, look at the schema)
2. Apply the fix
3. Deploy to production
4. Verify fix is live by hitting the endpoint or loading the tab
5. Mark as FIXED in the Phase 3 report
6. If still failing after 3 attempts: log as UNRESOLVED, move on — never stop

### PHASE 3B — RUN THE LIVING TEST SUITE

Run every spec file generated in Phase 2:

```bash
npx playwright test tests/audit/ --config=playwright.config.ts
```

For every failing test:
1. Read the failure — what was expected vs what was seen
2. Check whether it's a code bug or a config bug
3. If code: fix it, redeploy, re-run
4. If config: update `audit.config.ts` and re-run
5. Iterate until PASS or 3 attempts exhausted

### PHASE 3C — FULL ACTION EXECUTION

Execute every action in the inventory. In order. In the real browser.

```
STEP 1 — EXECUTE
  Navigate to the tab (signed in as the profile user)
  Locate the UI element
  Perform the action exactly as a user would: fill forms, click buttons, select options
  Do NOT use API calls as a substitute for UI actions

STEP 2 — VERIFY IMMEDIATE RESULT
  For creates: the new record appears in the list
  For triggers: progress shows, then result appears (not just "queued")
  For saves: success toast appears, form closes or fields update
  For archives: item disappears from the list

STEP 3 — VERIFY PERSISTENCE
  Reload the page
  Confirm the data is still there exactly as saved

STEP 4 — VERIFY CASCADE
  If the action updates a value that appears in multiple places:
    Navigate to every place it should appear
    Confirm every instance shows the updated value

STEP 5 — VERIFY DELIVERY
  For outbound actions: wait the full delivery window
  Call: 60s | Email: 2min | Webhook: 30s | Social: post appears in scheduler
  Confirm delivery at the contacts listed in audit.profile.yml
  Do NOT mark PASS based on a toast, DB row, or 200 response alone
```

**Pass/Fail classification:**

| Result | Classification |
|--------|---------------|
| Action executed, result visible, persists on reload, cascade correct | PASS |
| Action executed, result visible, but data lost on reload | FAIL — persistence bug |
| Action executed, toast shown, but result never appears | FAIL — silent failure |
| Action updated number in one place, wrong elsewhere | FAIL — cascade mismatch |
| Trigger fired, API 200, nothing happened downstream | FAIL — fire-and-forget failure |
| Outbound triggered, API 200, nothing arrived | FAIL — delivery broken (Critical) |
| Button click produces no response of any kind | FAIL — no handler |
| Action intentionally disabled / not implemented | N/A — document why |

### PHASE 3D — CONTENT QUALITY (if applicable)

For features that generate content (emails, AI drafts, proposals, messages):

| Criterion | Pass condition |
|-----------|----------------|
| Professional tone | No filler phrases, no "I wanted to reach out" |
| Specificity | At least one concrete data point per paragraph |
| No AI tells | Zero em-dashes, "Certainly!", "As an AI", "I hope this finds you well" |
| Personalization | Recipient name appears at least once |
| Actionability | Clear next step present |

Log the actual generated text verbatim — not just pass/fail. The user reads this.

---

## PHASE 4 — BUG FIX & REMEDIATION

### Per-audit open issues file

At the start of Phase 4, create immediately:

```
tests/audit/open-issues-[YYYY-MM-DD].md
```

Format:
```markdown
# Open Issues — [App Name] Audit [YYYY-MM-DD]

## CRITICAL
[issues that block core functionality]

## HIGH
[issues that affect data integrity]

## MEDIUM
[issues that affect UX]

## LOW
[minor gaps]

---

## Resolved During This Audit

| Issue | Fix | Deployed |
|-------|-----|----------|
```

### Retry protocol — 3 attempts per failing action

| Attempt | What counts as different |
|---------|------------------------|
| 1 | Execute the action exactly as specified |
| 2 | Try a variant — different input, different path to same action, check for missing prerequisite state |
| 3 | Read the relevant source file, identify root cause, apply fix, redeploy, re-execute |

After 3 attempts: log to open issues file, mark UNRESOLVED, continue.

### Severity classification

| Failure type | Severity |
|---|---|
| Outbound not delivered (call/email never arrived) | Critical |
| Feature completely broken (500, crash, unusable) | Critical |
| KPI hardcoded to 0 permanently | Critical |
| Data not persisted after save | High |
| Cascade not updating across tabs | High |
| Field name mismatch causing silent zero | High |
| Button with no handler | Medium |
| List sliced with no load-more | Medium |
| Client-side search limitation | Medium |
| Minor UX gap or label | Low |

---

## COMMON FAILURE PATTERNS (built from real audits)

| What you see | Root cause | Fix |
|---|---|---|
| KPI shows 0, API returns data | Field name mismatch | Check response field names against what frontend reads |
| KPI shows 0, API returns [] | Wrong table queried | Check backend — may query empty table |
| List empty, API 401 | Missing auth header | Add Authorization: Bearer token to fetch |
| List empty, API 200 | Silent exception in backend | Check server logs for swallowed exceptions |
| Button click, no navigation | Route not registered | Check server entry point for route registration |
| Tab produces zero findings | Login failed or wrong path | Verify auth and tab path values |
| Action writes DB, nothing arrives | asyncio fire-and-forget | Grep for `except Exception: pass` in service file |
| SKIP temptation | Missing seed data | Never skip — seed it, then test it |

---

## SEED-BEFORE-TEST PROTOCOL

If a feature cannot be tested because data is missing: create the data via the UI, then test the feature.

SKIPPED is not a valid test result. Valid statuses only:
- `PASS` — feature works, quality good, delivery confirmed
- `FAIL` — feature broken, specific error documented
- `QUALITY_FAIL` — feature works but content fails quality rubric
- `UNRESOLVED` — failed 3 attempts, root cause unknown

---

## FINAL REPORT FORMAT

```
═══════════════════════════════════════════════════════════════
VIBE AUDIT COMPLETE: [App Name]  [YYYY-MM-DD]
Phase 0 (Discovery):     [N components] [N endpoints] [N tables] [N traps found]
Phase 1 (Questionnaire): [N questions asked] [N answered]
Phase 2 (Configure):     audit.profile.yml ✓ | audit.config.ts ✓ | [N] spec files generated
Phase 3A (Fix wires):    [N] FIXED | [N] UNRESOLVED
Phase 3B (Test suite):   [N/N tests] PASS [N] FAIL [N]
Phase 3C (Actions):      [N/N actions] PASS [N] FAIL [N]
Phase 3D (Content QA):   [N/N] PASS | [N] QUALITY_FAIL
Phase 4 (Issues):        Open issues: tests/audit/open-issues-[date].md
═══════════════════════════════════════════════════════════════

API INTEGRITY:
  ✅ [endpoint]: 200 — [field names confirmed]
  ❌ [endpoint]: [status] — [root cause] — [fix applied or UNRESOLVED]

FIELD NAME MAPPING:
  ✅ [api field] → [frontend field]: match confirmed
  ❌ [api field] → [frontend field]: MISMATCH — [what frontend expects vs what API returns]

HARDCODED VALUES:
  ⚠️ [field]: hardcoded [value] — [recommendation]

SLICED LISTS:
  ⚠️ [list]: shows [N] of [total] — no load-more present

REAL-WORLD DELIVERY:
  ✅ [action] → [channel]: arrived at [contact] — [timestamp]
  ❌ [action] → [channel]: NOT DELIVERED within [wait window] — [root cause]

LIVING TEST SUITE:
  Generated: tests/audit/[tab].spec.ts for [N] tabs
  Re-run any time with: npx playwright test tests/audit/

TRAP LIBRARY:
  Written to: tests/audit/trap-library.md
  [N] traps documented for future audits

UNRESOLVED:
  ⚠️ [item]: [3 attempts, root cause hypothesis, what action is needed]

NEXT AUDIT: Run /vibe-audit again after your next major change.
═══════════════════════════════════════════════════════════════
```

---

## ARTIFACTS WRITTEN TO YOUR PROJECT

After a complete audit run, your project will contain:

```
your-project/
├── audit.profile.yml          ← your app's permanent identity (auth, URLs, contacts)
├── audit.config.ts            ← populated config for the Playwright engine
└── tests/
    └── audit/
        ├── [tab].spec.ts      ← one spec file per tab, re-runnable forever
        ├── trap-library.md    ← known failure patterns for this codebase
        └── open-issues-[date].md ← unresolved issues from this audit run
```

Re-run the full audit any time with `/vibe-audit`.
Re-run just the tests with `npx playwright test tests/audit/`.

---

## WHAT THIS SKILL DOES NOT DO

- Does not run performance benchmarks or load tests
- Does not test mobile/responsive layout
- Does not test accessibility (a11y)
- Does not replace your backend unit tests

## RELATIONSHIP TO OTHER SKILLS

| If you need... | Use instead... |
|---|---|
| Pre-modification blast radius check | `three-questions-audit` |
| Code safety before committing | `generated-code-review` |
| Debug a database schema issue | `database-operations` |
