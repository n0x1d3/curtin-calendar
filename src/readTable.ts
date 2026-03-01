import { createEvents, EventAttributes } from 'ics';
import { command } from './types';
import { clickForward, dateInput, refreshButton } from './utils/buttons';
import { addEvents } from './utils/scrapEvents';

// Scrapes the current week, stores progress, and always advances to the next week.
async function scrapeWeek(events: EventAttributes[], forward: number): Promise<void> {
  try {
    await addEvents(events);
    await chrome.storage.local.set({ events: events, forward: forward + 1 });
  } catch (error) {
    console.error('[curtincalendar] Failed to scrape week', forward, '- skipping:', error);
    await chrome.storage.local.set({ forward: forward + 1 });
  }
  clickForward();
}

// Finalises scraping by cleaning state, generating ICS, and triggering the download.
async function finalizeDownload(events: EventAttributes[], semester: 1 | 2): Promise<void> {
  chrome.storage.local.remove(['events', 'forward', 'semester', 'totalWeeks']);

  if (events.length === 0) {
    await chrome.storage.local.set({
      lastError: 'No classes found. Make sure you\'re enrolled and that My Classes is showing your subjects.',
    });
    dateInput.value = '';
    refreshButton.click();
    return;
  }

  const { error, value } = createEvents(events);
  if (error) {
    console.error('[curtincalendar] createEvents error:', error);
  }
  if (!value) {
    await chrome.storage.local.set({ lastError: 'Failed to generate the calendar file. Please try again.' });
    dateInput.value = '';
    refreshButton.click();
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      command: command.download,
      value: value,
      semester: semester,
      year: new Date().getFullYear(),
    });
  } catch (err) {
    // Popup was closed before download completed — message channel is gone.
    // Log for debugging but this is an expected no-op.
    console.error('[curtincalendar] sendMessage (download) failed — popup likely closed:', err);
  }

  dateInput.value = '';
  refreshButton.click();
}

// Content script entry point: called once on every timetable page load.
// Reads the current scraping position from storage and either scrapes the
// current week and advances, or finalises the ICS file when all weeks are done.
async function readTable() {
  const data = await chrome.storage.local.get(['forward', 'events', 'totalWeeks', 'semester']);
  const events: EventAttributes[] = data.events;

  if (events === undefined) return;

  const forward: number = data.forward ?? 0;
  const totalWeeks: number = data.totalWeeks ?? 13;
  const semester: 1 | 2 = (data.semester as 1 | 2) ?? 1;

  if (forward < totalWeeks) {
    await scrapeWeek(events, forward);
  } else if (forward === totalWeeks) {
    await finalizeDownload(events, semester);
  }
}

readTable();
