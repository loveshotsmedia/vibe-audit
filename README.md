# vibe-audit

> Your AI said "done." Your database has data. Your app is deployed.
> But nobody clicked the buttons.

**vibe-audit** is a Claude Code skill + Playwright engine that systematically tests every tab of your vibe-coded app by actually using it the way your users will.

---

## What it finds

- KPI cards showing 0 when your database has hundreds of records
- Buttons that look real but have no onClick handler
- Forms that return 200 but don't persist on reload
- Backend fields named `campaign_id` that your frontend reads as `id`
- Lists sliced to 5 items with 500 more hidden behind no load-more
- Background jobs that say "sent" in the database but never arrive

## Why this exists

When you build with Lovable, Cursor, or Bolt, the AI generates code that *looks* complete. The database has data. The API endpoint exists. The component renders. But somewhere in between, the wire is broken in a way no conversation with the AI will surface — because the AI does not click things.

vibe-audit clicks things.

## What you get after one run

**1. A questionnaire** generated from what the browser actually found, with screenshots attached. You answer once. The system learns what "correct" means for your app.

**2. A living test suite** — per-tab Playwright specs written to `tests/audit/` in your project. Re-run with `npx playwright test tests/audit/` every time you ship a change.

**3. A trap library** — `tests/audit/trap-library.md` — a persistent record of every failure pattern discovered in your specific codebase. Future audits start knowing where to look.

---

## Install

### Option 1: Claude Code plugin (recommended)

```bash
npx skills add loveshotsmedia/vibe-audit
```

Then in Claude Code:

```
/vibe-audit
```

### Option 2: Manual install

```bash
git clone https://github.com/loveshotsmedia/vibe-audit
```

Copy `vibe-audit/SKILL.md` into your project at `.claude/skills/tab-deep-audit/SKILL.md`.

Copy the engine files:
```bash
cp vibe-audit/engine/audit.config.ts ./audit.config.ts
cp vibe-audit/engine/playwright.config.ts ./playwright.config.ts
npm install -D @playwright/test typescript ts-node
npx playwright install chromium
```

---

## Requirements

- Claude Code (claude.ai/code or VS Code extension)
- Node.js 18+
- A deployed web app with a login page

---

## How it works

See [docs/how-it-works.md](how-it-works.md) for the full 4-phase breakdown.

---

## License

MIT. Built by [Love Shots Media](https://loveshotsmedia.com).
