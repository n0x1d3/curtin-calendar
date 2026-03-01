import { EventAttributes } from 'ics';
import { readDate } from './buttons';
import scrapData from './scrapData';
import { scrapedDataType } from '../types';

// Escapes characters with special meaning in HTML to prevent injection into
// the htmlContent (X-ALT-DESC) field of the ICS file.
const htmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Builds the plain-text ICS description while preserving map links.
function buildDescription(event: scrapedDataType): string {
  if (!event.location) return event.title + ' ' + event.type;
  return (
    event.title +
    ' ' +
    event.type +
    '\n' +
    event.location.placeName[0] +
    ', Room ' +
    event.location.room +
    '\n\nGoogle Maps:\n ' +
    event.location.url +
    '\n\nCurtin Campus Map:\n ' +
    event.location.campusMapUrl
  );
}

// Builds HTML content for clients that support X-ALT-DESC.
function buildHtml(event: scrapedDataType): string {
  if (!event.location) return `<b>${htmlEscape(event.title)} ${htmlEscape(event.type)}</b>`;
  return `<b>${htmlEscape(event.title)} ${htmlEscape(event.type)}</b><br>${htmlEscape(event.location.placeName[0])}, Room ${htmlEscape(event.location.room)}<br><br>Google Maps:<br><a href="${htmlEscape(event.location.url)}">${htmlEscape(event.location.url)}</a><br><br>Curtin Campus Map:<br><a href="${htmlEscape(event.location.campusMapUrl)}">${htmlEscape(event.location.campusMapUrl)}</a>`;
}

// Builds one ICS EventAttributes object from a single scraped class entry.
function buildEvent(event: scrapedDataType, date: Date): EventAttributes {
  const ifLocation = event.location
    ? {
        location: `${event.location.placeName[0]}  Room: ${event.location.room}  Floor: ${event.location.floor}`,
        geo: {
          lat: event.location.coordinates.lat,
          lon: event.location.coordinates.lng,
        },
      }
    : { location: 'ONLINE' };

  return {
    startOutputType: 'local',
    title: event.title + ' ' + event.type,
    start: [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      event.time.start.hour,
      event.time.start.minutes,
    ],
    duration: { minutes: event.time.differenceInMinutes },
    ...ifLocation,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    description: buildDescription(event),
    htmlContent: buildHtml(event),
  };
}

// Scrapes the current timetable page and appends each class as an ICS
// EventAttributes entry to the provided events array.
export const addEvents = async (events: EventAttributes[]) => {
  const date = readDate();
  const result = await scrapData(date);

  Object.keys(result).forEach((key) => {
    const dayResult = result[key];
    if (dayResult.length === 0) return;

    dayResult.forEach((event) => {
      const resolvedDate = new Date(event.date);
      events.push(buildEvent(event, resolvedDate));
    });
  });
};
