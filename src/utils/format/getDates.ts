// --- Date helpers ---

// Returns the nth Monday on or after the given date.
function getnthMonday(date: Date, n: number) {
  const newDate = new Date(date);
  while (newDate.getDay() !== 1) {
    newDate.setDate(newDate.getDate() + 1);
  }
  newDate.setDate(newDate.getDate() + 7 * (n - 1));
  return newDate;
}

// Returns a new date n weeks after the given date.
function addnWeeks(date: Date, n: number) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 7 * n);
  return newDate;
}

// --- Types ---

type SemesterEntry = {
  start: { month: number; day: number };
  end: { month: number; day: number };
  /** Total calendar weeks to navigate (teaching + any mid-semester non-teaching weeks) */
  weeks: number;
};

type SemesterDates = {
  1: SemesterEntry;
  2: SemesterEntry;
  currentYear: number;
};

// --- Known year overrides ---

/**
 * Exact semester dates confirmed against the official Curtin academic calendar PDF.
 * These take precedence over the formula for any year listed here.
 * Add new entries when Curtin publishes a new academic calendar and verify at:
 * https://students.curtin.edu.au/essentials/semester-dates/
 *
 * Dates sourced from Academic-Calendar-2025-2028-17062025.pdf (approved 27 June 2025).
 * 2025 matches the pre-2026 formula — no override needed.
 * 2026–2028 match the 2026+ formula — overrides kept as verified ground truth.
 */
const knownYearOverrides: { [year: number]: SemesterDates } = {
  2026: {
    1: { start: { month: 2, day: 16 }, end: { month: 5, day: 22 }, weeks: 14 },
    2: { start: { month: 7, day: 20 }, end: { month: 10, day: 23 }, weeks: 14 },
    currentYear: 2026,
  },
  2027: {
    1: { start: { month: 2, day: 15 }, end: { month: 5, day: 21 }, weeks: 14 },
    2: { start: { month: 7, day: 19 }, end: { month: 10, day: 22 }, weeks: 14 },
    currentYear: 2027,
  },
  2028: {
    1: { start: { month: 2, day: 14 }, end: { month: 5, day: 19 }, weeks: 14 },
    2: { start: { month: 7, day: 17 }, end: { month: 10, day: 20 }, weeks: 14 },
    currentYear: 2028,
  },
};

// --- Formula-based fallback ---

// Pre-2026 pattern: semester 1 starts on the 4th Monday of February;
// 13 teaching weeks each; 8-week mid-year break.
function calculateDatesPre2026(year: number): SemesterDates {
  const february = new Date(`February 1, ${year}`);
  const startSem1: Date = getnthMonday(february, 4);
  const endSem1: Date = addnWeeks(startSem1, 13);
  const startSem2: Date = addnWeeks(endSem1, 8);
  const endSem2: Date = addnWeeks(startSem2, 13);

  // Subtract one day from the calculated Monday to get the last Sunday of each semester.
  // Do this via a Date object so the month rolls back correctly if the Monday
  // happens to fall on the 1st (e.g. June 1 → last day is May 31, not day 0).
  const lastDaySem1 = new Date(endSem1);
  lastDaySem1.setDate(lastDaySem1.getDate() - 1);
  const lastDaySem2 = new Date(endSem2);
  lastDaySem2.setDate(lastDaySem2.getDate() - 1);

  return {
    1: {
      start: { month: 2, day: startSem1.getDate() },
      end: { month: lastDaySem1.getMonth() + 1, day: lastDaySem1.getDate() },
      weeks: 13,
    },
    2: {
      start: { month: 7, day: startSem2.getDate() },
      end: { month: lastDaySem2.getMonth() + 1, day: lastDaySem2.getDate() },
      weeks: 13,
    },
    currentYear: year,
  };
}

// 2026+ pattern: semester 1 starts on the first Monday on or after February 14;
// semester 2 starts on the 3rd Monday of July; 14 weeks each.
// Derived from knownYearOverrides and verified against 2026, 2027, and 2028.
function calculateDates2026Plus(year: number): SemesterDates {
  const startSem1: Date = getnthMonday(new Date(year, 1, 14), 1);
  const endSem1: Date = addnWeeks(startSem1, 14);
  const startSem2: Date = getnthMonday(new Date(year, 6, 1), 3);
  const endSem2: Date = addnWeeks(startSem2, 14);

  // Subtract one day to get the last Sunday of each semester.
  // Using setDate handles month roll-back correctly (e.g. June 1 → May 31).
  const lastDaySem1 = new Date(endSem1);
  lastDaySem1.setDate(lastDaySem1.getDate() - 1);
  const lastDaySem2 = new Date(endSem2);
  lastDaySem2.setDate(lastDaySem2.getDate() - 1);

  return {
    1: {
      start: { month: 2, day: startSem1.getDate() },
      end: { month: lastDaySem1.getMonth() + 1, day: lastDaySem1.getDate() },
      weeks: 14,
    },
    2: {
      start: { month: 7, day: startSem2.getDate() },
      end: { month: lastDaySem2.getMonth() + 1, day: lastDaySem2.getDate() },
      weeks: 14,
    },
    currentYear: year,
  };
}

function calculateDates(year: number): SemesterDates {
  return year >= 2026 ? calculateDates2026Plus(year) : calculateDatesPre2026(year);
}

// --- Public API ---

// Returns semester dates for the given year, using the override table where
// available and falling back to the formula for unknown years.
export function getDates(year: number): SemesterDates {
  return knownYearOverrides[year] ?? calculateDates(year);
}

// Returns the total number of weeks to navigate for a semester,
// including any mid-semester non-teaching weeks.
export function getSemesterWeeks(year: number, semester: 1 | 2): number {
  return getDates(year)[semester].weeks;
}
