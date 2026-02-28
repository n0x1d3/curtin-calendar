import { describe, it, expect } from 'vitest';
import { getDates, getSemesterWeeks } from './getDates';

describe('getDates', () => {
  it('2025 - pre-2026 calculated path', () => {
    const d = getDates(2025);
    expect(d[1].start).toEqual({ month: 2, day: 24 });
    expect(d[1].end).toEqual({ month: 5, day: 25 });
    expect(d[1].weeks).toBe(13);
    expect(d[2].start).toEqual({ month: 7, day: 21 });
    expect(d[2].end).toEqual({ month: 10, day: 19 });
    expect(d[2].weeks).toBe(13);
    expect(d[1].start.month).toBeLessThanOrEqual(d[1].end.month);
    expect(d[1].weeks).toBeGreaterThan(0);
  });

  it('2026 - lookup table path', () => {
    const d = getDates(2026);
    expect(d[1].start).toEqual({ month: 2, day: 16 });
    expect(d[1].end).toEqual({ month: 5, day: 22 });
    expect(d[1].weeks).toBe(14);
    expect(d[2].start).toEqual({ month: 7, day: 20 });
    expect(d[2].end).toEqual({ month: 10, day: 23 });
    expect(d[2].weeks).toBe(14);
    expect(d[1].start.month).toBeLessThanOrEqual(d[1].end.month);
    expect(d[1].weeks).toBeGreaterThan(0);
  });

  it('2029 - post-2028 calculated path', () => {
    const d = getDates(2029);
    expect(d[1].start).toEqual({ month: 2, day: 19 });
    expect(d[1].end).toEqual({ month: 5, day: 27 });
    expect(d[1].weeks).toBe(14);
    expect(d[2].start).toEqual({ month: 7, day: 16 });
    expect(d[2].end).toEqual({ month: 10, day: 21 });
    expect(d[2].weeks).toBe(14);
    expect(d[1].start.month).toBeLessThanOrEqual(d[1].end.month);
    expect(d[1].weeks).toBeGreaterThan(0);
  });
});

describe('getSemesterWeeks', () => {
  it('2025 - pre-2026: both semesters -> 13', () => {
    expect(getSemesterWeeks(2025, 1)).toBe(13);
    expect(getSemesterWeeks(2025, 2)).toBe(13);
  });

  it('2026 - lookup table: both semesters -> 14', () => {
    expect(getSemesterWeeks(2026, 1)).toBe(14);
    expect(getSemesterWeeks(2026, 2)).toBe(14);
  });

  it('2029 - post-2028 calculated: both semesters -> 14', () => {
    expect(getSemesterWeeks(2029, 1)).toBe(14);
    expect(getSemesterWeeks(2029, 2)).toBe(14);
  });
});
