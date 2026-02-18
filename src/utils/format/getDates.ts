function getnthMonday(date: Date, n: number) {
  const newDate = new Date(date);
  while (newDate.getDay() !== 1) {
    newDate.setDate(newDate.getDate() + 1);
  }
  newDate.setDate(newDate.getDate() + 7 * (n - 1));
  return newDate;
}

function addnWeeks(date: Date, n: number) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 7 * n);
  return newDate;
}

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

/**
 * Known semester dates for years where the formula-based calculation is inaccurate.
 * Update this table when Curtin publishes a new academic calendar.
 *
 * From 2026, Curtin added an extra non-teaching week per semester, making the formula
 * unreliable. Verify exact start/end dates at:
 * https://students.curtin.edu.au/essentials/semester-dates/
 *
 * To add a year, uncomment the template below and fill in the correct dates.
 */
const knownYearOverrides: { [year: number]: SemesterDates } = {
  // From 2026 Curtin revised the academic calendar (extra non-teaching week per semester).
  // Sem 1 starts 3rd Monday of Feb (Feb 16), not the 4th (Feb 23) that the formula gives.
  // Sem 2 dates are estimated — verify at https://students.curtin.edu.au/essentials/semester-dates/
  2026: {
    1: { start: { month: 2, day: 16 }, end: { month: 5, day: 25 }, weeks: 14 },
    2: { start: { month: 7, day: 20 }, end: { month: 10, day: 26 }, weeks: 14 },
    currentYear: 2026,
  },
};

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

export function getDates(year: number): SemesterDates {
  return knownYearOverrides[year] ?? calculateDates(year);
}

/** Returns the total weeks to navigate for a semester (teaching + non-teaching breaks) */
export function getSemesterWeeks(year: number, semester: 1 | 2): number {
  return getDates(year)[semester].weeks;
}
