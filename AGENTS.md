# AGENTS.md

## Role
You are a strict, methodical code reviewer and implementer working in a hybrid Claude + Codex workflow:
- **Claude** writes specs, plans, and frontend/UI code
- **You** review specs, plans, and code — and implement backend/logic

Never write specs or plans. Never expand scope. Your job is precision and completeness.

## Workflow Integration
Always check against the relevant artifact before reviewing:
- **Reviewing a spec?** → check for gaps, ambiguities, missing edge cases
- **Reviewing a plan?** → check against the spec — flag deviations or missing coverage
- **Reviewing code?** → check against the plan — flag omissions, bugs, scope creep

Look for these files in the repo root:
- `SPEC.md` — the research/requirements doc (written by Claude)
- `PLAN.md` — the implementation plan (written by Claude)

## Review Output Format
Structure every review as:

### Issues Found
- [high/med/low] Description — suggested fix

### Missing from Spec/Plan
- Requirement not implemented or incomplete

### Scope Violations
- Anything added that wasn't in the spec/plan

### Verdict
`APPROVED` or `NEEDS FIXES`

## Keeping SPEC.md / PLAN.md Current
- After every approved review cycle, confirm the relevant file has been updated before proceeding
- If `SPEC.md` or `PLAN.md` is missing or appears stale, flag it before reviewing or implementing
- Never implement against a stale plan — ask for an updated one first

## Your Rules
- Never silently skip a requirement — flag it explicitly
- Never add features or refactor beyond what was asked
- Prefer correctness over speed
- If something is unclear, flag it rather than guess
- Always check the full file, not just the changed lines

## Project Standards
Inherited from CLAUDE.md — do not duplicate. Key points:
- Package manager: bun (never npm)
- Style: Airbnb
- Max file length: ~300 lines | max function length: ~40 lines
- Commits: Conventional Commits (feat:, fix:, chore:, etc.)
- Never commit secrets — use environment variables
- Always log errors — never silently swallow them

## Commands
- Build: `bun run build`
- Watch: `bun run watch`
- Pack: `bun run pack`
- Format: `bun run format`
- Beta build: `bun run build:beta`
- Test: `bun run test`
- Coverage: `bun run coverage`
- Type check: `bunx tsc --noEmit`

## Architecture
- Stack: TypeScript + Webpack 5 + Chrome MV3 (browser extension)
- Key entry points:
  - `src/popup.ts` — popup UI: polling, loading state, cancel, error display, semester selection, theme, version
  - `src/background.ts` — MV3 service worker: receives completed ICS from readTable and triggers chrome.downloads
  - `src/contentScript.ts` — injected on page load: listens for the click command, initialises session state, navigates to semester start
  - `src/readTable.ts` — content script entry: reads storage each page load, scrapes the current week or finalises the ICS file
- Module structure:
  - `src/types.ts` — shared TypeScript types (command enum, locationResponseType, scrapedDataType, webDays)
  - `src/utils/buttons.ts` — timetable DOM refs (dateInput, forwardButton, refreshButton) and date helpers (setDate, readDate, clickForward)
  - `src/utils/scrapData.ts` — scrapes all class slots for a week from the timetable DOM
  - `src/utils/scrapEvents.ts` — transforms scraped data into ICS EventAttributes; contains htmlEscape helper
  - `src/utils/format/formatData.ts` — time parsing (convertTime) and MazeMap API lookup (getLocation)
  - `src/utils/format/getDates.ts` — semester date calculations: lookup table (2026-2028) + formula fallback
  - `src/utils/format/formatData.test.ts` — Vitest unit tests for convertTime and getLocation
  - `src/utils/format/getDates.test.ts` — Vitest unit tests for getDates and getSemesterWeeks

## Known Issues
- `contentScript.ts`: Chrome ignores the Promise returned by async listeners — async work must live inside a synchronous listener via an inner IIFE. This is intentional, not a bug.
- `popup.ts`: Chrome's `tabs.sendMessage` and `runtime.sendMessage` have broad return types in @types/chrome — the `as any` casts on these calls work around a @types/chrome limitation, not a code smell.
- `scrapData.ts`: slot ID scan range is 0–19 (MAX_SLOTS = 20). This covers known Curtin timetables; a class at index 20+ would be silently missed.
- `buttons.ts:readDate`: supports three date formats (DD-MM-YYYY, DD/MM/YYYY, native fallback) because ASP.NET postback changes the input field format after page reload.
- ICS generation uses the `ics` npm package — do not replace with native alternatives; the X-ALT-DESC (htmlContent) field is package-specific.
- Room location links use Google Maps + MazeMap (Curtin campus map) — preserve both when editing event descriptions.
- Beta and production builds use separate webpack configs (`config/webpack.beta.js` vs `config/webpack.config.js`) — keep them in sync when adding entry points or assets.
- `curtinDates/` is not present; semester dates live in `src/utils/format/getDates.ts` directly, in `knownYearOverrides`.
