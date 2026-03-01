# SPEC.md — Codebase Cleanup

_Last updated: 2026-03-01_
_Status: APPROVED_

## Problem
The codebase has accumulated several violations of the root standards defined in `/Users/n0xde/Files/CLAUDE.md`:
- Four functions exceed the ~40-line limit
- One file (`src/popup.ts`, 327 lines) exceeds the ~300-line limit
- Several `catch` blocks silently swallow errors without logging
- One `catch` block handles user-facing display but skips `console.error`
- One `console.log` is used for an error condition instead of `console.error`
- Two `as any` casts are removable without type regressions
- One async IIFE in a Chrome message listener has no error handler

No features are broken; this is a compliance and maintainability cleanup only.

## Goals
- Every source file is ≤ ~300 lines
- Every function is ≤ ~40 lines (measured as total lines from opening line to closing brace, including blank lines, comments, and nested callbacks)
- Every `catch` block either logs to `console.error` or has an explicit inline comment explaining why logging is intentionally omitted (e.g. expected no-op)
- No `console.log` calls are used for error conditions — `console.error` is used instead
- Two `as any` casts are removed from `popup.ts` and `readTable.ts` — only where the return value is unused and removal does not introduce type errors (`bunx tsc --noEmit` must still exit 0)
- Unhandled async rejections in event listener IIFEs are caught and logged
- All existing tests continue to pass (`bun run test` exits 0)
- Coverage stays ≥80% lines and functions per file for `formatData.ts` and `getDates.ts` (`bun run coverage` exits 0)
- `bun run build` exits 0
- `bunx tsc --noEmit` exits 0
- Key runtime behaviors are preserved: loading→success transition, stuck-detection timing (90 s), storage cleanup order in `finalizeDownload`, and `clickForward` always running after a scrape attempt

