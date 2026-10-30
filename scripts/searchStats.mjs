/**
 * Print what Google and Bing know about io.vefskoli.is: which searches showed
 * the site, which pages got clicks, whether each guide in the sitemap is
 * indexed, and how the crawlers are getting on. Read-only — it never submits,
 * removes or changes anything.
 *
 * Run on a laptop, not on Vercel. The keys live outside the repo:
 *   ~/.config/vefskolinn/gsc-service-account.json  Google Cloud service
 *       account key; its client_email is a "Restricted" user on the
 *       https://io.vefskoli.is/ property in Search Console.
 *   ~/.config/vefskolinn/bing-api-key  Bing Webmaster Tools → Settings → API
 *       access. NOT read-only (it can also submit and block URLs), which is
 *       why only the GET methods in BING_READ_METHODS are ever called.
 *
 * Usage: node scripts/searchStats.mjs [--days 28] [--no-index]
 *   --days      how far back to look (default 28; Google keeps 16 months)
 *   --no-index  skip inspecting every sitemap URL (one API call per URL)
 *
 * Google's numbers lag two to three days, and both engines only report
 * searches in which the site actually appeared.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { importPKCS8, SignJWT } from "jose";

const SITE = "https://io.vefskoli.is/";
const KEY_DIR = path.join(os.homedir(), ".config", "vefskolinn");
const GOOGLE_KEY = path.join(KEY_DIR, "gsc-service-account.json");
const BING_KEY = path.join(KEY_DIR, "bing-api-key");
// Filed under "Monitor" by the site's own analytics, so these fetches don't
// show up as a crawler or a visitor in /LMS/analytics.
const USER_AGENT = "vefskoli-monitor (scripts/searchStats.mjs)";
const TOP = 25;

const args = process.argv.slice(2);
const days = Number(args[args.indexOf("--days") + 1]) || 28;
const inspectIndex = !args.includes("--no-index");

// ------------------------------------------------------------------ output

const isoDay = (date) => date.toISOString().slice(0, 10);
const daysAgo = (n) => isoDay(new Date(Date.now() - n * 86_400_000));

const heading = (text) => console.log(`\n=== ${text}`);

/** Prints rows as aligned columns; `columns` is [header, row => value][]. */
const table = (rows, columns) => {
  if (!rows.length) return console.log("  (nothing yet)");
  const cells = [
    columns.map(([header]) => header),
    ...rows.map((row) => columns.map(([, value]) => String(value(row) ?? ""))),
  ];
  const widths = columns.map((_, i) => Math.max(...cells.map((r) => r[i].length)));
  for (const r of cells) {
    console.log("  " + r.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd());
  }
};

const percent = (x) => `${(x * 100).toFixed(1)}%`;
const position = (x) => (x ? x.toFixed(1) : "");
/** Guide URLs are long; the path is what tells them apart. */
const shortUrl = (url) => url.replace(/^https:\/\/io\.vefskoli\.is/, "") || "/";

/** Runs one section; a failing section is reported and the rest still run. */
const section = async (title, run) => {
  heading(title);
  try {
    await run();
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
  }
};

const readKey = (file, what) => {
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    throw new Error(`no ${what} at ${file}`);
  }
};

// ------------------------------------------------------------------ Google

const googleToken = async () => {
  const key = JSON.parse(readKey(GOOGLE_KEY, "Google service account key"));
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
  })
    .setProtectedHeader({ alg: "RS256", kid: key.private_key_id })
    .setIssuer(key.client_email)
    .setAudience(key.token_uri)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(await importPKCS8(key.private_key, "RS256"));
  const response = await fetch(key.token_uri, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`token refused: ${body.error_description || body.error}`);
  }
  return body.access_token;
};

const google = (token) => async (url, body) => {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body && JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || response.statusText);
  return json;
};

