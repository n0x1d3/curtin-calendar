import { EventAttributes } from 'ics';
import { readDate } from './buttons';
import scrapData from './scrapData';

// Scrapes the current timetable page and appends each class as an ICS
// EventAttributes entry to the provided events array.
export const addEvents = async (events: EventAttributes[]) => {
  const date = readDate();
  const result = await scrapData(date);

  Object.keys(result).forEach((key) => {
    const dayResult = result[key];
    if (dayResult.length === 0) return;

    dayResult.forEach((event) => {
      // Build the location/geo fields only if a physical room was found;
      // fall back to 'ONLINE' for classes without a room lookup result.
      const ifLocation = event.location
        ? {
            location: `${event.location.placeName[0]}  Room:${event.location.room}  floor:${event.location.floor}`,
            geo: {
              lat: event.location.coordinates.lat,
              lon: event.location.coordinates.lng,
            },
          }
        : { location: 'ONLINE' };

      const singleEvent: EventAttributes = {
        startOutputType: 'local',
        title: event.title + ' ' + event.type,
        start: [
          event.date.getFullYear(),
          event.date.getMonth() + 1,
          event.date.getDate(),
          event.time.start.hour,
          event.time.start.minutes,
        ],
        duration: { minutes: event.time.differenceInMinutes },
        ...ifLocation,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        description:
          event.title +
          ' ' +
          event.type +
          (event.location
            ? '\n' +
              event.location.placeName[0] +
              ', Room ' +
              event.location.room +
              '\n\nGoogle Maps:\n ' +
              event.location.url +
              '\n\nCurtin Campus Map:\n ' +
              event.location.campusMapUrl
            : ''),
        htmlContent: event.location
          ? `<b>${event.title} ${event.type}</b><br>${event.location.placeName[0]}, Room ${event.location.room}<br><br>Google Maps:<br><a href="${event.location.url}">${event.location.url}</a><br><br>Curtin Campus Map:<br><a href="${event.location.campusMapUrl}">${event.location.campusMapUrl}</a>`
          : `<b>${event.title} ${event.type}</b>`,
      };

      events.push(singleEvent);
    });
  });
};
