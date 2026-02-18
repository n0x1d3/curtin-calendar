import { command } from './types';

// Service worker: receives the completed ICS data from readTable via a message
// and triggers a file download via the Chrome downloads API.
chrome.runtime.onMessage.addListener((request) => {
  if (request.command === command.download) {
    const dataUrl =
      'data:text/calendar;charset=utf-8,' +
      encodeURIComponent(request.value as string);
    chrome.downloads.download({ url: dataUrl, filename: 'CurtinCalendar.ics' });
  }
});