## Non-Goals
- No new features
- No new tests (existing coverage is already ≥80% for all testable pure functions; DOM/Chrome-API-dependent modules cannot be unit-tested without a browser environment)
- No changes to build configuration (webpack, tsconfig, vitest.config.ts)
- No changes to CSS, HTML, or manifest files
- No architectural changes (no new modules, no folder restructuring beyond what's required to meet the file-length limit)
- No changes to `bun.lock` beyond what `bun install` naturally produces
- No lint tool installation (Prettier is already present; no ESLint is added)
- No changes to test files

## Context

### Violations found in the audit (2026-03-01)

| File | Violation | Standard |
|------|-----------|----------|
| `src/popup.ts` | 327 lines | Max ~300 lines |
| `src/popup.ts:updateLoadingUI` | ~50 lines | Max ~40 lines |
| `src/readTable.ts:readTable` | ~62 lines | Max ~40 lines |
| `src/utils/scrapData.ts:scrapData` | ~48 lines | Max ~40 lines |
| `src/utils/scrapEvents.ts:addEvents` | ~64 lines | Max ~40 lines |
| `src/popup.ts:264` | `console.log("ERROR: ...")` | Use `console.error` for errors |
| `src/utils/format/formatData.ts:91` | `catch` block silent — no log | Always log to `console.error` |
| `src/popup.ts:198` | `catch` block silent — no log | Always log to `console.error` |
| `src/popup.ts:222` | `catch` handles UI only — no `console.error` | Always at minimum log to `console.error` |
| `src/readTable.ts:64` | `catch` block silent — no log | Always log to `console.error` |
| `src/contentScript.ts:16` | Async IIFE — no `.catch()` | Unhandled rejections must be caught |
| `src/popup.ts:213` | `as any` cast on unused return value | Removable without type regression |
| `src/readTable.ts:63` | `as any` cast on unused return value | Removable without type regression |

## Requirements

### Must Have
- [ ] `src/popup.ts` brought under ~300 lines by extracting self-contained logic into a new `src/utils/popupErrors.ts` module containing `getSmartErrorMessage` and `onError`
- [ ] `src/popup.ts:updateLoadingUI` brought under ~40 lines by extracting the loading-state branch into a private `applyLoadingState` helper
- [ ] `src/readTable.ts:readTable` brought under ~40 lines by extracting the scrape-week path into `scrapeWeek` and the finalise path into `finalizeDownload`
- [ ] `src/utils/scrapData.ts:scrapData` brought under ~40 lines by extracting the per-slot processing into a `processSlot` helper
- [ ] `src/utils/scrapEvents.ts:addEvents` brought under ~40 lines by extracting the per-event ICS object construction into a `buildEvent` helper
- [ ] `src/popup.ts:264` — `console.log("ERROR: ...")` changed to `console.error`
- [ ] `src/utils/format/formatData.ts:91` — `catch` block adds `console.error('[curtincalendar] getLocation fetch error:', err)` before returning `false`
- [ ] `src/popup.ts:198` — `checkIfOnEstudent` `catch` block adds `console.error` before falling back
- [ ] `src/popup.ts:222` — `onClick` `catch` block adds `console.error('[curtincalendar] onClick error:', error)` before calling `onError` (display and logging are both required)
- [ ] `src/readTable.ts:64` — message channel `catch` block adds `console.error` (even though the drop is intentional, silent failures are not permitted)
- [ ] `src/contentScript.ts:16` — async IIFE gains `.catch(err => console.error('[curtincalendar] contentScript init error:', err))`
- [ ] `src/popup.ts:213` — remove `as any` cast from `chrome.tabs.sendMessage` (return value is unused; the outer `(...)as any` wrapper is removed, not the `tab.id as number` cast which is still needed)
- [ ] `src/readTable.ts:63` — remove `as any` cast from `chrome.runtime.sendMessage` (return value is unused; no cast needed); verify `bunx tsc --noEmit` still exits 0

### Should Have
- [ ] Each new helper function has a one-line comment explaining its purpose and why it exists as a separate function

### Won't Have (this iteration)
- New test files for DOM/Chrome-API-dependent modules (`popup.ts`, `contentScript.ts`, `background.ts`, `readTable.ts`, `scrapData.ts`, `scrapEvents.ts`) — requires a browser or complex mock infrastructure
- ESLint or any new linting tool
- Any change to `src/background.ts` (already compliant — 14 lines, zero violations)
- Any change to `src/types.ts` (already compliant — 57 lines, zero violations)
- Any change to `src/utils/format/getDates.ts` (already compliant)
- Any change to `src/utils/format/formatData.ts` beyond the `catch` block fix
- Any change to `src/utils/scrapEvents.ts` beyond the `addEvents` function-length refactor (the `htmlEscape` helper is already correct and is not touched)

## Open Questions
None — all violations are well-defined against the root standard.

## Success Criteria
A "passing" codebase after this cleanup:
1. `bun run build` exits 0
2. `bun run test` — all 14 tests pass
3. `bun run coverage` — ≥80% lines and functions per file for `formatData.ts` and `getDates.ts`
4. `bunx tsc --noEmit` exits 0
5. No file in `src/` exceeds ~300 lines
6. No declared function in `src/` exceeds ~40 lines (measured from opening line to closing brace, including blanks/comments)
7. No `catch` block is silent without an explicit explanatory comment
8. No `console.log` for error conditions
9. The two `as any` wrapper casts on unused `sendMessage` return values are removed from `src/popup.ts` and `src/readTable.ts`; `bunx tsc --noEmit` still exits 0
10. Key runtime behaviors preserved: loading→success transition, stuck-detection timing, storage cleanup order, `clickForward` always runs after a scrape attempt

## Review History
| Round | Reviewer | Verdict | Date |
|-------|----------|---------|------|
| 1 | gpt-5.3-codex | NEEDS FIXES | 2026-03-01 |
| 2 | gpt-5.3-codex | APPROVED | 2026-03-01 |
