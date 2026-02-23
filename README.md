# <img src="public/icons/icon48.png" width="45" align="left"> Curtin Calendar

## What it does

Curtin Calendar reads your timetable from the Curtin student portal and generates an ICS file you can import into Google Calendar, Apple Calendar, Outlook, or any other calendar app. Each class is created as an event with the correct time, duration, and location already filled in.

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

**Option 1 — Chrome Web Store** (recommended)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/gkofldgdkkcidpjikkoemccchhjhdlip).

**Option 2 — Manual install**

1. Download the zip from the [latest release](https://github.com/n0x1d3/curtin-calendar/releases/latest)
2. Extract the zip
3. Open `chrome://extensions` and enable **Developer mode**
4. Click **Load unpacked** and select the extracted folder

## Usage

1. Log in to the [Curtin student portal](https://curtin-web.t1cloud.com) (eStudent)
2. Navigate to **My Classes** under your timetable
3. Click the Curtin Calendar extension icon in your browser toolbar
4. Select your semester and click **Download** — an ICS file will be saved to your device
5. Import the ICS file into Google Calendar, Apple Calendar, Outlook, or any calendar app

## Contributing

1. Fork the repo and clone it locally
2. Run `npm i` to install dependencies
3. Run `npm run watch` to build in watch mode
4. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `build/` folder
5. Make your changes — the extension will rebuild automatically
6. Submit a pull request

## Credits

Originally created by [SetroZ](https://github.com/SetroZ). Redesigned, extended, and maintained by [n0x1d3](https://github.com/n0x1d3) — with a new interface, improved reliability, and additional features.

## License

[GPL-3.0](LICENSE)
