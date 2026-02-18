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

## Contributing

1. Fork the repo and clone it locally
2. Run `npm i` to install dependencies
3. Run `npm run watch` to build in watch mode
4. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `build/` folder
5. Make your changes — the extension will rebuild automatically
6. Submit a pull request

## Credits

Based on the original [curtincalendar](https://github.com/SetroZ/curtincalendar) by [SetroZ](https://github.com/SetroZ). This fork has been significantly extended with room lookup, map links, HTML descriptions, and bug fixes for 2026+.

## License

[GPL-3.0](LICENSE)
