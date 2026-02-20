import { command } from './types';

// Service worker: receives the completed ICS data from readTable via a message
// and triggers a file download via the Chrome downloads API.
chrome.runtime.onMessage.addListener((request) => {
  if (request.command === command.download) {
    const dataUrl =
      'data:text/calendar;charset=utf-8,' +
      encodeURIComponent(request.value as string);
    // e.g. "Curtin Timetable Semester 1 2026.ics"
    const filename = `Curtin Timetable Semester ${request.semester} ${request.year}.ics`;
    chrome.downloads.download({ url: dataUrl, filename });
  }
});
