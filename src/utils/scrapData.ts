// DOM structure scraped from the Curtin eStudent timetable page.
// Each class slot consists of two sibling elements per day column:
//
// Metadata panel — contains type, time, and room:
//   <div id="ctl00_Content_ctlTimetableMain_TueDayCol_Body_3_BodyContentPanel">
//     <span class="cssTtableClsSlotWhat">Workshop (15)</span>
//     <span class="cssTtableClsSlotWhen">, 8:00 am-10:00 am</span>
//     <span class="cssTtableClsSlotWhere">212 107</span>
//   </div>
//
// Header panel — contains the unit code:
//   <div id="ctl00_Content_ctlTimetableMain_TueDayCol_Body_3_HeaderPanel">
//     NPSC1003
//   </div>

import { scrapedDataType, LocationData, webDays } from '../types';
import { convertTime, getLocation } from './format/formatData';

// Builds the element IDs for a given day column and slot index.
const generateElementId = (day: string, count: number) => ({
  metaDataId: `ctl00_Content_ctlTimetableMain_${day}DayCol_Body_${count}_BodyContentPanel`,
  nameId: `ctl00_Content_ctlTimetableMain_${day}DayCol_Body_${count}_HeaderPanel`,
});

// CSS class names for the three metadata spans within each slot element.
const metDataClassNames = {
  type: 'cssTtableClsSlotWhat',
  location: 'cssTtableClsSlotWhere',
  time: 'cssTtableClsSlotWhen',
};

// Returns a new Date offset by the given number of days.
function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// How many slot indices to probe per day column. IDs in ASP.NET timetables are
// sparse and non-sequential, so we scan a fixed range rather than stopping at
// the first gap.
const MAX_SLOTS = 20;

// Scrapes all class slots from the current timetable page for the given week
// start date. Returns an object keyed by day name (e.g. 'Mon') with an array
// of scraped class data for each day.
export default async function scrapData(date: Date) {
  const results: { [key: string]: scrapedDataType[] } = {};
  let dayIndex = 0;

  for (const day of webDays) {
    let count = 0;
    while (count < MAX_SLOTS) {
      const elementId = generateElementId(day, count);
      const metDataElement = document.getElementById(elementId.metaDataId);
      const nameIdElement = document.getElementById(elementId.nameId);
      count++;

      // Skip missing indices — ID gaps are common in ASP.NET timetables
      if (metDataElement === null || nameIdElement === null) continue;

      // Skip slots missing any expected child span to avoid incomplete data
      const allChildrenPresent = Object.values(metDataClassNames).every(
        (cls) => metDataElement.querySelector('.' + cls) !== null
      );
      if (!allChildrenPresent) continue;

      if (!(day in results)) {
        results[day] = [];
      }

      let type = '';
      let location: LocationData | false = false;
      let time = convertTime('');

      for (const [key, value] of Object.entries(metDataClassNames)) {
        const text = metDataElement.querySelector('.' + value)?.textContent ?? '';
        if (key === 'time') time = convertTime(text);
        else if (key === 'location') location = await getLocation(text);
        else if (key === 'type') type = text;
      }

      // Collapse whitespace in the unit code (e.g. "COMP1000 Lecture", not "COMP1000Lecture")
      const title = (nameIdElement.textContent as string)
        .replace(/\s+/g, ' ')
        .trim();

      results[day].push({ type, location, time, title, date: addDays(date, dayIndex) });
    }
    dayIndex++;
  }

  return results;
}
