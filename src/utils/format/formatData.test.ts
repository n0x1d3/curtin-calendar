import { describe, it, expect, vi, afterEach } from 'vitest';
import { convertTime, getLocation } from './formatData';

describe('convertTime', () => {
  it('standard am range', () => {
    const r = convertTime('9:00am - 10:00am');
    expect(r.start).toEqual({ hour: 9, minutes: 0 });
    expect(r.end).toEqual({ hour: 10, minutes: 0 });
    expect(r.differenceInMinutes).toBe(60);
  });

  it('standard pm range', () => {
    const r = convertTime('2:30pm - 3:30pm');
    expect(r.start).toEqual({ hour: 14, minutes: 30 });
    expect(r.end).toEqual({ hour: 15, minutes: 30 });
    expect(r.differenceInMinutes).toBe(60);
  });

  it('midnight boundary: 12:00am is hour 0', () => {
    const r = convertTime('12:00am - 1:00am');
    expect(r.start).toEqual({ hour: 0, minutes: 0 });
    expect(r.end).toEqual({ hour: 1, minutes: 0 });
    expect(r.differenceInMinutes).toBe(60);
  });

  it('noon boundary: 12:00pm is hour 12', () => {
    const r = convertTime('12:00pm - 1:00pm');
    expect(r.start).toEqual({ hour: 12, minutes: 0 });
    expect(r.end).toEqual({ hour: 13, minutes: 0 });
    expect(r.differenceInMinutes).toBe(60);
  });
});

describe('getLocation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false for single-word location (no room component)', async () => {
    // "ONLINE" has no space so parts.length < 2 — early return without fetch
    const result = await getLocation('ONLINE');
    expect(result).toBe(false);
  });

  it('returns false when MazeMap returns empty result set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ result: [] }),
    }));
    const result = await getLocation('212 107');
    expect(result).toBe(false);
  });

  it('returns location object when MazeMap returns a match', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        result: [{
          geometry: { coordinates: [115.89582, -32.00742] },
          zValue: 1,
          dispBldNames: 'Building 212',
          poiId: 99999,
        }],
      }),
    }));
    const result = await getLocation('212 107');
    expect(result).not.toBe(false);
    if (result !== false) {
      expect(result.floor).toBe(1);
      expect(result.coordinates).toEqual({ lat: -32.00742, lng: 115.89582 });
      expect(result.room).toBe('107');
      expect(result.placeName).toBe('Building 212');
      expect(result.url).toContain('google.com/maps');
      expect(result.campusMapUrl).toContain('mazemap.com');
    }
  });

  it('returns false when fetch throws (network error / timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const result = await getLocation('212 107');
    expect(result).toBe(false);
  });
});
