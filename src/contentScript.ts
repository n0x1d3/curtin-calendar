import { command } from './types';
import { setDate } from './utils/buttons';
import { getSemesterWeeks } from './utils/format/getDates';

// Content script: listens for the download command sent from the popup,
// stores the initial session state in local storage, then sets the timetable
// date input to the correct semester start to kick off the scraping loop.
//
// NOTE: Chrome's onMessage API does not support async listeners — an async
// function returns a Promise, which Chrome does not treat as a synchronous
// `return true`, so the message channel would close before the async work
// finishes. The listener is kept synchronous; async work runs in an IIFE.
chrome.runtime.onMessage.addListener(function (request) {
  switch (request.command) {
    case command.click: {
      const semester = request.semester as 1 | 2;
      const totalWeeks = getSemesterWeeks(new Date().getFullYear(), semester);
      // Run storage write and date set in a non-blocking async IIFE
      (async () => {
        await chrome.storage.local.set({ events: [], forward: 0, semester, totalWeeks });
        setDate(semester);
      })();
      break;
    }
  }
});
