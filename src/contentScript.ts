import { command } from './types';
import { setDate } from './utils/buttons';
import { getSemesterWeeks } from './utils/format/getDates';

// Content script: listens for the download command from the popup, initialises
// session state in Chrome storage, then navigates to the semester start date.
//
// The listener must be synchronous — Chrome ignores the Promise returned by an
// async listener and closes the message channel immediately. Async work runs in
// an IIFE instead.
chrome.runtime.onMessage.addListener(function (request) {
  switch (request.command) {
    case command.click: {
      const semester = request.semester as 1 | 2;
      const totalWeeks = getSemesterWeeks(new Date().getFullYear(), semester);
      (async () => {
        await chrome.storage.local.set({ events: [], forward: 0, semester, totalWeeks });
        setDate(semester);
      })();
      break;
    }
  }
});
