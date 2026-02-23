import { createEvents, EventAttributes } from 'ics';
import { command } from './types';
import { clickForward, dateInput, refreshButton } from './utils/buttons';
import { addEvents } from './utils/scrapEvents';

// Content script entry point: called once on every timetable page load.
// Reads the current scraping position from storage and either scrapes the
// current week and advances, or finalises the ICS file when all weeks are done.
async function readTable() {
  const data = await chrome.storage.local.get(['forward', 'events', 'totalWeeks', 'semester']);
  const events: EventAttributes[] = data.events;

  // No active download session — nothing to do
  if (events === undefined) return;

  const forward: number = data.forward ?? 0;
  const totalWeeks: number = data.totalWeeks ?? 13;
  const semester: 1 | 2 = (data.semester as 1 | 2) ?? 1;

  if (forward < totalWeeks) {
    // Scrape the current page BEFORE navigating so we don't race the DOM update.
    // The try-catch ensures clickForward always runs even if scraping fails for a week.
    try {
      await addEvents(events);
      await chrome.storage.local.set({ events: events, forward: forward + 1 });
    } catch {
      await chrome.storage.local.set({ forward: forward + 1 });
    }
    clickForward();
  } else if (forward === totalWeeks) {
    // All weeks scraped — clear session state, then generate and download the ICS file.
    chrome.storage.local.remove(['events', 'forward', 'semester', 'totalWeeks']);

    // If no events were collected the user has no enrolled classes for this semester.
    // Store a user-facing error for the popup to display instead of downloading an empty file.
    if (events.length === 0) {
      await chrome.storage.local.set({ lastError: 'No classes found. Make sure you\'re enrolled and that My Classes is showing your subjects.' });
      dateInput.value = '';
      refreshButton.click();
      return;
    }

    const { error, value } = createEvents(events);
    if (error) {
      console.error('[curtincalendar] createEvents error:', error);
    }
    // If value is missing (createEvents failed completely), show a user-facing error
    // rather than downloading a file containing the literal string "undefined".
    if (!value) {
      await chrome.storage.local.set({ lastError: 'Failed to generate the calendar file. Please try again.' });
      dateInput.value = '';
      refreshButton.click();
      return;
    }
    try {
      // Pass semester and year so the background worker can name the file correctly.
      (await chrome.runtime.sendMessage({
        command: command.download,
        value: value,
        semester: semester,
        year: new Date().getFullYear(),
      })) as any;
    } catch {
      // Popup was closed before download completed — nothing to send to
    }
    dateInput.value = '';
    refreshButton.click();
  }
}

readTable();
