/**
 * @jest-environment node
 */
import {
  OTHER_BOT,
  UNDECLARED_BOT,
  agentFor,
  agentName,
  campaignSource,
  classifyBot,
  classifyRequest,
  clientIpFrom,
  crawlerKind,
  dayKey,
  daysBetween,
  deviceClass,
  endOfDay,
  geoFrom,
  guideIdFromPath,
  isTrackedPath,
  normalizePath,
  parseRange,
  referrerHost,
  shiftDay,
  shouldRecordHit,
  snapshotRequest,
} from "utils/analytics";

const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

describe("classifyBot", () => {
  it.each([
    ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Googlebot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36", "Googlebot"],
    ["Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)", "Google (other)"],
    ["Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", "Bingbot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot", "GPTBot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot", "OAI-SearchBot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot", "ChatGPT-User"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", "ClaudeBot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)", "Claude-User"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)", "PerplexityBot"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)", "Applebot"],
    ["facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "Facebook"],
    ["Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)", "AhrefsBot"],
  ])("names %s", (ua, label) => {
    expect(classifyBot(ua)).toBe(label);
  });

  it.each([
    ["curl/8.5.0", "Script"],
    ["python-requests/2.32.3", "Script"],
    ["Go-http-client/1.1", "Script"],
    ["Mozilla/5.0", "Script"],
    ["", "Script"],
    ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36", "Headless browser"],
    ["Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)", "Monitor"],
    ["Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)", "Scanner"],
    ["Expanse, a Palo Alto Networks company, searches across the global IPv4 space", "Scanner"],
    ["SomeNewCrawler/1.0 (+https://example.com/bot)", OTHER_BOT],
    // A crawler linking to a .php page is still a crawler, not a script.
    ["Mozilla/5.0 (compatible; Barkrowler/0.9; +https://babbar.tech/crawler.php)", OTHER_BOT],
  ])("sorts unknown automation into a group: %p", (ua, label) => {
    expect(classifyBot(ua)).toBe(label);
  });

  it("treats a missing user agent as a script", () => {
    expect(classifyBot(null)).toBe("Script");
    expect(classifyBot(undefined)).toBe("Script");
  });

  it.each([CHROME_DESKTOP, SAFARI_IPHONE, ANDROID_TABLET, ANDROID_PHONE])(
    "does not flag a browser: %s",
    (ua) => {
      expect(classifyBot(ua)).toBeNull();
    }
  );

  it("knows which kind each crawler is", () => {
    expect(crawlerKind("GPTBot")).toBe("ai");
    expect(crawlerKind("ClaudeBot")).toBe("ai");
    expect(crawlerKind("Googlebot")).toBe("search");
    expect(crawlerKind("LinkedInBot")).toBe("social");
    expect(crawlerKind(OTHER_BOT)).toBe("other");
    expect(crawlerKind("Script")).toBe("script");
    expect(crawlerKind("Headless browser")).toBe("script");
    expect(crawlerKind("Monitor")).toBe("monitor");
    expect(crawlerKind("Scanner")).toBe("scanner");
    expect(crawlerKind(UNDECLARED_BOT)).toBe("undeclared");
  });
});

describe("classifyRequest", () => {
  it("files a browser that sends no Accept-Language as an undeclared bot", () => {
    expect(classifyRequest(CHROME_DESKTOP, false)).toBe(UNDECLARED_BOT);
    expect(classifyRequest(CHROME_DESKTOP, true)).toBeNull();
  });

  it("keeps a crawler's own label either way", () => {
    expect(classifyRequest("Mozilla/5.0 (compatible; Googlebot/2.1)", false)).toBe("Googlebot");
    expect(classifyRequest("curl/8.5.0", true)).toBe("Script");
  });
});

describe("agentName", () => {
  it.each([
    ["Mozilla/5.0 (compatible; Barkrowler/0.9; +https://babbar.tech/crawler)", "Barkrowler"],
    ["SomeNewCrawler/1.0 (+https://example.com/bot)", "SomeNewCrawler"],
    ["python-requests/2.32.3", "python-requests"],
    ["curl/8.5.0", "curl"],
    ["Go-http-client/1.1", "Go-http-client"],
    ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36", "HeadlessChrome"],
    ["Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)", "Yahoo Slurp"],
    ["Expanse, a Palo Alto Networks company, searches across the global IPv4 space", "Expanse"],
    ["Mozilla/5.0", "Mozilla"],
  ])("names %p", (ua, name) => {
    expect(agentName(ua)).toBe(name);
  });

  it("keeps no address, link or version", () => {
    const name = agentName("MyFetcher/2.3 (+https://example.com/about; ops@example.com)");
    expect(name).toBe("MyFetcher");
  });

  it("is never kept for people, named crawlers or browsers in disguise", () => {
    expect(agentFor(null, CHROME_DESKTOP)).toBeNull();
    expect(agentFor("Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1)")).toBeNull();
    expect(agentFor(UNDECLARED_BOT, CHROME_DESKTOP)).toBeNull();
    expect(agentFor(OTHER_BOT, "SomeNewCrawler/1.0")).toBe("SomeNewCrawler");
  });
});

