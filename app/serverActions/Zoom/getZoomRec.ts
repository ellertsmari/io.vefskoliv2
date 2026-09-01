"use server";

import { auth } from "../../../auth";
import { getZoomToken } from "./zoomToken";

// Fetch recordings for the current school year with pagination support
// Note: Zoom API limits date range to max 1 month, so we query month by month
export type RecordingsResult = {
  total_records: number;
  meetings: any[];
  /** Zoom could not be reached, as opposed to there being no recordings. */
  unavailable: boolean;
};

/**
 * Next signals control flow by throwing: `redirect()`, `notFound()`, and the
 * dynamic-rendering bail-out all surface as errors carrying a `digest`. Those
 * must reach the framework, so a catch-all around render code has to re-throw
 * them rather than treat them as a failed request.
 */
function isFrameworkSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest === "DYNAMIC_SERVER_USAGE" ||
      digest === "NEXT_NOT_FOUND" ||
      digest.startsWith("NEXT_REDIRECT"))
  );
}

/**
 * Only fails by returning `unavailable`. This is awaited during the render of
 * the resources page, and an unhandled Zoom outage there took the whole page
 * down — including the Google Drive link, which does not depend on Zoom.
 */
export async function getUserRecordings(): Promise<RecordingsResult> {
  // Deliberately outside the try: auth() reads headers, and Next marks the
  // route dynamic by throwing. Swallowing that would bake a stale "unavailable"
  // page into the static output.
  const session = await auth();
  if (!session?.user) {
    return { total_records: 0, meetings: [], unavailable: false };
  }

  try {
    return await fetchUserRecordings();
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    console.error("Zoom recordings unavailable:", error);
    return { total_records: 0, meetings: [], unavailable: true };
  }
}

/** Zoom wants a plain calendar day, `YYYY-MM-DD`. */
function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const SCHOOL_YEAR_START_MONTH = 7; // August

/**
 * The school year starts in August, so before August we are still in the year
 * that began the previous August. Derived from the clock rather than written
 * down, so it rolls over on its own instead of needing an edit every summer.
 */
function schoolYearStart(now: Date): Date {
  const year =
    now.getMonth() >= SCHOOL_YEAR_START_MONTH
      ? now.getFullYear()
      : now.getFullYear() - 1;
  return new Date(year, SCHOOL_YEAR_START_MONTH, 1);
}

async function fetchUserRecordings(): Promise<RecordingsResult> {
  let token = await getZoomToken();

  const now = new Date();
  const allMeetings: any[] = [];

  // Zoom caps a recordings query at a one-month range, so walk month by month
  // from the start of the school year up to today. Anything before August is
  // not fetched: it is not shown, and every extra month is another round trip.
  //
  // There is deliberately no fixed end date. A hardcoded one (Aug 31, 2026)
  // used to cut the loop short, so recordings made after it were never queried
  // and simply went missing from the page with no error anywhere.
  let currentDate = schoolYearStart(now);

  while (currentDate <= now) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const from = formatDay(new Date(year, month, 1));
    // Never ask past today — the current month is still in progress.
    const monthEnd = new Date(year, month + 1, 0);
    const to = formatDay(monthEnd < now ? monthEnd : now);

    let nextPageToken: string | undefined;

    do {
      const url = new URL(`https://api.zoom.us/v2/users/me/recordings`);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      url.searchParams.set("page_size", "300");
      if (nextPageToken) {
        url.searchParams.set("next_page_token", nextPageToken);
      }

      let res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      // Handle token expiration. Force a refresh — the cached token is the one
      // that just got rejected, so reusing it would fail identically.
      if (res.status === 401) {
        token = await getZoomToken({ forceRefresh: true });
        res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Zoom API failed for ${from} to ${to}: ${res.status} ${errorText}`);
        break;
      }

      const data = await res.json();

      if (data.meetings && data.meetings.length > 0) {
        allMeetings.push(...data.meetings);
      }

      nextPageToken = data.next_page_token;
    } while (nextPageToken);

    // Move to next month
    currentDate = new Date(year, month + 1, 1);
  }

  // Sort by start_time descending (newest first)
  allMeetings.sort((a, b) =>
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return {
    total_records: allMeetings.length,
    meetings: allMeetings,
    unavailable: false,
  };
}
