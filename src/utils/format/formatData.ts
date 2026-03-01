import { classTimeType, locationResponseType, timeStamp } from '../../types';

// --- Time parsing ---

// Converts a single time token like "8:00am" or "2:30pm" to a 24-hour timestamp.
const parseTo24h = (time: string): timeStamp => {
  let offset = 0;
  let parts: string[];
  if (time.includes('am')) {
    parts = time.split('am')[0].split(':');
    // 12:xxam is midnight (hour 0), not hour 12
    if (Number(parts[0]) === 12) offset = -12;
  } else {
    parts = time.split('pm')[0].split(':');
    // 12:xxpm stays as-is; all other pm hours need +12
    if (!(time[0] === '1' && time[1] === '2')) offset = 12;
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
  const differenceInMinutes = (end.hour - start.hour) * 60 + (end.minutes - start.minutes);
  return { start, end, differenceInMinutes };
}

// --- Location lookup ---

// Builds a MazeMap search URL for a given room query string.
// No campusid filter — searches across all Curtin campuses in MazeMap (Perth, Perth City,
// Dubai, Midland). The Perth lat/lng boost ensures Perth results rank first for Perth rooms;
// rooms at other campuses are still found since the query string is campus-specific.
const getMazeMapURL = (q: string) =>
  `https://search.mazemap.com/search/equery/?q=${encodeURIComponent(q)}&rows=1&start=0&withpois=true&withbuilding=true&withtype=true&withcampus=true&lng=115.89582570734012&lat=-32.00742307052456&boostbydistance=true`;

// Builds a Google Maps search URL from WGS84 coordinates.
const googleMapsURL = ({ lat, lng }: { lat: number; lng: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;

// Builds a MazeMap deep link that opens and highlights a specific POI by ID.
// poiId is globally unique in MazeMap so no campusid is needed here.
const mazeMapURL = ({ lat, lng, floor, poiId }: { lat: number; lng: number; floor: number; poiId: number }) =>
  `https://use.mazemap.com/#v=1&zlevel=${floor}&center=${lng},${lat}&zoom=18&sharepoitype=poi&sharepoi=${poiId}`;

// Looks up the physical location of a room string (e.g. "212 107") via the
// MazeMap API. Returns location metadata on success, or false on error/timeout.
export async function getLocation(location: string) {
  // Room format must be "BBB RRR" (building + room separated by a space).
  // Single-word strings (e.g. "TBA", "ONLINE") have no room component — skip lookup.
  const parts = location.split(' ');
  if (parts.length < 2 || !parts[0] || !parts[1]) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    // Convert "BBB RRR" to "BBB.RRR" for MazeMap's query format.
    const formatted = parts[0] + '.' + parts.slice(1).join('');

    const res = await fetch(getMazeMapURL(formatted), {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const datares = (await res.json()) as locationResponseType;
    const data = datares.result[0];
    // Guard against an empty result set (room not found in MazeMap).
    if (!data) return false;

    // GeoJSON coordinates are [longitude, latitude]
    const lat = data.geometry.coordinates[1];
    const lng = data.geometry.coordinates[0];

    return {
      floor: data.zValue,
      coordinates: { lat, lng },
      placeName: data.dispBldNames,
      room: parts[1],
      url: googleMapsURL({ lat, lng }),
      campusMapUrl: mazeMapURL({ lat, lng, floor: data.zValue, poiId: data.poiId }),
    };
  } catch (err) {
    clearTimeout(timeout);
    console.error('[curtincalendar] getLocation fetch error:', err);
    return false;
  }
}
