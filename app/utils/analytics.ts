/**
 * Cookieless, server-side page analytics: the pure half.
 *
 * Everything here is a decision about one request (does it count, who sent
 * it, where did it come from) or about one day, with no I/O, so the rules can
 * be tested without a database or a Next.js request. No Node built-ins either:
 * the dashboard's client components import the range options from here. Recording lives in
 * app/lib/analytics/recordPageview.ts, reading in app/lib/analytics/stats.ts.
 *
 * What makes this need no consent banner is what it does NOT keep: no cookie,
 * no IP address, no user agent string. A visitor is a hash of their IP and
 * user agent with a salt that is thrown away at the end of the day, so the
 * same person on two days is two unrelated visitors and nobody — us included —
 * can turn a stored hash back into an address. That is the Plausible/Umami
 * method.
 */

/**
 * How long a raw page view is kept. The per-day totals in `dailystats` stay;
 * only the rows behind the breakdowns (pages, sources, countries, crawlers)
 * expire. Changing this does not change an existing TTL index — see the
 * note in models/pageview.ts.
 */
export const RETENTION_DAYS = 90;

/** The date ranges the dashboard offers, in days. None may exceed retention. */
export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

export const parseRange = (value: unknown): RangeDays => {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return (RANGE_OPTIONS as readonly number[]).includes(days)
    ? (days as RangeDays)
    : 30;
};

// ---------------------------------------------------------------- days

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A calendar day as "YYYY-MM-DD", in UTC. Iceland is on UTC all year, so this
 * is also the local day for the people reading the dashboard, and ISO strings
 * sort and compare correctly as plain strings in MongoDB.
 */
export const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

/** The day `offset` days after `day` (negative goes back). */
export const shiftDay = (day: string, offset: number): string =>
  dayKey(new Date(Date.parse(`${day}T00:00:00Z`) + offset * DAY_MS));

/** Every day from `from` to `to`, both included, oldest first. */
export const daysBetween = (from: string, to: string): string[] => {
  const days: string[] = [];
  for (let day = from; day <= to; day = shiftDay(day, 1)) days.push(day);
  return days;
};

/** The instant a day's salt stops being needed: the start of the next day. */
export const endOfDay = (day: string): Date =>
  new Date(Date.parse(`${shiftDay(day, 1)}T00:00:00Z`));

// ---------------------------------------------------------------- visitors

/**
 * The client's address from the headers Vercel sets. `x-forwarded-for` is a
 * list ending at the platform; its first entry is the client.
 */
export const clientIpFrom = (headers: Pick<Headers, "get">): string => {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
};

// ---------------------------------------------------------------- crawlers

export type CrawlerKind = "search" | "ai" | "social" | "seo" | "other";

/**
 * Known crawlers, first match wins, so the specific patterns come before the
 * general ones (Google-InspectionTool before Googlebot, OAI-SearchBot before
 * the catch-all). The label is what is stored and shown, so renaming one
 * splits its history — add new entries rather than editing old labels.
 *
 * The AI entries are the point of the crawler panel: GPTBot, ClaudeBot and
 * PerplexityBot do not run JavaScript, so whether they fetched /guides/* at
 * all is the before/after measurement for server-rendering the guide list.
 */
