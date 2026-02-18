# <img src="public/icons/icon48.png" width="45" align="left"> Curtin Calendar

## What it does

Curtin Calendar reads your timetable from the Curtin student portal and generates an ICS file you can import into Google Calendar, Apple Calendar, Outlook, or any other calendar app. Each class is created as an event with the correct time, duration, and location already filled in.

## Features

- One-click export of your full weekly timetable to ICS
- Room details in each event (building name, room number, floor)
- Google Maps link for each physical class location
- Curtin campus map link (MazeMap) that opens directly to the correct room and floor
- Clickable hyperlinks in calendar apps that support HTML descriptions (Outlook, Apple Calendar)
- Online classes handled gracefully with no broken location data
- Accurate semester date calculations for 2026 and beyond

## Usage

1. Log in to the [Curtin student portal](https://curtin-web.t1cloud.com) (eStudent)
2. Navigate to **My Classes** under your timetable
3. Click the Curtin Calendar extension icon in your browser toolbar
4. Click **Download** — an ICS file will be saved to your device
5. Import the ICS file into Google Calendar, Apple Calendar, Outlook, or any calendar app

## Install

**Option 1 — Chrome Web Store** (coming soon)

**Option 2 — Manual install**

1. Download the zip from the [latest release](https://github.com/n0x1d3/curtin-calendar/releases/latest)
2. Extract the zip
3. Open `chrome://extensions` and enable **Developer mode**
4. Click **Load unpacked** and select the extracted folder

## Contribution

### Run Locally

- `git clone https://github.com/n0x1d3/curtin-calendar.git`
- `cd curtin-calendar`
- `npm i`
- `npm run watch`

### Then follow these instructions to see your extension:

1. Open **chrome://extensions**
2. Check the **Developer mode** checkbox
3. Click on the **Load unpacked extension** button
4. Select the folder **build/**

Fork the repo and submit a pull request!

## Credits

Based on the original [curtincalendar](https://github.com/SetroZ/curtincalendar) by [SetroZ](https://github.com/SetroZ). This fork has been significantly extended with room lookup, map links, HTML descriptions, and bug fixes for 2026+.

## License

[GPL-3.0](LICENSE)
