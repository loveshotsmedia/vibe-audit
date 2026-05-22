# How vibe-audit Works

## The core problem it solves

Vibe-coded apps have a specific failure pattern: the backend is correct, the database has data, the AI wrote a component — but the UI doesn't show what it should. The field name is wrong. The selector doesn't match. The button has no handler. Nobody ran the actual browser.

vibe-audit runs the actual browser.

---

## Phase 0: Simultaneous Discovery

Two tracks run in parallel — code research and browser audit — at the same time.

**Track A: 11-agent parallel code research**

Eleven specialized agents are dispatched simultaneously across your codebase:

| Agent | What it finds |
|---|---|
| Components | Every React/Vue/Svelte component on the tab, with file paths and props |
| API Endpoints | Every fetch/query call, method, URL pattern, expected response shape |
| Backend Handlers | The server functions that serve those API calls, with response field names |
| Navigation | Every route linked to or navigated from this tab |
| Auth | What auth is required, what guards exist |
| Observability | Which actions write records, which actions leave no trail |
| Test Coverage | What's already tested, what's not |
| Known Issues | Disabled features, TODOs, broken patterns |
| Integrations | Every external service the tab touches |
| Visual Contract | Modal list, empty states, loading states, sliced lists, hardcoded values |
| Action Inventory | Every discrete action a user can take, with test case specs |

**Track B: Playwright browser audit**

While the 11 agents read code, Playwright opens your app and:
- Navigates to every tab
- Takes full-page screenshots
- Intercepts all network requests and responses
- Clicks every visible button
- Records what happens (network request fired? navigation? modal? toast? nothing?)
- Flags every KPI showing 0, every empty list, every placeholder value

Both tracks complete before the questionnaire is generated.

---

## Phase 1: Questionnaire

The questionnaire is generated from both sources. Every question comes with evidence — a screenshot, a network response, a code snippet.

You are not answering from memory. You are looking at receipts.

Example questions:
- "This KPI shows 0 but the database has 47 records. Should this count active campaigns (status=1) or all campaigns? [screenshot attached]"
- "This button click produced no network request, no navigation, no modal, and no toast. Was this feature intentionally disabled? [Playwright log attached]"
- "The API returns `campaign_id` but the frontend reads `id`. Which is the source of truth?"

The system stops after delivering the questionnaire. It waits for your answers.

---

## Phase 2: Self-Reconfiguration

Once you answer every question, the system writes three things into your project:

**audit.profile.yml** — your app's permanent identity: URL, auth credentials, delivery contacts. Loaded automatically on every future audit. Never re-entered.

**audit.config.ts** — populated with every tab's routes, KPI selectors, expected values, list selectors, and button selectors. Derived from Phase 0 + your questionnaire answers.

**tests/audit/[tab].spec.ts** — one spec file per tab, with assertions that reflect what correct behavior looks like for YOUR app specifically. These are real Playwright test files. You can re-run them with `npx playwright test tests/audit/` any time you ship a change.

**tests/audit/trap-library.md** — every failure pattern discovered in this codebase, with selectors and root causes. Loaded by future audits so they start knowing where to look.

---

## Phase 3: Execution

With the config written and the questionnaire answered, Phases 3 and 4 run autonomously — no more questions, no more stops.

- **3A**: Fix all broken wires identified in Phase 0 (field mismatches, missing routes, broken endpoints)
- **3B**: Run the generated test suite — every spec file, tab by tab
- **3C**: Execute every action in the action inventory — create records, submit forms, trigger pipelines, verify cascade updates
- **3D**: For apps with AI-generated content, evaluate quality (tone, specificity, no AI tells)

---

## Phase 4: Fix and Report

Every failure gets three attempts with genuinely different approaches. After three failed attempts, the issue is logged to `tests/audit/open-issues-[date].md` with severity, root cause hypothesis, and all three attempts documented.

The final report shows:
- Every tab: API integrity, field mapping, navigation, KPI values
- Every action: pass/fail/unresolved with evidence
- Every fix: what was broken, what was done, verification result
- The living test suite location
- Open issues requiring manual attention

---

## The living test suite

The most important output of vibe-audit is not the report — it is the test suite that stays in your project.

Every time you let the AI touch your code, run:

```bash
npx playwright test tests/audit/
```

It takes minutes. It catches regressions before your users do.
