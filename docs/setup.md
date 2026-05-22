# Setup Guide

## Requirements

- Claude Code (claude.ai/code or VS Code extension)
- Node.js 18 or higher
- A deployed web app with a login page (Lovable, Vercel, Railway, anywhere)

---

## Option 1: Claude Code Plugin (recommended)

```bash
npx skills add loveshotsmedia/vibe-audit
```

This installs the skill into your Claude Code environment. Then from your project:

```
/vibe-audit
```

Claude will ask for your app URL and auth credentials on first run, then proceed automatically.

---

## Option 2: Manual Install

### Step 1: Clone the repo

```bash
git clone https://github.com/loveshotsmedia/vibe-audit
```

### Step 2: Copy the skill

```bash
mkdir -p your-project/.claude/skills/tab-deep-audit
cp vibe-audit/vibe-audit/SKILL.md your-project/.claude/skills/tab-deep-audit/SKILL.md
```

### Step 3: Copy the engine files

```bash
cp vibe-audit/engine/audit.config.ts your-project/audit.config.ts
cp vibe-audit/engine/playwright.config.ts your-project/playwright.config.ts
```

### Step 4: Install dependencies

From your project root:

```bash
npm install -D @playwright/test typescript ts-node
npx playwright install chromium
```

### Step 5: Run

Open Claude Code in your project and type:

```
/vibe-audit
```

---

## What happens on first run

1. Claude asks: "What is your app URL?" and "What are your login credentials?"
2. Writes `audit.profile.yml` to your project root
3. Launches 11 agents across your codebase simultaneously
4. Opens Playwright and exercises every tab in your app at the same time
5. Generates a questionnaire with screenshots attached — stops and waits for you
6. After you answer: writes `audit.config.ts`, generates `tests/audit/*.spec.ts`, runs fixes
7. Delivers the final report

---

## What happens on subsequent runs

1. Loads `audit.profile.yml` — no interview needed
2. Goes straight to Phase 0 (code research + browser audit)
3. Generates a delta questionnaire — only asks about new anomalies since last audit
4. Updates the living test suite

---

## Re-running your test suite

After the first audit, your tests live in `tests/audit/`. Run them any time:

```bash
npx playwright test tests/audit/
```

Or a specific tab:

```bash
npx playwright test tests/audit/dashboard.spec.ts
```

---

## Credentials security

`audit.profile.yml` contains your login credentials. It is automatically added to `.gitignore` by the skill on first run. Never commit it.
