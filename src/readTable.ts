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
    // All weeks scraped — clear session state, generate the ICS file, and download it.
    chrome.storage.local.remove(['events', 'forward', 'semester', 'totalWeeks']);
    const { value } = createEvents(events);
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
