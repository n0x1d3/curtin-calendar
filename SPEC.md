# SPEC.md — Infrastructure: bun migration + test framework

_Last updated: 2026-02-27_
_Status: APPROVED_

## Problem
Two infrastructure gaps exist that violate root project standards (CLAUDE.md):
1. The project uses npm (`package-lock.json`, internal `npm run` script calls) — root standards mandate bun exclusively.
2. No test framework is configured — root standards require ~80% coverage on business logic.

## Goals
- Replace npm with bun as the sole package manager
- Set up Vitest as the test framework with coverage reporting
- Write unit tests for all pure business-logic functions in `src/utils/format/formatData.ts` and `src/utils/format/getDates.ts`
- All tests pass and `bun run test` exits 0 locally

## Non-Goals
- Testing DOM-dependent or Chrome-API-dependent code (popup, background, content script)
- Changing any application logic or behaviour
- Migrating from webpack to vite or any other build tool
- Enforcing coverage thresholds in CI (out of scope for this iteration)

## Context
Pure functions confirmed testable (no DOM, no Chrome API):

**`src/utils/format/formatData.ts`**
- `parseTo24h(time: string): timeStamp` — converts "8:00am" → `{ hour, minutes }`
- `splitToStartEnd(timeString: string)` — splits a time range string into start/end parts
- `convertTime(timeString: string): classTimeType` — converts a time range with duration calculation

**`src/utils/format/getDates.ts`**
- `getnthMonday(date: Date, n: number): Date` — returns the nth Monday from a base date
- `addnWeeks(date: Date, n: number): Date` — adds n weeks to a date
- `calculateDatesPre2026(year: number): SemesterDates` — calculates semester dates before 2026
- `calculateDates2026Plus(year: number): SemesterDates` — calculates semester dates 2026+
- `calculateDates(year: number): SemesterDates` — dispatches to the appropriate year calculator
- `getDates(year: number): SemesterDates` — returns semester metadata (lookup table then calculated)
- `getSemesterWeeks(year: number, semester: 1|2): number` — returns week count for a semester

Stack: TypeScript + Webpack 5 + Chrome MV3. Build uses `ts-loader`. No vite in the project.

## Requirements

### Must Have
- [ ] `bun install` exits 0; `bun.lock` (Bun ≥1.0.0 default) present and committed; `package-lock.json` absent from working tree
- [ ] Internal `npm run` calls in `package.json` scripts (`repack`, `repack:beta`) replaced with `bun run`
- [ ] `package.json` gains new scripts: `"test": "TZ=UTC vitest run"`, `"test:watch": "TZ=UTC vitest"`, `"coverage": "TZ=UTC vitest run --coverage"`; `TZ=UTC` inline env is the standard POSIX/macOS approach — Windows is not a supported platform for this project
- [ ] `rm -rf build/ && bun run build` exits 0 and `build/` contains the four bundles from `config/webpack.config.js` entry points: `popup.js`, `background.js`, `contentScript.js`, `readTable.js`
- [ ] Vitest and `@vitest/coverage-v8` installed as devDependencies with pinned versions in `package.json`; `bun.lock` committed to lock transitive dependencies for deterministic installs
- [ ] `vitest.config.ts` created with:
  - `environment: 'node'`
  - `include: ['src/**/*.test.ts']` (test file discovery pattern)
  - `coverage.provider: 'v8'`
  - `coverage.include: ['src/utils/format/formatData.ts', 'src/utils/format/getDates.ts']`
  - `coverage.reporter: ['text']`
  - `coverage.thresholds: { perFile: true, lines: 80, functions: 80 }` (per-file enforcement, so each included file must individually meet 80%)
- [ ] Test files placed at `src/utils/format/formatData.test.ts` and `src/utils/format/getDates.test.ts`
- [ ] `bun run test` (which runs `TZ=UTC vitest run`) exits 0; timezone is fixed in the script — no separate invocation required
- [ ] `bun run coverage` exits 0 with ≥80% lines and functions on the two included files (scoped exception: full-codebase 80% target deferred to a future iteration once DOM/Chrome-API mocking is in place)
- [ ] Valid-input behavior of `formatData.ts` and `getDates.ts` covered via the three public exports only (`convertTime`, `getDates`, `getSemesterWeeks`) — no direct tests for private functions; no new exports added to production modules for testability; tests must not mutate shared `Date` instances (construct a fresh `Date` per assertion); invalid-input handling is explicitly excluded from coverage scope
- [ ] `convertTime` test cases must include at minimum: a standard am range (`"9:00am - 10:00am"`), a standard pm range (`"2:30pm - 3:30pm"`), midnight boundary (`"12:00am - 1:00am"`, expected hour 0), and noon boundary (`"12:00pm - 1:00pm"`, expected hour 12); canonical input format is `"H:MMam - H:MMpm"` with spaces around the dash (matching timetable source data and the single-space-strip behavior in `splitToStartEnd`)
- [ ] `getDates` tests verify exact `{ month, day }` values for one representative year per path:
  - **2025** (pre-2026 calculated): sem1 `{ month:2, day:24 }` → `{ month:5, day:25 }` weeks 13; sem2 `{ month:7, day:21 }` → `{ month:10, day:19 }` weeks 13
  - **2026** (lookup table): sem1 `{ month:2, day:16 }` → `{ month:5, day:22 }` weeks 14; sem2 `{ month:7, day:20 }` → `{ month:10, day:23 }` weeks 14
  - **2029** (post-2028 calculated): sem1 `{ month:2, day:19 }` → `{ month:5, day:27 }` weeks 14; sem2 `{ month:7, day:16 }` → `{ month:10, day:21 }` weeks 14
  - assertions must also confirm `start.month ≤ end.month` and `weeks > 0` for the tested year
- [ ] `getSemesterWeeks` test matrix (exact expected values from existing source behavior):
  - 2025 sem1 → 13, 2025 sem2 → 13 (pre-2026 calculated path)
  - 2026 sem1 → 14, 2026 sem2 → 14 (lookup-table path)
  - 2029 sem1 → 14, 2029 sem2 → 14 (post-2028 calculated path, 2026+ formula)
- [ ] All npm command references removed from non-`node_modules` source files; known locations as of this writing (non-normative snapshot): `package.json` scripts, `package-lock.json`, `README.md` Contributing section, `pack.beta.js` comment and error message; the grep verification command below is the authoritative acceptance check
- [ ] Verification command passes with no output: `grep -RInE "npm run|npm install|npm i([[:space:]]|$)|npm ci|npx " --exclude-dir=node_modules --exclude-dir=build --exclude-dir=build-beta --exclude-dir=release --exclude="SPEC.md" --exclude="AGENTS.md" --exclude="MEMORY.md" --exclude="PLAN.md" .`

### Should Have
- [ ] `bun run test:watch` starts Vitest in watch mode without config errors (acceptance: process starts and outputs "waiting for file changes…" or equivalent)

### Won't Have (this iteration)
- CI pipeline setup or changes (no CI config exists in this project)
- Coverage thresholds enforced in CI
- Tests for DOM/Chrome-API code
- Malformed/invalid input handling tests for time-parsing or date functions
- Migration away from webpack
- Any changes to application logic or runtime behavior

## Open Questions
- None — approach is clear.

## Review History
| Round | Reviewer | Verdict | Date |
|-------|----------|---------|------|
| 1 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 2 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 3 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 4 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 5 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 6 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 7 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 8 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 9 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 10 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 11 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 12 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 13 | gpt-5.3-codex | NEEDS FIXES | 2026-02-27 |
| 14 | gpt-5.3-codex | APPROVED | 2026-02-27 |