describe("deviceClass", () => {
  it("tells desktops, phones and tablets apart", () => {
    expect(deviceClass(CHROME_DESKTOP)).toBe("desktop");
    expect(deviceClass(SAFARI_IPHONE)).toBe("mobile");
    expect(deviceClass(ANDROID_PHONE)).toBe("mobile");
    expect(deviceClass(ANDROID_TABLET)).toBe("tablet");
  });
});

describe("referrerHost", () => {
  it("keeps only the host of an external referrer", () => {
    expect(referrerHost("https://www.google.com/search?q=vefskolinn", "io.vefskoli.is")).toBe("google.com");
    expect(referrerHost("https://tskoli.is/namsbraut/vefthroun/", "io.vefskoli.is")).toBe("tskoli.is");
  });

  it("drops internal clicks, so they don't read as a source", () => {
    expect(referrerHost("https://io.vefskoli.is/guides", "io.vefskoli.is")).toBeNull();
    expect(referrerHost("https://www.io.vefskoli.is/", "io.vefskoli.is")).toBeNull();
    expect(referrerHost("http://localhost:3000/", "localhost:3000")).toBeNull();
  });

  it("ignores missing, malformed and non-web referrers", () => {
    expect(referrerHost(null, "io.vefskoli.is")).toBeNull();
    expect(referrerHost("not a url", "io.vefskoli.is")).toBeNull();
    expect(referrerHost("javascript:alert(1)", "io.vefskoli.is")).toBeNull();
  });
});

describe("campaignSource", () => {
  it("reads utm_source, then ref", () => {
    expect(campaignSource(new URLSearchParams("utm_source=TSkoli&utm_medium=web"))).toBe("tskoli");
    expect(campaignSource(new URLSearchParams("ref=newsletter"))).toBe("newsletter");
    expect(campaignSource(new URLSearchParams("module=3"))).toBeNull();
    expect(campaignSource(new URLSearchParams("utm_source=%20"))).toBeNull();
  });
});

describe("geoFrom and clientIpFrom", () => {
  it("reads Vercel's geo headers and decodes the city", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "is",
      "x-vercel-ip-city": "Reykjav%C3%ADk",
    });
    expect(geoFrom(headers)).toEqual({ country: "IS", city: "Reykjavík" });
  });

  it("is empty without them, as on a laptop", () => {
    expect(geoFrom(new Headers())).toEqual({ country: null, city: null });
    expect(geoFrom(new Headers({ "x-vercel-ip-country": "nope" })).country).toBeNull();
  });

  it("takes the first forwarded address", () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIpFrom(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});

describe("days", () => {
  it("are UTC dates, which is Iceland's local day", () => {
    expect(dayKey(new Date("2026-10-23T23:59:59Z"))).toBe("2026-10-23");
    expect(dayKey(new Date("2026-10-24T00:00:00Z"))).toBe("2026-10-24");
  });

  it("shift across month and year ends", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31");
    expect(shiftDay("2026-10-23", -6)).toBe("2026-10-17");
  });

  it("list a range inclusively", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(daysBetween("2026-10-23", "2026-10-22")).toEqual([]);
  });

  it("end at the next midnight", () => {
    expect(endOfDay("2026-10-23").toISOString()).toBe("2026-10-24T00:00:00.000Z");
  });

  it("only offer the dashboard's ranges", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange(["90"])).toBe(90);
    expect(parseRange("365")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });
});

