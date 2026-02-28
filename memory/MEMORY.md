# Environment
- Primary working directory: /Users/n0xde/Files/Code Test Environment/curtincalendar
- Platform: darwin | zsh | Darwin 25.3.0

# Communication Style
- Be concise, no filler phrases or padding
- Skip affirmations ("Great question!", "Sure!")
- Don't re-explain what you just did — just do it
- Flag uncertainty explicitly rather than guessing confidently
- Ask only one clarifying question at a time if needed

# Session Behaviour
- At the start of every session: read memory files BEFORE reading source files
- Save incrementally AS YOU GO — after every significant discovery, not at the end
- Stop and save if context is getting large
- Update memory after significant changes
- Prefer memory over re-reading source files; only re-read when stale or line number needed
- Keep memory concise — bullet points and code snippets over prose

# Best Practices
- Verify work: run tests/linter after every change — don't rely on code "looking right"
- Explore → Plan → Code → Commit (use Plan Mode for multi-file/uncertain tasks)
- Course-correct early — don't let bad approaches accumulate
- /clear between unrelated tasks
- Subagents for research/investigation — keeps main context clean
- After 2 failed corrections: stop, /clear, write a better prompt

# Claude + Codex Workflow
Codex CLI is installed globally (OPENAI_API_KEY in ~/.zshrc). Trigger: "implement it with codex".
- Codex requires explicit login — env var alone is not enough: `printenv OPENAI_API_KEY | codex login --with-api-key`
- Check login status: `codex login status`
- Codex uses `/v1/responses` endpoint (requires OpenAI Tier 1 / billing credits, not just a valid key)
- Default model: `gpt-5.3-codex` — do NOT use `-m o4-mini` (no metadata, falls back to web search instead of shell tools)
- Each project has `AGENTS.md` (bootstrapped from `/Users/n0xde/Files/agents-template.md`) — Codex's equivalent of CLAUDE.md
- Spec lives in `SPEC.md`, plan in `PLAN.md` — Codex checks against these when reviewing

**SPEC.md / PLAN.md are the shared source of truth between Claude and Codex:**
- Claude updates `SPEC.md` after every approved spec review cycle
- Claude updates `PLAN.md` after every approved plan review cycle
- At the start of each session: verify these files reflect current state before proceeding
- Never start implementation if PLAN.md is stale or missing

**Loop (repeat each review 2-3x until clean):**
1. **Spec** — Claude Opus: turn messy context into a research doc/spec
2. **Review spec** — Codex 5.2 high: critique gaps/omissions → Claude fixes
3. **Plan** — Claude Opus: write implementation plan from approved spec
4. **Review plan** — Codex 5.2 high: audit plan vs spec → Claude fixes
5. **Implement** — Codex (backend/logic) or Sonnet (frontend/UI/creative)
6. **Review code** — Codex 5.2 high: audit code vs plan → Claude fixes → ship

**Prompt cadence (always do this after each step):**
- After writing SPEC.md → say: "SPEC.md is ready. **Prompt:** `review the spec with codex`"
- After SPEC approved → write PLAN.md → say: "PLAN.md is ready. **Prompt:** `review the plan with codex`"
- After PLAN approved → say: "Plan is approved. **Prompt:** `implement it with codex`"
- Never skip steps or collapse the loop — always wait for user to trigger Codex

**Model heuristic:**
- Opus → spec, planning, UI/creative code
- Codex 5.2 high → all reviews, backend logic, strict implementation
- Sonnet → mid-weight tasks when Opus limits are tight
- Haiku → quick edits, small tweaks, back-and-forth

# Commands
- Build: `bun run build` (webpack production)
- Watch: `bun run watch` (webpack dev + watch)
- Pack: `bun run pack` (zip for Chrome Web Store)
- Format: `bun run format` (prettier)
- Test: `bun run test` (Vitest, TZ=UTC)
- Coverage: `bun run coverage` (Vitest + v8, 80% per-file threshold)
- Beta variants: `bun run build:beta`, `bun run watch:beta`, `bun run repack:beta`

# Architecture
- Stack: TypeScript + Webpack 5 + Chrome MV3 (browser extension)
- Key entry points:
  - `src/popup.ts` — popup UI logic
  - `src/background.ts` — service worker (MV3)
  - `src/contentScript.ts` — injected into Curtin timetable page
- Module structure:
  - `src/readTable.ts` — parses timetable HTML
  - `src/types.ts` — shared TypeScript types
  - `src/utils/scrapData.ts` — scrapes raw data from page
  - `src/utils/scrapEvents.ts` — transforms scraped data into ICS events
  - `src/utils/buttons.ts` — popup button helpers
  - `src/utils/format/` — formatting utilities
  - `src/fonts/` — bundled font assets
- Build output: `build/` (prod), `build-beta/` (beta)
- Config: `config/webpack.common.js`, `config/webpack.config.js`, `config/webpack.beta.js`
- ICS generation: uses `ics` npm package

# Known Issues
None.

# currentDate
- 2026-02-28

# Project: Curtin Calendar
- Path: /Users/n0xde/Files/Code Test Environment/curtincalendar
- Notes: Chrome MV3 extension. Scrapes Curtin eStudent timetable page and generates an ICS file. Supports Perth, Perth City, Dubai, Midland campuses. Room links use Google Maps + MazeMap. Published on Chrome Web Store.
