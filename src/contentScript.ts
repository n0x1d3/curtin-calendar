import { command } from './types';
import { setDate } from './utils/buttons';
import { getSemesterWeeks } from './utils/format/getDates';

// Content script: listens for the download command sent from the popup,
// stores the initial session state in local storage, then sets the timetable
// date input to the correct semester start to kick off the scraping loop.
chrome.runtime.onMessage.addListener(async function (request) {
  switch (request.command) {
    case command.click: {
      const semester = request.semester as 1 | 2;
      const totalWeeks = getSemesterWeeks(new Date().getFullYear(), semester);
      await chrome.storage.local.set({ events: [], forward: 0, semester, totalWeeks });
      setDate(semester);
      break;
    }
  }

  // Return true to keep the message channel open for the async response
  return true;
});
