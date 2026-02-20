import { createEvents, EventAttributes } from 'ics';
import { command } from './types';
import { ClickForward, dateInput, refreshButton } from './utils/buttons';
import { addEvents } from './utils/scrapEvents';

// Content script entry point: called once on every timetable page load.
// Reads the current scraping position from storage and either scrapes the
// current week and advances, or finalises the ICS file when all weeks are done.
async function readTable() {
  const data = await chrome.storage.local.get(['forward', 'events', 'totalWeeks']);
  const events: EventAttributes[] = data.events;

  // No active download session — nothing to do
  if (events === undefined) return;

  const forward: number = data.forward ?? 0;
  // Fall back to 13 if totalWeeks wasn't stored (e.g. first run with old storage)
  const totalWeeks: number = data.totalWeeks ?? 13;

  if (forward < totalWeeks) {
    // Scrape the current page BEFORE navigating so we don't race the DOM update.
    // The try-catch ensures ClickForward always runs even if scraping fails for a week.
    try {
      await addEvents(events);
      await chrome.storage.local.set({ events: events, forward: forward + 1 });
    } catch {
      await chrome.storage.local.set({ forward: forward + 1 });
    }
    ClickForward();
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
    // Log the error but still attempt the send — value may be partially populated.
    // Without this check a broken ICS would be downloaded with no indication of why.
    if (error) {
      console.error('[curtincalendar] createEvents error:', error);
    }
    try {
      (await chrome.runtime.sendMessage({
        command: command.download,
        value: value,
      })) as any;
    } catch {
      // Popup was closed before download completed — nothing to send to
    }
    dateInput.value = '';
    refreshButton.click();
  }
}

readTable();
