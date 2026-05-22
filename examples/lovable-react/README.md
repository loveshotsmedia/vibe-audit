# Example: Lovable React App

This example shows what `audit.config.ts` and `audit.profile.yml` look like after vibe-audit runs on a typical Lovable-built React application.

**You do not write these files manually.** The vibe-audit skill generates them after:
1. Running Phase 0 (codebase research + browser audit)
2. You answering the questionnaire

This example is for reference — to show you what the generated files look like before you run your first audit.

## Typical Lovable app patterns this example handles

- `data-testid` attributes (Lovable adds these by default)
- Railway backend at `*.up.railway.app`
- Lovable frontend at `*.lovable.app`
- Standard modal/toast patterns from shadcn/ui
- Supabase as the database (API calls go through Railway, not direct Supabase)
