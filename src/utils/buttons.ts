import { EventAttributes } from 'ics';
import { getDates } from './format/getDates';

export const dateInput = document.getElementById(
  'ctl00_Content_ctlFilter_TxtStartDt'
) as HTMLInputElement;

export const forwardButton = document.getElementById(
  'ctl00_Content_ctlActionBarBottom_WkNext'
) as HTMLButtonElement;

export const refreshButton = document.getElementById(
  'ctl00_Content_ctlFilter_BtnSearch'
) as HTMLButtonElement;

export function setDate(sem: number) {
  const dates = getDates(new Date().getFullYear());
  const events: EventAttributes[] = [];
  const start = dates[sem as 1 | 2].start;
  dateInput.value = `${start.day}-${start.month}-${new Date().getFullYear()}`;
  refreshButton.click();
}

export function readDate() {
  const value = dateInput.value;
  // Try DD-MM-YYYY (written by setDate with dashes)
  const dashParts = value.split('-');
  if (dashParts.length === 3) {
    const day = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10);
    const year = parseInt(dashParts[2], 10);
    // Sanity-check: year must be 4 digits to rule out YYYY-MM-DD being misread
    if (year > 100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }
  // Try DD/MM/YYYY (common ASP.NET format after postback)
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
  return new Date(value);
}
export function ClickForward() {
  forwardButton.click();
}
