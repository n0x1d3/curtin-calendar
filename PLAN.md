# PLAN.md — Codebase Cleanup

_Last updated: 2026-03-01_
_Status: APPROVED_
_Spec: See SPEC.md (APPROVED 2026-03-01)_

## Approach

Fix all violations identified in SPEC.md in priority order: error-handling issues first (safest, zero structural risk), then `as any` casts, then function-length refactors, then file-length split. No new dependencies, no new tests, no architectural changes.

---

## Files to Change

| File | Changes |
|------|---------|
| `src/utils/format/formatData.ts` | Add `console.error` to `getLocation` catch block |
| `src/popup.ts` | Fix `console.log` → `console.error`; add logging to two catch blocks; remove `as any` cast; extract `getSmartErrorMessage`+`onError` to new file; split `updateLoadingUI` with `applyLoadingState` helper |
| `src/readTable.ts` | Add `console.error` to message-channel catch; remove `as any` cast; extract `scrapeWeek` and `finalizeDownload` helpers |
| `src/contentScript.ts` | Add `.catch()` to async IIFE |
| `src/utils/scrapData.ts` | Extract `processSlot` helper from `scrapData` |
| `src/utils/scrapEvents.ts` | Extract `buildEvent` helper from `addEvents` |

## Files to Create

| File | Purpose |
|------|---------|
| `src/utils/popupErrors.ts` | Contains `getSmartErrorMessage` and `onError`, extracted from `popup.ts` to bring it under ~300 lines |

---

## Implementation Steps (priority order)

### Priority 1 — Error handling (zero structural risk)

1. [ ] **`src/utils/format/formatData.ts:91`** — In `getLocation` catch block, bind the error and add logging before returning `false`:
   ```typescript
   } catch (err) {
     clearTimeout(timeout);
     console.error('[curtincalendar] getLocation fetch error:', err);
     return false;
   }
   ```

2. [ ] **`src/popup.ts:264`** — In `getSelectedSemester`, change `console.log` to `console.error`:
   ```typescript
   console.error("[curtincalendar] getSelectedSemester: no semester radio is checked");
   ```

3. [ ] **`src/popup.ts:198`** — In `checkIfOnEstudent` catch block, bind the error and add logging:
   ```typescript
   } catch (err) {
     console.error('[curtincalendar] checkIfOnEstudent failed:', err);
     button.disabled = false;
     button.classList.remove('disabled');
   }
   ```

4. [ ] **`src/popup.ts:222`** — In `onClick` catch block, add `console.error` before calling `onError`:
   ```typescript
   } catch (error) {
     console.error('[curtincalendar] onClick error:', error);
     onError(getSmartErrorMessage(error));
   }
   ```

5. [ ] **`src/readTable.ts:64`** — In message-channel catch block, bind the error and add logging:
   ```typescript
   } catch (err) {
     // Popup was closed before download completed — message channel is gone.
     // Log for debugging but this is an expected no-op.
     console.error('[curtincalendar] sendMessage (download) failed — popup likely closed:', err);
   }
   ```

6. [ ] **`src/contentScript.ts:16`** — Add `.catch()` to the async IIFE:
   ```typescript
   (async () => {
     await chrome.storage.local.set({ events: [], forward: 0, semester, totalWeeks });
     setDate(semester);
   })().catch((err) => console.error('[curtincalendar] contentScript init error:', err));
   ```

### Priority 2 — Remove unnecessary `as any` casts

7. [ ] **`src/popup.ts:213`** — Remove the outer `(...)as any` wrapper from `chrome.tabs.sendMessage`; the return value is discarded. Keep `tab.id as number` (still required):
   ```typescript
   await chrome.tabs.sendMessage(tab.id as number, {
     command: command.click,
     semester: getSelectedSemester(),
   });
   ```

8. [ ] **`src/readTable.ts:63`** — Remove the outer `(...)as any` wrapper from `chrome.runtime.sendMessage`; the return value is discarded:
   ```typescript
   await chrome.runtime.sendMessage({
     command: command.download,
     value: value,
     semester: semester,
     year: new Date().getFullYear(),
   });
   ```

### Priority 3 — Function-length refactors

9. [ ] **`src/utils/scrapData.ts:scrapData` (~48 lines)** — Extract a `processSlot` helper. `processSlot` takes `(metDataElement, nameIdElement, date, dayIndex)` and returns a `scrapedDataType`. `scrapData` calls it and pushes the result:
   ```typescript
   // Extracts all typed fields from a single matched slot element pair and
   // returns a structured event object. Isolated so scrapData stays scannable.
   async function processSlot(
     metDataElement: HTMLElement,
     nameIdElement: HTMLElement,
     date: Date,
     dayIndex: number,
   ): Promise<scrapedDataType> { ... }
   ```

