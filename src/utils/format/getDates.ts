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
 * Hardcoded semester dates for years where the formula-based calculation is inaccurate.
 * Update this table when Curtin publishes a new academic calendar.
 *
 * From 2026, Curtin added an extra non-teaching week per semester, making the formula
 * unreliable. Verify exact start/end dates at:
 * https://students.curtin.edu.au/essentials/semester-dates/
 *
 * Dates sourced from Academic-Calendar-2025-2028-17062025.pdf (approved 27 June 2025).
 * 2025 matches the formula — no override needed.
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

// Estimates semester dates using the historical pattern: semester 1 starts on the
// 4th Monday of February; semesters are each 13 weeks with an 8-week gap between them.
// This is accurate for years up to 2025 but unreliable from 2026 onward.
function calculateDates(year: number): SemesterDates {
  const february = new Date(`February 1, ${year}`);
  const startSem1: Date = getnthMonday(february, 4);
  const endSem1: Date = addnWeeks(startSem1, 13);
  const startSem2: Date = addnWeeks(endSem1, 8);
  const endSem2: Date = addnWeeks(startSem2, 13);
  return {
    1: {
      start: { month: 2, day: startSem1.getDate() },
      end: { month: 5, day: endSem1.getDate() - 1 },
      weeks: 13,
    },
    2: {
      start: { month: 7, day: startSem2.getDate() },
      end: { month: 10, day: endSem2.getDate() - 1 },
      weeks: 13,
    },
    currentYear: year,
  };
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