const CRAWLERS: Array<{ label: string; kind: CrawlerKind; pattern: RegExp }> = [
  { label: "GPTBot", kind: "ai", pattern: /GPTBot/i },
  { label: "OAI-SearchBot", kind: "ai", pattern: /OAI-SearchBot/i },
  { label: "ChatGPT-User", kind: "ai", pattern: /ChatGPT-User/i },
  { label: "ClaudeBot", kind: "ai", pattern: /ClaudeBot/i },
  { label: "Claude-SearchBot", kind: "ai", pattern: /Claude-SearchBot/i },
  { label: "Claude-User", kind: "ai", pattern: /Claude-User/i },
  { label: "anthropic-ai", kind: "ai", pattern: /anthropic-ai/i },
  { label: "PerplexityBot", kind: "ai", pattern: /PerplexityBot/i },
  { label: "Perplexity-User", kind: "ai", pattern: /Perplexity-User/i },
  { label: "Meta-ExternalAgent", kind: "ai", pattern: /meta-external(agent|fetcher)/i },
  { label: "Amazonbot", kind: "ai", pattern: /Amazonbot/i },
  { label: "Bytespider", kind: "ai", pattern: /Bytespider/i },
  { label: "CCBot", kind: "ai", pattern: /CCBot/i },
  { label: "Google-Extended", kind: "ai", pattern: /Google-Extended/i },

  { label: "Google (other)", kind: "search", pattern: /Google-InspectionTool|GoogleOther|Google-Site-Verification|AdsBot-Google|Mediapartners-Google|APIs-Google|FeedFetcher-Google|Storebot-Google/i },
  { label: "Googlebot", kind: "search", pattern: /Googlebot/i },
  { label: "Bingbot", kind: "search", pattern: /bingbot|BingPreview|msnbot|adidxbot/i },
  { label: "Applebot", kind: "search", pattern: /Applebot/i },
  { label: "DuckDuckBot", kind: "search", pattern: /DuckDuck(Go-Favicons-)?Bot/i },
  { label: "YandexBot", kind: "search", pattern: /Yandex/i },
  { label: "Baiduspider", kind: "search", pattern: /Baiduspider/i },
  { label: "PetalBot", kind: "search", pattern: /PetalBot/i },
  { label: "Qwantbot", kind: "search", pattern: /Qwant/i },

  { label: "Facebook", kind: "social", pattern: /facebookexternalhit|facebookcatalog/i },
  { label: "Twitterbot", kind: "social", pattern: /Twitterbot/i },
  { label: "LinkedInBot", kind: "social", pattern: /LinkedInBot/i },
  { label: "Slackbot", kind: "social", pattern: /Slackbot|Slack-ImgProxy/i },
  { label: "Discordbot", kind: "social", pattern: /Discordbot/i },
  { label: "WhatsApp", kind: "social", pattern: /WhatsApp/i },
  { label: "TelegramBot", kind: "social", pattern: /TelegramBot/i },

  { label: "AhrefsBot", kind: "seo", pattern: /AhrefsBot|AhrefsSiteAudit/i },
  { label: "SemrushBot", kind: "seo", pattern: /SemrushBot|SiteAuditBot/i },
  { label: "MJ12bot", kind: "seo", pattern: /MJ12bot/i },
  { label: "DotBot", kind: "seo", pattern: /DotBot/i },
  { label: "Lighthouse", kind: "seo", pattern: /Chrome-Lighthouse|PageSpeed/i },
];

const CRAWLER_KIND = new Map(CRAWLERS.map((c) => [c.label, c.kind]));

/**
 * Anything automated that the list above doesn't name: scripts, monitors,
 * headless browsers, link checkers. Deliberately broad — a person is never
 * hurt by being filed as a bot here, but a bot filed as a person inflates
 * the visitor count, which is the number the dashboard leads with.
 */
const GENERIC_BOT =
  /\bbot\b|bot[/;]|crawl|spider|slurp|scrap|fetch|monitor|uptime|preview|headless|phantom|puppeteer|playwright|selenium|curl|wget|httpie|python|aiohttp|httpx|axios|node-fetch|undici|go-http-client|java\/|okhttp|libwww|perl|ruby|php|scrapy|vercel-|^mozilla\/5\.0$/i;

export const OTHER_BOT = "Other bot";

/**
 * Which crawler sent this user agent, or null for what looks like a person.
 * A missing user agent is a script, not a browser.
 */
export const classifyBot = (userAgent: string | null | undefined): string | null => {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return OTHER_BOT;
  const known = CRAWLERS.find((c) => c.pattern.test(ua));
  if (known) return known.label;
  return GENERIC_BOT.test(ua) ? OTHER_BOT : null;
};

export const crawlerKind = (label: string): CrawlerKind =>
  CRAWLER_KIND.get(label) ?? "other";

// ---------------------------------------------------------------- devices

export type DeviceClass = "desktop" | "mobile" | "tablet";

/**
 * Coarse device class. iPads since iPadOS 13 claim to be Macs and are counted
 * as desktops; there is no honest way to tell from the header alone.
 */
export const deviceClass = (userAgent: string): DeviceClass => {
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i.test(userAgent)) {
    return "tablet";
  }
  if (/Mobi|iPhone|iPod|Android|Windows Phone|Opera Mini/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
};

// ---------------------------------------------------------------- sources

/**
 * The site a visitor came from, as a bare host ("google.com"), or null when
 * there is no referrer or it is this site itself — an internal click is not
 * a source. Only the host is kept: full referrer URLs can carry search terms
 * and session tokens of other sites.
 */
export const referrerHost = (
  referer: string | null | undefined,
  ownHost: string
): string | null => {
  if (!referer) return null;
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }
  if (!["http:", "https:", "android-app:"].includes(url.protocol)) return null;
  const host = stripWww(url.hostname.toLowerCase());
  if (!host || host === stripWww(ownHost.toLowerCase().split(":")[0])) {
    return null;
  }
  return host.slice(0, 100);
};

const stripWww = (host: string) => host.replace(/^www\./, "");

