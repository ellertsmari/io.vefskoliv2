/**
 * Number and date formatting for the analytics dashboard. Dates are UTC on
 * purpose: days are UTC days (Iceland's local time), and formatting them in
 * the browser's zone would shift a day for a teacher abroad.
 */

const whole = new Intl.NumberFormat("en-GB");
const compact = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1,284 in tables and tiles. */
export const formatCount = (n: number) => whole.format(n);

/** 1.3K on axes, where space is short. */
export const formatCompact = (n: number) =>
  n < 1000 ? whole.format(n) : compact.format(n);

const parseDay = (day: string) => new Date(`${day}T00:00:00Z`);

const shortDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** "23 Oct" */
export const formatDay = (day: string) => shortDay.format(parseDay(day));

/** "Fri 23 Oct" */
export const formatDayLong = (day: string) => longDay.format(parseDay(day));

/** "23 Oct, 14:05" from an ISO timestamp. */
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/**
 * Change against the previous period, or null when there is nothing to
 * compare with. A rise from zero has no meaningful percentage.
 */
export const percentChange = (current: number, previous: number) => {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
};

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;