describe("which paths are measured", () => {
  it.each(["/", "/guides", "/guides/5f13205ab279dc27c467ca56", "/showcase", "/showcase/abc", "/handouts/git.html", "/robots.txt", "/sitemap.xml"])(
    "tracks %s",
    (path) => expect(isTrackedPath(path)).toBe(true)
  );

  it.each(["/signin", "/judge/secret-token", "/LMS/dashboard", "/guidesX", "/handouts", "/icon"])(
    "leaves %s alone",
    (path) => expect(isTrackedPath(path)).toBe(false)
  );

  it("normalizes trailing slashes and caps length", () => {
    expect(normalizePath("/guides/")).toBe("/guides");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/" + "a".repeat(500))).toHaveLength(300);
  });

  it("finds guide ids in guide paths only", () => {
    expect(guideIdFromPath("/guides/5f13205ab279dc27c467ca56")).toBe("5f13205ab279dc27c467ca56");
    expect(guideIdFromPath("/guides")).toBeNull();
    expect(guideIdFromPath("/guides/not-an-id")).toBeNull();
  });
});

describe("shouldRecordHit", () => {
  const html = {
    accept: "text/html,application/xhtml+xml",
    "accept-language": "is,en;q=0.8",
    "user-agent": CHROME_DESKTOP,
  };
  const hit = (
    overrides: Partial<{ method: string; pathname: string; isLoggedIn: boolean }> = {},
    headers: Record<string, string> = html
  ) =>
    shouldRecordHit({
      method: "GET",
      pathname: "/guides",
      isLoggedIn: false,
      headers: new Headers(headers),
      ...overrides,
    });

  it("records a logged-out visitor opening a public page", () => {
    expect(hit()).toBe(true);
  });

  it("never records a logged-in user, student or teacher", () => {
    expect(hit({ isLoggedIn: true })).toBe(false);
    expect(hit({ isLoggedIn: true }, { "user-agent": "GPTBot/1.2" })).toBe(false);
  });

  it("records a client-side navigation", () => {
    expect(hit({}, { rsc: "1", accept: "*/*", "accept-language": "is", "user-agent": CHROME_DESKTOP })).toBe(true);
  });

  it("skips prefetches, which nobody has looked at yet", () => {
    expect(hit({}, { rsc: "1", "next-router-prefetch": "1", "accept-language": "is", "user-agent": CHROME_DESKTOP })).toBe(false);
    expect(hit({}, { rsc: "1", "next-router-segment-prefetch": "/_tree", "accept-language": "is", "user-agent": CHROME_DESKTOP })).toBe(false);
    expect(hit({}, { ...html, "sec-purpose": "prefetch;prerender" })).toBe(false);
    expect(hit({}, { ...html, purpose: "prefetch" })).toBe(false);
  });

  it("skips non-GET requests and non-page fetches", () => {
    expect(hit({ method: "HEAD" })).toBe(false);
    expect(hit({ method: "POST" })).toBe(false);
    expect(hit({}, { accept: "image/avif,image/webp", "accept-language": "is", "user-agent": CHROME_DESKTOP })).toBe(false);
  });

  it("skips paths that are not measured", () => {
    expect(hit({ pathname: "/signin" })).toBe(false);
    expect(hit({ pathname: "/judge/abc123" })).toBe(false);
  });

  it("records crawlers whatever they accept, robots.txt included", () => {
    const gpt = { accept: "*/*", "user-agent": "Mozilla/5.0; compatible; GPTBot/1.2" };
    expect(hit({}, gpt)).toBe(true);
    expect(hit({ pathname: "/robots.txt" }, gpt)).toBe(true);
    expect(hit({ pathname: "/robots.txt" }, html)).toBe(false);
  });

  it("records a browser without Accept-Language as a bot, robots.txt included", () => {
    const disguised = { accept: "*/*", "user-agent": CHROME_DESKTOP };
    expect(hit({ pathname: "/robots.txt" }, disguised)).toBe(true);
  });
});

describe("snapshotRequest", () => {
  it("copies what recording needs out of the request", () => {
    const at = new Date("2026-10-23T12:00:00Z");
    const snapshot = snapshotRequest(
      "/guides",
      new URL("https://io.vefskoli.is/guides?utm_source=tskoli"),
      new Headers({
        host: "io.vefskoli.is",
        "user-agent": CHROME_DESKTOP,
        "x-forwarded-for": "203.0.113.7",
        referer: "https://tskoli.is/",
        "x-vercel-ip-country": "IS",
      }),
      at
    );
    expect(snapshot).toEqual({
      at,
      path: "/guides",
      search: "?utm_source=tskoli",
      host: "io.vefskoli.is",
      userAgent: CHROME_DESKTOP,
      ip: "203.0.113.7",
      hasAcceptLanguage: false,
      referrer: "https://tskoli.is/",
      country: "IS",
      city: null,
    });
  });
});
