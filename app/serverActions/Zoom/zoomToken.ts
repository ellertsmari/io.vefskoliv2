type TokenRecord = { accessToken: string; expiresAt: number };

let cached: TokenRecord | null = null;
let inFlightRefresh: Promise<TokenRecord> | null = null;

const REFRESH_BUFFER_MS = 300 * 1000; // 5 minutes

/**
 * `forceRefresh` discards the cached token. Zoom can invalidate a
 * server-to-server token before its stated expiry, and without this a retry
 * after a 401 just handed back the same dead token and failed again.
 */
export async function getZoomToken({ forceRefresh = false } = {}): Promise<string> {
  if (forceRefresh) cached = null;

  const now = Date.now();
  if (cached && now < cached.expiresAt - REFRESH_BUFFER_MS) {
    return cached.accessToken;
  }

  // Join a refresh already in flight rather than starting a second one.
  if (inFlightRefresh) {
    return (await inFlightRefresh).accessToken;
  }

  const refresh = refreshToken();
  inFlightRefresh = refresh;
  try {
    const record = await refresh;
    cached = record;
    return record.accessToken;
  } finally {
    // Only clear if a newer refresh hasn't already replaced this one.
    if (inFlightRefresh === refresh) inFlightRefresh = null;
  }
}

async function refreshToken(): Promise<TokenRecord> {
  const accountId = must("ZOOM_ACCOUNT_ID");
  const clientId = must("ZOOM_CLIENT_ID");
  const clientSecret = must("ZOOM_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const url = new URL("https://zoom.us/oauth/token");
  url.searchParams.set("grant_type", "account_credentials");
  url.searchParams.set("account_id", accountId);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Zoom token fetch failed: ${res.status} ${res.statusText} ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

function must(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}