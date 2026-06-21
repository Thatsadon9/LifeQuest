/**
 * Local-time date helpers.
 *
 * Everything here works in the user's LOCAL timezone and represents calendar
 * days as `YYYY-MM-DD` strings (never UTC ISO strings), so day boundaries match
 * what the user sees on their clock. Weeks run Monday → Sunday.
 */

/** Zero-pad a number to two digits. */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Convert a `Date` to a local `YYYY-MM-DD` key. */
export function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parse a `YYYY-MM-DD` key into a local `Date` at midnight (no UTC shift). */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Coerce a `Date` or `YYYY-MM-DD` key into a local `Date`. */
function toDate(input: string | Date): Date {
  return typeof input === 'string' ? keyToDate(input) : input;
}

/** Today's local calendar day as `YYYY-MM-DD`. */
export function todayKey(): string {
  return dateToKey(new Date());
}

/**
 * Add (or subtract) days and return the resulting `YYYY-MM-DD` key.
 * @param input a `Date` or `YYYY-MM-DD` key
 * @param days  number of days to add (may be negative)
 */
export function addDays(input: string | Date, days: number): string {
  const d = toDate(input);
  d.setDate(d.getDate() + days);
  return dateToKey(d);
}

/**
 * Monday of the week containing `date`, as a `YYYY-MM-DD` key.
 * @param date defaults to now
 */
export function weekStartKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay(): 0=Sun..6=Sat. Days since Monday = (day + 6) % 7.
  const sinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - sinceMonday);
  return dateToKey(d);
}

/**
 * Sunday of the week containing `date`, as a `YYYY-MM-DD` key.
 * @param date defaults to now
 */
export function weekEndKey(date: Date = new Date()): string {
  return addDays(weekStartKey(date), 6);
}

/**
 * Inclusive list of `YYYY-MM-DD` keys from `start` to `end`.
 * Returns `[]` if `end` precedes `start`.
 */
export function rangeDays(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  // Guard against pathological input (cap at ~10 years).
  for (let i = 0; i < 3700 && cur <= end; i++) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** Format a key as a short, human label, e.g. `"Jun 21"`. */
export function formatShortDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Weekday name for a key.
 * @param key   `YYYY-MM-DD`
 * @param short when true returns `"Mon"`, otherwise `"Monday"`
 */
export function weekdayName(key: string, short = false): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    weekday: short ? 'short' : 'long',
  });
}

/**
 * ISO-8601 week label for a date, e.g. `"2026-W25"`.
 * @param date defaults to now
 */
export function isoWeekLabel(date: Date = new Date()): string {
  // Copy to a UTC anchor so the ISO arithmetic is timezone-stable.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week =
    1 +
    Math.round(
      (d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000),
    );
  return `${d.getUTCFullYear()}-W${pad2(week)}`;
}
