export const runtime = "nodejs";

type TokenRecord = { accessToken: string; expiresAt: number };

let cached: TokenRecord | null = null;
let inFlightRefresh: Promise<TokenRecord> | null = null;

const REFRESH_BUFFER_MS = 300 * 1000; // 5 minutes

export async function getZoomToken(): Promise<string> {
  const now = Date.now();

  if (cached && now < cached.expiresAt - REFRESH_BUFFER_MS) {
    return cached.accessToken;
  }

  if (inFlightRefresh) {
    const record = await inFlightRefresh;
    return record.accessToken;
  }

  inFlightRefresh = refreshToken();
  try {
    const record = await inFlightRefresh;
    cached = record;
    return record.accessToken;
  } finally {
    inFlightRefresh = null;
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