10. [ ] **`src/utils/scrapEvents.ts:addEvents` (~64 lines)** — Extract a `buildEvent` helper. `buildEvent` takes a `scrapedDataType` and a resolved `Date` and returns a complete `EventAttributes` object. `addEvents` calls it and pushes the result:
    ```typescript
    // Builds a complete ICS EventAttributes object from a single scraped class.
    // Extracted from addEvents to keep that function within the ~40-line limit.
    function buildEvent(event: scrapedDataType, date: Date): EventAttributes { ... }
    ```

11. [ ] **`src/readTable.ts:readTable` (~62 lines)** — Extract two helpers:
    - `scrapeWeek(events, forward)` — calls `addEvents`, updates storage, calls `clickForward`; handles the catch/log/skip itself
    - `finalizeDownload(events, semester)` — clears storage, calls `createEvents`, sends message, resets date input
    ```typescript
    // Scrapes the current timetable week, saves progress to storage, and advances
    // to the next week. On failure, logs and skips the week to avoid an infinite loop.
    async function scrapeWeek(events: EventAttributes[], forward: number): Promise<void> { ... }

    // Called when all weeks have been scraped. Generates and downloads the ICS file,
    // or stores a lastError for the popup if no events were found or generation failed.
    async function finalizeDownload(events: EventAttributes[], semester: 1 | 2): Promise<void> { ... }
    ```

12. [ ] **`src/popup.ts:updateLoadingUI` (~50 lines)** — Extract `applyLoadingState(forward, total)` for the loading branch. **Invariants that must be preserved exactly:**
    - `wasLoading = true` is set inside the loading branch (this drives the `loading→success` transition)
    - `STUCK_MS = 90_000` is unchanged — do not alter the stuck-detection threshold
    - `lastForwardValue`/`lastForwardTime` update logic is unchanged
    - `progressBar.style.width` and `progressText.textContent` are set in the loading branch (move to `applyLoadingState`)
    ```typescript
    // Updates all loading-state UI elements for the active scrape phase.
    // Handles stuck-detection and progress bar calculations.
    // Extracted from updateLoadingUI to keep that function within the ~40-line limit.
    function applyLoadingState(forward: number, total: number): void { ... }
    ```

### Priority 4 — File-length split

13. [ ] **`src/popup.ts` (327 lines)** — Create `src/utils/popupErrors.ts` and move `getSmartErrorMessage` and `onError` into it. Update `popup.ts` to import them. This brings `popup.ts` under ~300 lines. `popupErrors.ts` receives the necessary DOM references (`button`, `loaderArea`, `successArea`, `errorElement`, `progressBar`) as function parameters or imports, whichever avoids circular dependencies. Prefer passing DOM refs as parameters to keep `popupErrors.ts` testable and dependency-free.

---

## Edge Cases

- `scrapeWeek` must call `clickForward()` unconditionally after the try-catch — the existing `readTable` already does this; the extraction must preserve this invariant
- `finalizeDownload` must call `chrome.storage.local.remove` before the `events.length === 0` check (existing order) to avoid leaving stale session state if we return early
- `buildEvent` must preserve both `description` (plain text) and `htmlContent` (escaped HTML) fields — do not collapse them
- Removing `as any` from `sendMessage` calls: verify `bunx tsc --noEmit` exits 0 after the change before committing
- `popupErrors.ts`: `onError` calls `stopPolling` and accesses `wasLoading` — these are module-level state in `popup.ts`. Move `onError` to accept a `stopPollingFn: () => void` callback parameter, or export `stopPolling` from `popup.ts`. The simpler approach is to keep `stopPolling` in `popup.ts` and pass it as a parameter.

---

## Verification

- `bun run build` — exits 0
- `bun run test` — all 14 tests pass
- `bun run coverage` — ≥80% lines and functions per file for `formatData.ts` and `getDates.ts`
- `bunx tsc --noEmit` — exits 0
- **File-length check:** `find src -name '*.ts' ! -name '*.test.ts' -print0 | xargs -0 wc -l | sort -n` — no file exceeds ~300 lines
- **Function-length check:** manually verify every declared function in all modified files (`popup.ts`, `readTable.ts`, `scrapData.ts`, `scrapEvents.ts`, `contentScript.ts`, `formatData.ts`, and the new `popupErrors.ts`) plus all newly extracted helpers are ≤~40 lines
- **Catch-block audit:** `rg -n "} catch|catch (" src/` — review every match; confirm each catch block contains `console.error` (anywhere within the block, not necessarily on the immediate next line) or an explicit intentional-no-log comment
- **console.log audit:** `rg -n "console\.log" src/` — must return no results
- **Behavior invariants:** `wasLoading` transition logic and `STUCK_MS = 90_000` are unchanged in `popup.ts`; `clickForward()` still runs unconditionally after the `scrapeWeek` try-catch; `chrome.storage.local.remove` is called before the `events.length === 0` early return in `finalizeDownload`

---

## Review History

| Round | Reviewer | Verdict | Date |
|-------|----------|---------|------|
| 1 | gpt-5.3-codex | NEEDS FIXES | 2026-03-01 |
| 2 | gpt-5.3-codex | NEEDS FIXES | 2026-03-01 |
| 3 | gpt-5.3-codex | APPROVED | 2026-03-01 |
