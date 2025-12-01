"use server";

import { getZoomToken } from "./zoomToken";

// Fetch recordings for the current school year with pagination support
// Note: Zoom API limits date range to max 1 month, so we query month by month
export async function getUserRecordings() {
  let token = await getZoomToken();

  // Current school year: Aug 18, 2025 to Aug 31, 2026
  const schoolYearStart = new Date(2025, 7, 18); // Aug 18, 2025
  const schoolYearEnd = new Date(2026, 7, 31);   // Aug 31, 2026
  const now = new Date();

  const allMeetings: any[] = [];

  // Iterate through each month of the school year
  let currentDate = new Date(schoolYearStart);

  while (currentDate <= now && currentDate <= schoolYearEnd) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // For the first month (Aug 2025), start from the 18th
    const isFirstMonth = year === 2025 && month === 7;
    const startDay = isFirstMonth ? 18 : 1;

    const from = `${year}-${String(month + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

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

      // Handle token expiration
      if (res.status === 401) {
        token = await getZoomToken();
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
  };
}
