export enum command {
  download = 'download',
  click = 'click',
  forward = 'forward',
}
export interface locationResponseType {
  result: [
    {
      geometry: {
        coordinates: [number, number];
      };
      zValue: number;
      dispBldNames: [string];
    }
  ];
}

export interface classTimeType {
  start: timeStamp;
  end: timeStamp;
  differenceInMinutes: number;
}
export type timeStamp = {
  hour: number;
  minutes: number;
};
export interface scrappedDataType {
  type: string;
  location: {
    placeName: [string];
    room: string;
    url: string;
    floor: number;
    coordinates: {
      long: number;
      lat: number;
    };
  };
  time: classTimeType;
  title: string;
  date: Date;
}

export const webDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