/**
 * A campaign tag from the link itself (`?utm_source=tskoli` or `?ref=...`).
 * Wins over the referrer when present, since it was put there on purpose —
 * and many sites send no referrer at all.
 */
export const campaignSource = (searchParams: URLSearchParams): string | null => {
  const raw = searchParams.get("utm_source") ?? searchParams.get("ref");
  const value = raw?.trim().toLowerCase().slice(0, 64);
  return value || null;
};

/** Vercel's geo headers. Absent locally and on other hosts. */
export const geoFrom = (headers: Headers) => {
  const country = headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  const rawCity = headers.get("x-vercel-ip-city")?.trim();
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity).slice(0, 100);
    } catch {
      city = rawCity.slice(0, 100);
    }
  }
  return {
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    city,
  };
};

// ---------------------------------------------------------------- what counts

/**
 * Files crawlers ask for that are worth seeing in the crawler panel, even
 * though nobody "views" them. Never counted as page views for people.
 */
const CRAWLER_FILES = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

/**
 * Public pages whose traffic we measure. This is a narrower list than the
 * proxy's PUBLIC_ROUTES on purpose:
 *
 *   - /signin is where students land before they log in. Counting it would
 *     bury prospective visitors under the class's own traffic.
 *   - /judge/<token> carries a credential in the path. It must never be
 *     written to a collection, and invited judges aren't public traffic.
 */
const TRACKED_SECTIONS = ["/guides", "/showcase"];

export const normalizePath = (pathname: string): string => {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (trimmed || "/").slice(0, 300);
};

export const isTrackedPath = (pathname: string): boolean =>
  pathname === "/" ||
  CRAWLER_FILES.has(pathname) ||
  // Only the files inside: /handouts itself is not a public route.
  pathname.startsWith("/handouts/") ||
  TRACKED_SECTIONS.some(
    (section) => pathname === section || pathname.startsWith(`${section}/`)
  );

export type HitRequest = {
  method: string;
  /** Already through normalizePath. */
  pathname: string;
  headers: Headers;
  /** Whoever is logged in is a student or a teacher, never public traffic. */
  isLoggedIn: boolean;
};

/**
 * Whether this request is one page view (or one crawler fetch) worth a row.
 *
 * The proxy sees far more than page views. A client-side navigation is an RSC
 * request and counts; a Link prefetch also is one, and must not, or every
 * guide card scrolled past would register as a visit. Browsers' own
 * speculative prefetches and HEAD checks are skipped the same way.
 */
export const shouldRecordHit = ({
  method,
  pathname,
  headers,
  isLoggedIn,
}: HitRequest): boolean => {
  if (isLoggedIn) return false;
  if (method !== "GET") return false;
  if (!isTrackedPath(pathname)) return false;

  if (
    headers.has("next-router-prefetch") ||
    headers.has("next-router-segment-prefetch") ||
    headers.has("next-hmr-refresh") ||
    headers.has("x-middleware-prefetch") ||
    /prefetch|prerender/i.test(headers.get("sec-purpose") ?? "") ||
    /prefetch/i.test(headers.get("purpose") ?? "")
  ) {
    return false;
  }

  // Crawlers are recorded for any tracked path, robots.txt included: when
  // and what they fetched is the whole point of the crawler panel.
  if (classifyBot(headers.get("user-agent")) !== null) return true;

  if (CRAWLER_FILES.has(pathname)) return false;
  const isNavigation = headers.get("rsc") === "1";
  const wantsHtml = (headers.get("accept") ?? "").includes("text/html");
  return isNavigation || wantsHtml;
};

// ---------------------------------------------------------------- recording

/**
 * Everything a page view needs from the request, copied out of it while the
 * proxy still has it. Recording runs after the response has been sent, so it
 * must not hold on to the request itself.
 */
export type PageviewSnapshot = {
  at: Date;
  /** Already through normalizePath. */
  path: string;
  /** The page's own query string, for campaign tags. Nothing else is kept. */
  search: string;
  host: string;
  /** userAgent and ip only feed the visitor hash; neither is stored. */
  userAgent: string;
  ip: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
};

export const snapshotRequest = (
  path: string,
  url: URL,
  headers: Headers,
  at = new Date()
): PageviewSnapshot => ({
  at,
  path,
  search: url.search,
  host: headers.get("host") ?? url.host,
  userAgent: headers.get("user-agent") ?? "",
  ip: clientIpFrom(headers),
  referrer: headers.get("referer"),
  ...geoFrom(headers),
});

/** A guide's id from its public path, for showing titles instead of ids. */
export const guideIdFromPath = (path: string): string | null =>
  /^\/guides\/([0-9a-f]{24})$/i.exec(path)?.[1] ?? null;
