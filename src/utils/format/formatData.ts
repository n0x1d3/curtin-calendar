import { classTimeType, locationResponseType, timeStamp } from '../../types';

// --- Time parsing ---

// Converts a single time token like "8:00am" or "2:30pm" to a 24-hour timestamp.
const parseTo24h = (time: string): timeStamp => {
  let parts: string[];
  let offset = 0;
  if (time.match('am')) {
    parts = time.split('am')[0].split(':');
  } else {
    // 12 pm stays as-is; all other pm hours get +12
    if (time[0] === '1' && time[1] === '2') {
      parts = time.split('pm')[0].split(':');
    } else {
      parts = time.split('pm')[0].split(':');
      offset = 12;
    }
  }
  return { hour: Number(parts[0]) + offset, minutes: Number(parts[1]) };
};

// Splits a time range string like ", 8:00 am-10:00 am" into start and end tokens.
const splitToStartEnd = (timeString: string) => {
  const res = timeString.replace(' ', '').replace(',', '').split('-');
  return { start: res[0], end: res[1] };
};

// Converts a time range string ", 8:00 am-10:00 am" into a classTimeType with
// start, end, and duration in minutes.
export function convertTime(timeString: string): classTimeType {
  const time = splitToStartEnd(timeString);
  const start = parseTo24h(time.start);
  const end = parseTo24h(time.end);
  const differenceInMinutes =
    (end.hour - start.hour) * 60 + Math.abs(start.minutes - end.minutes);
  return { start, end, differenceInMinutes };
}

// --- Location lookup ---

// Splits a string at a given index, e.g. splitAt(3, "212107") → ["212", "107"].
const splitAt = (index: number, str: string) => [
  str.slice(0, index),
  str.slice(index),
];

// Builds a MazeMap search URL for a given room query string.
// campusid=296 is Curtin Perth; the lat/lng are the campus centre coordinates
// used to boost nearby results.
const getMazeMapURL = (q: string) =>
  `https://search.mazemap.com/search/equery/?q=${q}&rows=1&start=0&withpois=true&withbuilding=true&withtype=true&withcampus=true&campusid=296&lng=115.89582570734012&lat=-32.00742307052456&boostbydistance=true`;

// Builds a Google Maps search URL from WGS84 coordinates.
const googleMapsURL = ({ lat, lng }: { lat: number; lng: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;

// Looks up the physical location of a room string (e.g. "212 107") via the
// MazeMap API. Returns location metadata on success, or false on error/timeout.
export async function getLocation(location: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    // Room format is "BBB RRR" (building + room); convert to "BBB.RRR" for MazeMap
    const parts = splitAt(3, location.replace(' ', ''));
    const formatted = parts[0] + '.' + parts[1];

    const res = await fetch(getMazeMapURL(formatted), {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const datares = (await res.json()) as locationResponseType;
    const data = datares.result[0];

    // GeoJSON coordinates are [longitude, latitude]
    const lat = data.geometry.coordinates[1];
    const lng = data.geometry.coordinates[0];

    return {
      floor: data.zValue,
      coordinates: { lat, lng },
      placeName: data.dispBldNames,
      room: parts[1],
      url: googleMapsURL({ lat, lng }),
    };
  } catch {
    clearTimeout(timeout);
    return false;
  }
}
