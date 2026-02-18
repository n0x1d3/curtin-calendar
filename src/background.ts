'use strict';

import { command } from './types';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === command.download) {
    const dataUrl =
      'data:text/calendar;charset=utf-8,' +
      encodeURIComponent(request.value as string);
    chrome.downloads.download({ url: dataUrl, filename: 'CurtinCalendar.ics' });
  }
});
