"use server";

import { getZoomToken } from "./zoomToken";

// Fetch recordings for a given user (replace with the host's email or "me")
export async function getUserRecordings() {
  const token = await getZoomToken();

  // Pick your date window — required for recordings API
  const from = "2025-08-18"; // yyyy-mm-dd
  const to = "2026-08-31";

  const res = await fetch(
    `https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (res.status === 401) {
    // Token race: refresh once and retry
    const retryToken = await getZoomToken();
    const retry = await fetch(
      `https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}`,
      {
        headers: { Authorization: `Bearer ${retryToken}` },
        cache: "no-store",
      }
    );
    if (!retry.ok) {
      const t = await retry.text().catch(() => "");
      throw new Error(
        `Zoom API retry failed: ${retry.status} ${retry.statusText} ${t}`
      );
    }
    return retry.json();
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Zoom API failed: ${res.status} ${res.statusText} ${t}`);
  }

  return res.json();
}