const GSC = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}`;

const searchAnalytics = (call, dimensions, rowLimit = TOP) =>
  call(`${GSC}/searchAnalytics/query`, {
    startDate: daysAgo(days),
    endDate: daysAgo(0),
    dimensions,
    rowLimit,
    // Include the last few days, which Google still calls preliminary.
    dataState: "all",
  }).then((result) => result.rows ?? []);

const searchColumns = (label, keyIndex = 0, format = (k) => k) => [
  [label, (r) => format(r.keys[keyIndex])],
  ["clicks", (r) => r.clicks],
  ["shown", (r) => r.impressions],
  ["ctr", (r) => percent(r.ctr)],
  ["position", (r) => position(r.position)],
];

/** The site's own sitemap, so every guide is checked, not only those with traffic. */
const sitemapUrls = async () => {
  const response = await fetch(new URL("sitemap.xml", SITE), {
    headers: { "user-agent": USER_AGENT },
  });
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
};

/** Runs `work` over `items`, `limit` at a time, keeping the input order. */
const mapLimited = async (items, limit, work) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await work(items[i]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
};

const reportGoogle = async () => {
  console.log(`\n##### Google Search Console — ${SITE}, last ${days} days`);
  // Fetched first: when the key or the API is not set up, every call fails the
  // same way, so one message is printed instead of one per section and URL.
  let call;
  let sitemap;
  try {
    call = google(await googleToken());
    ({ sitemap = [] } = await call(`${GSC}/sitemaps`));
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
    return;
  }

  await section("Sitemaps", async () => {
    table(sitemap, [
      ["sitemap", (s) => shortUrl(s.path)],
      ["submitted", (s) => s.lastSubmitted?.slice(0, 10)],
      ["last read", (s) => s.lastDownloaded?.slice(0, 16) ?? "not yet"],
      ["pending", (s) => s.isPending],
      ["errors", (s) => s.errors],
      ["warnings", (s) => s.warnings],
      ["urls", (s) => s.contents?.map((c) => c.submitted).join("+")],
    ]);
  });

  await section("Per day", async () => {
    const rows = await searchAnalytics(call, ["date"], days + 1);
    table(rows, searchColumns("date"));
  });

  await section(`Top ${TOP} searches`, async () => {
    table(await searchAnalytics(call, ["query"]), searchColumns("search"));
  });

  await section(`Top ${TOP} pages`, async () => {
    table(await searchAnalytics(call, ["page"]), searchColumns("page", 0, shortUrl));
  });

  await section("Countries", async () => {
    table(await searchAnalytics(call, ["country"], 10), searchColumns("country"));
  });

  if (!inspectIndex) return;
  await section("Index status of every sitemap URL", async () => {
    const urls = await sitemapUrls();
    const results = await mapLimited(urls, 4, async (url) => {
      try {
        const { inspectionResult } = await call(
          "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
          { inspectionUrl: url, siteUrl: SITE }
        );
        const index = inspectionResult?.indexStatusResult ?? {};
        return { url, ...index };
      } catch (error) {
        return { url, coverageState: `FAILED: ${error.message}` };
      }
    });
    const indexed = results.filter((r) => r.verdict === "PASS").length;
    console.log(`  ${indexed} of ${results.length} indexed`);
    table(results, [
      ["page", (r) => shortUrl(r.url)],
      ["status", (r) => r.coverageState],
      ["last crawled", (r) => r.lastCrawlTime?.slice(0, 10)],
      ["google's canonical", (r) =>
        r.googleCanonical && r.googleCanonical !== r.url ? shortUrl(r.googleCanonical) : ""],
    ]);
  });
};

// -------------------------------------------------------------------- Bing

/** Bing's key can also change things; these are the only methods ever called. */
const BING_READ_METHODS = new Set([
  "GetUserSites",
  "GetRankAndTrafficStats",
  "GetQueryStats",
  "GetPageStats",
  "GetCrawlStats",
  "GetFeeds",
]);

