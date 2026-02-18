'use strict';

import { command } from './types';
import { setDate } from './utils/buttons';
import { getSemesterWeeks } from './utils/format/getDates';

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  switch (request.command) {
    case command.click: {
      const semester = request.semester as 1 | 2;
      const totalWeeks = getSemesterWeeks(new Date().getFullYear(), semester);
      chrome.storage.local.set({ events: [], forward: 0, semester, totalWeeks });
      setDate(semester);
      break;
    }
  }

  return true;
});
