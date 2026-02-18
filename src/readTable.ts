'use strict';

import { createEvents, EventAttributes } from 'ics';
import { command } from './types';
import { ClickForward, dateInput, refreshButton } from './utils/buttons';
import { addEvents } from './utils/scrapEvents';

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
    // Try-catch ensures ClickForward always runs even if scraping fails for a week.
    try {
      await addEvents(events);
      await chrome.storage.local.set({ events: events, forward: forward + 1 });
    } catch {
      await chrome.storage.local.set({ forward: forward + 1 });
    }
    ClickForward();
  } else if (forward === totalWeeks) {
    chrome.storage.local.clear();
    const { value, error } = createEvents(events);
    try {
      (await chrome.runtime.sendMessage({
        command: command.download,
        value: value,
      })) as any;
    } catch {
      // Popup closed before download completed — nothing to send to
    }
    dateInput.value = '';
    refreshButton.click();
  }
}

readTable();
