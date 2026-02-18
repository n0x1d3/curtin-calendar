// --- Message commands passed between extension contexts ---
export enum command {
  download = 'download',
  click = 'click',
}

// --- MazeMap API response shape (only the fields we use) ---
export interface locationResponseType {
  result: [
    {
      geometry: {
        coordinates: [number, number]; // GeoJSON order: [longitude, latitude]
      };
      zValue: number;
      dispBldNames: [string];
    }
  ];
}

// --- Time types ---
export type timeStamp = {
  hour: number;
  minutes: number;
};

export interface classTimeType {
  start: timeStamp;
  end: timeStamp;
  differenceInMinutes: number;
}

// Physical room data resolved from the MazeMap API.
// getLocation returns this on success, or false on error/timeout.
export type LocationData = {
  placeName: [string];
  room: string;
  url: string;
  floor: number;
  coordinates: {
    lat: number;
    lng: number;
  };
};

// --- Scraped class data returned by scrapData ---
export interface scrapedDataType {
  type: string;
  location: LocationData | false;
  time: classTimeType;
  title: string;
  date: Date;
}

// Days in the format that matches the timetable website element IDs
export const webDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
