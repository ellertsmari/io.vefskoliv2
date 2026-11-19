/* "January 2027". UTC, so the server and the browser show the same month
   whatever the visitor's time zone is. */
export const formatMonth = (date: Date): string =>
  date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
