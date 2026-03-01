# <img src="public/icons/icon48.png" width="45" align="left"> Curtin Calendar

A Chrome extension that exports your Curtin timetable to ICS in one click.

**Install:** [Chrome Web Store](https://chromewebstore.google.com/detail/gkofldgdkkcidpjikkoemccchhjhdlip) (recommended) or [load from source](#developer-setup).

**Version:** 0.4.2 | **License:** GPL-3.0

## Features

- One-click export of your full semester timetable to ICS
- Room details in each event (building name, room number, floor)
- Google Maps link for each physical class location
- Curtin campus map link (MazeMap) that opens directly to the correct room and floor
- Clickable hyperlinks in calendar apps that support HTML descriptions (Outlook, Apple Calendar)
- Saturday classes supported
- All Curtin campuses supported (Perth, Perth City, Dubai, Midland)
- Online classes handled gracefully with no broken location data
- Live progress bar showing which week is being scraped
- Cancel button to stop or recover a stuck session
- Smart error messages in plain English
- Dark mode with saved preference
- Accurate semester date calculations for 2026–2028

## Install

### End Users

**Option 1 — Chrome Web Store** (recommended)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/gkofldgdkkcidpjikkoemccchhjhdlip).

**Option 2 — Manual install**

1. Download the zip from the [latest release](https://github.com/n0x1d3/curtin-calendar/releases/latest)
2. Extract the zip
3. Open `chrome://extensions` and enable **Developer mode**
4. Click **Load unpacked** and select the extracted folder

### Developer Setup

**Prerequisites:**
- Node 22.x (LTS)
- Bun 1.x ([install](https://bun.sh))

**Setup:**

```bash
git clone https://github.com/n0x1d3/curtin-calendar.git
cd curtin-calendar
bun install
bun run build
```

**Load in Chrome:**
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `build/` folder
4. Click the extension icon in your toolbar

**Development mode** (with auto-rebuild):

```bash
bun run watch
```

Rebuilds after every file change. Reload the extension in Chrome to see updates.

## Usage

1. Log in to the [Curtin student portal](https://curtin-web.t1cloud.com) (eStudent)
2. Navigate to **My Classes** under your timetable
3. Click the Curtin Calendar extension icon in your browser toolbar
4. Select your semester and click **Download** — an ICS file will be saved to your device
5. Import the ICS file into Google Calendar, Apple Calendar, Outlook, or any calendar app

## Development

### Commands

```bash
bun install          # Install dependencies
bun run build        # Production build → build/
bun run watch        # Dev mode with file watching
bun run test         # Run test suite (vitest, 14 tests)
bun run test:watch   # Watch mode for tests
bun run coverage     # Test coverage report
bun run format       # Prettier on {config,public,src}/**
bun run pack         # Zip build/ for distribution
```

### Project Structure

```
curtin-calendar/
├── build/                          # Compiled output (webpack)
├── config/
│   ├── webpack.config.js           # Production webpack config
│   └── webpack.beta.js             # Beta build config
├── public/
│   ├── manifest.json               # Chrome MV3 manifest
│   ├── popup.html                  # Extension popup UI
│   └── icons/                      # Extension icons
├── src/
│   ├── popup.ts                    # Popup UI orchestrator (polling, progress, theme)
│   ├── background.ts               # MV3 service worker (chrome.downloads)
│   ├── contentScript.ts            # Injected into eStudent — initialises scrape session
│   ├── readTable.ts                # Runs on each timetable page — scrapes or finalises
│   ├── types.ts                    # Shared interfaces and enums
│   │
│   └── utils/
│       ├── buttons.ts              # DOM refs and date helpers (setDate, readDate, clickForward)
│       ├── scrapData.ts            # Reads class slots from the timetable DOM
│       ├── scrapEvents.ts          # Converts scraped slots into ICS EventAttributes
│       ├── popupErrors.ts          # getSmartErrorMessage, onError
│       │
│       └── format/
│           ├── formatData.ts       # Time parsing (convertTime) + MazeMap lookup (getLocation)
│           ├── formatData.test.ts  # Tests for time parsing
│           ├── getDates.ts         # Semester date arithmetic + knownYearOverrides
│           └── getDates.test.ts    # Tests for semester dates
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Architecture Overview

**Data Model:**

The core `scrapedDataType` interface (in `src/types.ts`) represents a single scraped class:

```typescript
interface scrapedDataType {
  type: string;          // E.g. "Lecture", "Workshop"
  location: LocationData | false;  // MazeMap result, or false for online/unknown
  time: classTimeType;   // { start, end, differenceInMinutes }
  title: string;         // Unit code, e.g. "COMP1005"
  date: Date;            // Absolute date of this class occurrence
}
```

**Data Flow:**

```
User clicks Download in popup:
  popup.ts → sends `click` command → contentScript.ts
  contentScript.ts → initialises chrome.storage (events:[], forward:0, semester, totalWeeks)
                   → calls setDate() to navigate to semester week 1

For each timetable page load (readTable.ts):
  if forward < totalWeeks:
    scrapeWeek() → scrapData() (DOM read) → scrapEvents() (ICS build) → clickForward()
  if forward === totalWeeks:
    finalizeDownload() → createEvents() (ics package)
                       → sends `download` command → background.ts
                       → background.ts calls chrome.downloads.download()

popup.ts polls chrome.storage every ~500ms → updates progress bar → shows success or error
```

**Key Modules:**

| Module | Purpose | Type |
|--------|---------|------|
| `src/popup.ts` | Popup UI — polling, progress bar, cancel, theme | DOM + Chrome API |
| `src/background.ts` | Service worker — triggers file download | Chrome API only |
| `src/contentScript.ts` | Initialises scrape state, navigates to week 1 | DOM + Chrome storage |
| `src/readTable.ts` | Scrapes each week and finalises ICS | DOM + Chrome storage |
| `src/utils/scrapData.ts` | Reads class slots from timetable DOM | DOM |
| `src/utils/scrapEvents.ts` | Builds `EventAttributes` objects for `ics` | Pure TS |
| `src/utils/format/formatData.ts` | Time parsing + MazeMap API lookup | Network + Pure TS |
| `src/utils/format/getDates.ts` | Semester start dates and week counts | Pure TS |

**Dependency Rules:**

- `utils/format/` → **zero Chrome API**; pure TypeScript, fully testable
- `utils/scrapData.ts` + `utils/scrapEvents.ts` → DOM only (content script context)
- `utils/popupErrors.ts` → DOM only (popup context)
- `background.ts` → Chrome API only, no DOM
- `contentScript.ts` + `readTable.ts` → DOM + Chrome storage
- `popup.ts` → DOM + Chrome tabs/storage/runtime

### Semester Dates

Semester start dates live in `src/utils/format/getDates.ts` inside `knownYearOverrides`. To add support for a new year, add an entry there — no other files need changing.

### Testing

```bash
bun run test          # Run all 14 tests
bun run test:watch    # Watch mode
bun run coverage      # Coverage report
```

Tests are in `src/utils/format/`:

- `formatData.test.ts` – time parsing (`convertTime`, `parseTo24h`)
- `getDates.test.ts` – semester date arithmetic and `knownYearOverrides`

**Coverage:** ~80% on pure utility functions. Chrome API and DOM code is not unit tested.

## Contributing

### Development Workflow

1. **Explore** – Read relevant source files and understand the context
2. **Plan** – For multi-file changes, outline the approach in a comment or issue
3. **Code** – Follow the code style below
4. **Test** – Write tests alongside features (~80% coverage target on pure functions)
5. **Format** – Run `bun run format` before committing
6. **Commit** – Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add dark mode`, `fix: handle missing room data`)
7. **PR** – One logical change per PR; reference a GitHub issue if one exists

### Code Style

- **Prettier** – Auto-format with `bun run format`
- **TypeScript** – Strict mode; all types explicit
- **Comments** – Explain *why*, not just *what*
- **Functions** – Max ~40 lines; prefer small, focused functions
- **Files** – Max ~300 lines; split if larger

### Branching

- Feature: `feature/short-description`
- Fix: `fix/short-description`
- Chore: `chore/short-description`

Never commit directly to `main`.

### Before You Submit

```bash
bun run format
bun run test
bun run build
```

All tests must pass and the build must succeed.

## FAQ

**Q: Is my data shared with anyone?**
A: No. The extension reads your timetable page directly in the browser. No data is sent to any server — the only external call is to the MazeMap API to resolve room coordinates from a room code.

**Q: Why does it take a while to export?**
A: The extension navigates the timetable week-by-week, one page at a time, to read each class. This is necessary because the eStudent timetable only shows one week at a time.

**Q: What if a class has no location?**
A: Online classes are detected automatically — the event is created with no location data and no broken links.

**Q: My semester isn't in the dropdown / the dates are wrong.**
A: Semester dates are hardcoded in `src/utils/format/getDates.ts` (`knownYearOverrides`). Open an issue or submit a PR to add the correct dates for your year.

**Q: What if I find a bug?**
A: Open a [GitHub issue](https://github.com/n0x1d3/curtin-calendar/issues) with your Chrome version, extension version (shown in the popup footer), and steps to reproduce.

## Credits

Originally created by [SetroZ](https://github.com/SetroZ). Redesigned, extended, and maintained by [n0x1d3](https://github.com/n0x1d3) — with a new interface, improved reliability, and additional features.

## Links

- **GitHub:** [n0x1d3/curtin-calendar](https://github.com/n0x1d3/curtin-calendar)
- **Issues:** [Report bugs or request features](https://github.com/n0x1d3/curtin-calendar/issues)
- **Chrome Web Store:** [Install extension](https://chromewebstore.google.com/detail/gkofldgdkkcidpjikkoemccchhjhdlip)

## License

[GPL-3.0](LICENSE)
