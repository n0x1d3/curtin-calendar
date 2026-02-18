'use strict';

import { createEvents, EventAttributes } from 'ics';
import { command } from './types';
import { ClickForward, dateInput, refreshButton } from './utils/buttons';
import { addEvents } from './utils/scrapEvents';

async function checkPopupActive() {
  const res = await chrome.runtime.sendMessage({
    command: command.forward,
  });
  if (!res) {
    await chrome.storage.local.clear();
  }
}
async function readTable() {
  await checkPopupActive();
  const data = await chrome.storage.local.get(['forward', 'events', 'totalWeeks']);
  const events: EventAttributes[] = data.events;
  const forward: number = data.forward;
  // Fall back to 13 if totalWeeks wasn't stored (e.g. first run with old storage)
  const totalWeeks: number = data.totalWeeks ?? 13;

  if (forward < totalWeeks) {
    // Scrape the current page BEFORE navigating so we don't race the DOM update
    await addEvents(events);
    await chrome.storage.local.set({ events: events, forward: forward + 1 });
    ClickForward();
  } else if (forward === totalWeeks) {
    chrome.storage.local.clear();
    const { value, error } = createEvents(events);
    (await chrome.runtime.sendMessage({
      command: command.download,
      value: value,
    })) as any;
    dateInput.value = '';
    refreshButton.click();
  }
}

readTable();
