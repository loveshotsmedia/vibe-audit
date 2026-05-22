---
name: vibe-audit
description: Run a full Playwright audit of your vibe-coded app. Finds broken KPIs, dead buttons, missing data, and generates a living test suite customized to your app.
---

Invoke the tab-deep-audit skill for this project.

On first run:
1. Ask for your app URL, backend URL, and login credentials
2. Write audit.profile.yml to your project root
3. Run Phase 0 (11-agent code research + Playwright browser audit simultaneously)
4. Generate a questionnaire with screenshots attached
5. Wait for your answers

After you answer:
6. Write audit.config.ts with your app's routes, KPIs, and buttons
7. Generate per-tab spec files into tests/audit/
8. Write tests/audit/trap-library.md
9. Fix all broken wires
10. Run the living test suite
11. Deliver the final report

On subsequent runs:
- Loads audit.profile.yml automatically
- Skips the interview
- Goes straight to Phase 0
- Updates the living test suite with any new tabs or changed behavior

Your test suite lives at tests/audit/ and can be re-run any time:
npx playwright test tests/audit/
