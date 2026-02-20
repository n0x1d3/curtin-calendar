import { getDates } from './format/getDates';

// --- Timetable DOM element references ---
// These IDs are stable ASP.NET control IDs on the Curtin eStudent timetable page.

export const dateInput = document.getElementById(
  'ctl00_Content_ctlFilter_TxtStartDt'
) as HTMLInputElement;

export const forwardButton = document.getElementById(
  'ctl00_Content_ctlActionBarBottom_WkNext'
) as HTMLButtonElement;

export const refreshButton = document.getElementById(
  'ctl00_Content_ctlFilter_BtnSearch'
) as HTMLButtonElement;

// Sets the timetable date input to the start of the given semester and submits
// the filter form to load that week's timetable.
export function setDate(sem: number) {
  const dates = getDates(new Date().getFullYear());
  const start = dates[sem as 1 | 2].start;
  dateInput.value = `${start.day}-${start.month}-${new Date().getFullYear()}`;
  refreshButton.click();
}

// Reads and parses the current date from the timetable's date input field.
// Tries DD-MM-YYYY (written by setDate), then DD/MM/YYYY (ASP.NET postback format),
// then falls back to native Date parsing for any other format.
export function readDate() {
  const value = dateInput.value;

  const dashParts = value.split('-');
  if (dashParts.length === 3) {
    const day = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10);
    const year = parseInt(dashParts[2], 10);
    // Year must be 4 digits to rule out YYYY-MM-DD being misread as DD-MM-YYYY
    if (year > 100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }

  const slashParts = value.split('/');
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10);
    const year = parseInt(slashParts[2], 10);
    if (year > 100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }

  // Fall back to native parsing (handles ISO YYYY-MM-DD, "Feb 16 2026", etc.)
  const fallback = new Date(value);
  // Warn loudly if the date couldn't be parsed — an Invalid Date will silently
  // corrupt every event scraped from this week's timetable page.
  if (isNaN(fallback.getTime())) {
    console.error(`[curtincalendar] readDate: could not parse date input value "${value}"`);
  }
  return fallback;
}

// Clicks the "next week" navigation button on the timetable page.
export function ClickForward() {
  forwardButton.click();
}
