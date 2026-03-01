# CLAUDE.md

# Curtin Calendar

Inherits all standards from `/Users/n0xde/Files/CLAUDE.md`. Only overrides and project-specific additions below.

## Commands
- Build: `bun run build`
- Watch: `bun run watch`
- Pack: `bun run pack`
- Format: `bun run format`
- Beta build: `bun run build:beta`
- Test: `bun run test`
- Coverage: `bun run coverage`
- Type check: `bunx tsc --noEmit`

## Stack
- TypeScript + Webpack 5 + Chrome MV3 (browser extension)
- Test runner: Vitest 4.0.18 with @vitest/coverage-v8

## Project-Specific Rules
- This is a Chrome MV3 extension — background logic runs in a service worker (`src/background.ts`), not a persistent page
- Content script (`src/contentScript.ts`) is injected into the Curtin eStudent timetable page
- ICS generation uses the `ics` package — do not replace with native alternatives without checking compatibility
- Room location links use Google Maps + MazeMap (Curtin campus map) — preserve both when editing event descriptions
- Beta and production builds are separate webpack configs; keep them in sync when adding new entry points or assets
- Semester date data lives in `src/utils/format/getDates.ts` (`knownYearOverrides`) — update this when adding support for new years (there is no separate `curtinDates/` folder)
