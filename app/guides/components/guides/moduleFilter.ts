/**
 * The guide list's remembered module filter, shared by the server page and
 * the client list. A cookie rather than localStorage so the server can render
 * the student's choice on first paint: waiting for localStorage meant the
 * server could only ever send a spinner, which is all crawlers ever saw.
 */
export const MODULE_COOKIE = "guides-module";

/** Where the filter used to live; read once to carry a choice over. */
export const LEGACY_STORAGE_KEY = "selectedModule";

/** A module number, or null for "All modules" and anything unreadable. */
export const parseModuleChoice = (value: string | null | undefined): number | null => {
  if (value == null || value === "" || value === "all" || value === "null") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

/** Remember the choice for a year. "all" is stored too, so it counts as a choice. */
export const moduleCookie = (module: number | null): string =>
  `${MODULE_COOKIE}=${module ?? "all"}; path=/; max-age=31536000; samesite=lax`;
