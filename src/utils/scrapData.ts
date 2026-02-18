// ctl00_Content_ctlTimetableMain_TueDayCol_Body_2_BodyContentPanel seminar(6) 10am-120am 2022 122
// id="ctl00_Content_ctlTimetableMain_TueDayCol_Body_2_HeaderPanel" name

// <!-- MetaData -->
// <div
//   id="ctl00_Content_ctlTimetableMain_TueDayCol_Body_3_BodyContentPanel"
//   class="cssTtableBodyContentPanel"
// >
//   <br />
//   <span class="cssTtableClsSlotWhat">Workshop (15)</span>
//   <span class="cssTtableClsSlotWhen">, 8:00 am-10:00 am</span>
//   <span class="cssTtableClsSlotWhere">212 107</span>
// </div>

// <!-- Title -->
// <div
//   id="ctl00_Content_ctlTimetableMain_TueDayCol_Body_3_HeaderPanel"
//   class="cssTtableHeaderPanel"
// >
//   NPSC1003
// </div>

import { scrappedDataType } from '../types';
import { convertTime, getLocation } from './format/formatData';

/**Returns HTMl element id to be read. Check dataExample.html for an example*/
const generateElementId = (day: string, count: number) => ({
  metaDataId: `ctl00_Content_ctlTimetableMain_${day}DayCol_Body_${count}_BodyContentPanel`,
  nameId: `ctl00_Content_ctlTimetableMain_${day}DayCol_Body_${count}_HeaderPanel`,
});

// days in a format that matches the website element ids
const webDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const metDataClassNames = {
  type: 'cssTtableClsSlotWhat',
  location: 'cssTtableClsSlotWhere',
  time: 'cssTtableClsSlotWhen',
};

interface metaDataType {
  type: string;
  location: string;
  time: Date | false;
  title: string;
}
function addDays(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
/** Max number of slot IDs to probe per day — handles sparse/non-sequential IDs */
const MAX_SLOTS = 20;

/**  Reads data from webpage returns scrappedData */
export default async function scrapData(date: Date) {
  const results: { [key: string]: scrappedDataType[] } = {};
  let dayIndex = 0;
  for (const day of webDays) {
    let count = 0;
    while (count < MAX_SLOTS) {
      const elementId = generateElementId(day, count);
      const metDataElement = document.getElementById(elementId.metaDataId);
      const nameIdElement = document.getElementById(elementId.nameId);
      count++;
      // Skip missing indices rather than stopping — ID gaps are common in ASP.NET timetables
      if (metDataElement == null || nameIdElement == null) {
        continue;
      }
      if (day in results == false) {
        results[day] = [];
      }

      const data: any = {
        type: '',
        location: '',
        time: '',
        title: '',
        date: addDays(date, dayIndex),
      };
      for (const [key, value] of Object.entries(metDataClassNames)) {
        const result = metDataElement.querySelector('.' + value)!
          .textContent as string;
        data[key] =
          key == 'time'
            ? convertTime(result)
            : key == 'location'
            ? await getLocation(result)
            : result;
      }
      // Preserve spaces between words (e.g. "COMP1000 Lecture", not "COMP1000Lecture")
      data['title'] = (nameIdElement.textContent as string)
        .replace(/\s+/g, ' ')
        .trim();
      results[day].push(data);
    }
    dayIndex++;
  }
  return results;
}