const bing = (apiKey) => async (method, params = {}) => {
  if (!BING_READ_METHODS.has(method)) throw new Error(`${method} is not a read method`);
  const url = new URL(`https://ssl.bing.com/webmaster/api.svc/json/${method}`);
  url.search = new URLSearchParams({ apikey: apiKey, ...params }).toString();
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 200)}`);
  return JSON.parse(text).d ?? [];
};

/** Bing sends dates as "/Date(1730246400000-0700)/". */
const bingDate = (value) => {
  const ms = Number(/\/Date\((-?\d+)/.exec(value ?? "")?.[1]);
  return Number.isFinite(ms) ? isoDay(new Date(ms)) : "";
};

const withinWindow = (rows) => {
  const since = daysAgo(days);
  return rows.filter((r) => bingDate(r.Date) >= since);
};

/** Sums Bing's per-day rows for one search or page into a single row. */
const totalBy = (rows, key) => {
  const totals = new Map();
  for (const r of rows) {
    const t = totals.get(r[key]) ?? { name: r[key], clicks: 0, shown: 0, positionSum: 0 };
    t.clicks += r.Clicks;
    t.shown += r.Impressions;
    t.positionSum += r.AvgImpressionPosition * r.Impressions;
    totals.set(r[key], t);
  }
  return [...totals.values()]
    .sort((a, b) => b.clicks - a.clicks || b.shown - a.shown)
    .slice(0, TOP);
};

const totalColumns = (label, format = (k) => k) => [
  [label, (t) => format(t.name)],
  ["clicks", (t) => t.clicks],
  ["shown", (t) => t.shown],
  ["position", (t) => position(t.shown ? t.positionSum / t.shown : 0)],
];

const reportBing = async () => {
  console.log(`\n##### Bing Webmaster Tools — ${SITE}, last ${days} days`);
  let call;
  try {
    call = bing(readKey(BING_KEY, "Bing API key"));
    const sites = await call("GetUserSites");
    const site = sites.find((s) => s.Url === SITE || s.Url === SITE.slice(0, -1));
    if (!site) {
      const listed = sites.map((s) => s.Url).join(", ") || "none";
      console.log(`  ${SITE} is not in this Bing account (sites: ${listed})`);
      return;
    }
    console.log(`  verified: ${site.IsVerified}`);
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
    return;
  }
  const siteUrl = { siteUrl: SITE };

  await section("Sitemaps", async () => {
    table(await call("GetFeeds", siteUrl), [
      ["sitemap", (f) => shortUrl(f.Url)],
      ["submitted", (f) => bingDate(f.Submitted)],
      ["last read", (f) => bingDate(f.LastCrawled) || "not yet"],
      ["status", (f) => f.Status],
      ["urls", (f) => f.UrlCount],
    ]);
  });

  await section("Per day", async () => {
    table(withinWindow(await call("GetRankAndTrafficStats", siteUrl)), [
      ["date", (r) => bingDate(r.Date)],
      ["clicks", (r) => r.Clicks],
      ["shown", (r) => r.Impressions],
    ]);
  });

  await section(`Top ${TOP} searches`, async () => {
    const rows = withinWindow(await call("GetQueryStats", siteUrl));
    table(totalBy(rows, "Query"), totalColumns("search"));
  });

  await section(`Top ${TOP} pages`, async () => {
    const rows = withinWindow(await call("GetPageStats", siteUrl));
    table(totalBy(rows, "Query"), totalColumns("page", shortUrl));
  });

  await section("Crawling per day", async () => {
    table(withinWindow(await call("GetCrawlStats", siteUrl)), [
      ["date", (r) => bingDate(r.Date)],
      ["crawled", (r) => r.CrawledPages],
      ["in index", (r) => r.InIndex],
      ["errors", (r) => r.CrawlErrors],
      ["blocked by robots", (r) => r.BlockedByRobotsTxt],
    ]);
  });
};

console.log(`Search stats for ${SITE} on ${isoDay(new Date())}`);
await reportGoogle();
await reportBing();
