/**
 * @jest-environment node
 */
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyGuide,
} from "../__mocks__/mongoHandler";
import { AnalyticsSalt } from "models/analyticsSalt";
import { DailyStat } from "models/dailyStat";
import { Pageview } from "models/pageview";
import {
  getDailySalt,
  recordPageview,
  toPageview,
  visitorHash,
} from "../../app/lib/analytics/recordPageview";
import {
  getAnalyticsDashboard,
  getAnalyticsHeadline,
  rollUpFinishedDays,
} from "../../app/lib/analytics/stats";
import type { PageviewSnapshot } from "utils/analytics";

const BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const PHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const GPTBOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot";

const hit = (overrides: Partial<PageviewSnapshot> = {}): PageviewSnapshot => ({
  at: new Date("2026-10-23T12:00:00Z"),
  path: "/guides",
  search: "",
  host: "io.vefskoli.is",
  userAgent: BROWSER,
  ip: "203.0.113.7",
  referrer: null,
  country: "IS",
  city: "Reykjavík",
  ...overrides,
});

const resetSaltCache = () => {
  delete (globalThis as { _analyticsSalt?: unknown })._analyticsSalt;
};

describe("analytics", () => {
  beforeAll(async () => {
    await connect();
    // TTL and unique indexes are part of what is under test.
    await Promise.all([Pageview.init(), AnalyticsSalt.init(), DailyStat.init()]);
  });
  afterEach(async () => {
    await clearDatabase();
    resetSaltCache();
  });
  afterAll(async () => await closeDatabase());

  describe("visitor ids", () => {
    it("are stable for one ip and browser within a day", () => {
      expect(visitorHash("salt", "203.0.113.7", BROWSER)).toBe(
        visitorHash("salt", "203.0.113.7", BROWSER)
      );
      expect(visitorHash("salt", "203.0.113.7", BROWSER)).toMatch(/^[0-9a-f]{16}$/);
    });

    it("differ between visitors and between days", () => {
      const base = visitorHash("salt-a", "203.0.113.7", BROWSER);
      expect(visitorHash("salt-a", "203.0.113.8", BROWSER)).not.toBe(base);
      expect(visitorHash("salt-a", "203.0.113.7", PHONE)).not.toBe(base);
      expect(visitorHash("salt-b", "203.0.113.7", BROWSER)).not.toBe(base);
    });

    it("use one salt per day, shared by every instance, gone after the day", async () => {
      const first = await getDailySalt("2026-10-23");
      resetSaltCache(); // a different lambda
      const second = await getDailySalt("2026-10-23");
      const tomorrow = await getDailySalt("2026-10-24");

      expect(second).toBe(first);
      expect(tomorrow).not.toBe(first);
      expect(first).toMatch(/^[0-9a-f]{64}$/);

      const row = await AnalyticsSalt.findOne({ day: "2026-10-23" }).lean();
      expect(row?.expiresAt.toISOString()).toBe("2026-10-24T00:00:00.000Z");
      const indexes = await AnalyticsSalt.collection.indexes();
      expect(indexes.find((i) => i.key.expiresAt)?.expireAfterSeconds).toBe(0);
    });

    it("survive a race between first requests of the day", async () => {
      const salts = await Promise.all(
        Array.from({ length: 5 }, () => {
          resetSaltCache();
          return getDailySalt("2026-10-23");
        })
      );
      expect(new Set(salts).size).toBe(1);
      expect(await AnalyticsSalt.countDocuments()).toBe(1);
    });
  });

  describe("recordPageview", () => {
    it("stores a person's view without their ip or user agent", async () => {
      await recordPageview(
        hit({
          search: "?utm_source=tskoli",
          referrer: "https://www.google.com/search?q=vefskolinn",
        })
      );

      const rows = await Pageview.find().lean();
      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row).toMatchObject({
        day: "2026-10-23",
        path: "/guides",
        source: "tskoli",
        referrer: "google.com",
        country: "IS",
        city: "Reykjavík",
        device: "desktop",
        bot: null,
      });
      expect(row.visitor).toMatch(/^[0-9a-f]{16}$/);

      const stored = JSON.stringify(row);
      expect(stored).not.toContain("203.0.113.7");
      expect(stored).not.toContain("Chrome");
      expect(stored).not.toContain("vefskolinn"); // the search query
    });

    it("labels crawlers and gives them no visitor id", async () => {
      await recordPageview(hit({ userAgent: GPTBOT, path: "/robots.txt" }));
      const row = await Pageview.findOne().lean();
      expect(row).toMatchObject({ bot: "GPTBot", visitor: null, device: null });
    });

    it("expires raw rows after the retention period", async () => {
      await Pageview.init();
      const indexes = await Pageview.collection.indexes();
      expect(indexes.find((i) => i.key.at)?.expireAfterSeconds).toBe(90 * 86400);
    });

    it("can be switched off", async () => {
      process.env.ANALYTICS_DISABLED = "1";
      try {
        await recordPageview(hit());
      } finally {
        delete process.env.ANALYTICS_DISABLED;
      }
      expect(await Pageview.countDocuments()).toBe(0);
    });

    it("never throws, because the visitor already has their page", async () => {
      const spy = jest.spyOn(Pageview, "create").mockRejectedValueOnce(new Error("db down"));
      const log = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(recordPageview(hit())).resolves.toBeUndefined();
      expect(log).toHaveBeenCalled();
      spy.mockRestore();
      log.mockRestore();
    });
  });

  describe("dashboard", () => {
    const NOW = new Date("2026-10-23T15:00:00Z");

    /** Insert rows the way the proxy would, at a given time. */
    const record = async (overrides: Partial<PageviewSnapshot>) =>
      Pageview.create(await toPageview(hit(overrides)));

    it("counts each visitor once a day however many pages they read", async () => {
      const guide = await createDummyGuide();
      const guidePath = `/guides/${guide._id}`;

      // Today: one visitor reads two pages, another reads one, GPTBot crawls.
      await record({ path: "/guides" });
      await record({ path: guidePath });
      await record({ path: guidePath, ip: "198.51.100.2", userAgent: PHONE, referrer: "https://tskoli.is/x" });
      await record({ path: guidePath, userAgent: GPTBOT });
      await record({ path: "/robots.txt", userAgent: GPTBOT });

      // Yesterday: the first visitor again — a new day, a new id.
      const yesterday = new Date("2026-10-22T09:00:00Z");
      await record({ at: yesterday, path: "/" });

      const dashboard = await getAnalyticsDashboard(7, NOW);

      expect(dashboard.from).toBe("2026-10-17");
      expect(dashboard.to).toBe("2026-10-23");
      expect(dashboard.series).toHaveLength(7);
      expect(dashboard.series.at(-1)).toEqual({ day: "2026-10-23", views: 3, visitors: 2, crawlerHits: 2 });
      expect(dashboard.series.at(-2)).toEqual({ day: "2026-10-22", views: 1, visitors: 1, crawlerHits: 0 });
      expect(dashboard.totals).toEqual({ views: 4, visitors: 3, crawlerHits: 2 });
      // Recording started inside this range: nothing honest to compare with.
      expect(dashboard.previous).toBeNull();
      expect(dashboard.collectingSince).toBe("2026-10-22");

      expect(dashboard.pages[0]).toMatchObject({
        key: guidePath,
        label: guide.title,
        detail: guidePath,
        views: 2,
        visitors: 2,
      });
      expect(dashboard.pages.map((p) => p.label)).toEqual(
        expect.arrayContaining(["Guide list", "Landing page"])
      );

      expect(dashboard.sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "tskoli.is", views: 1 }),
          expect.objectContaining({ key: null, label: "Direct or unknown", views: 3 }),
        ])
      );
      expect(dashboard.countries[0]).toMatchObject({ key: "IS", label: "Iceland" });
      expect(dashboard.devices.map((d) => d.label).sort()).toEqual(["Desktop", "Mobile"]);

      expect(dashboard.crawlers).toEqual([
        expect.objectContaining({ bot: "GPTBot", kind: "ai", hits: 2, guidePages: 1, fetchedRobots: true }),
      ]);
      expect(dashboard.recentCrawls[0]).toMatchObject({ bot: "GPTBot" });
      expect(dashboard.recentCrawls.find((c) => c.path === guidePath)?.label).toBe(guide.title);
      expect(dashboard.guideCount).toBe(1);
    });

    it("rolls finished days up once, and keeps their totals after the raw rows go", async () => {
      await record({ at: new Date("2026-10-21T10:00:00Z") });
      await record({ at: new Date("2026-10-21T11:00:00Z"), ip: "198.51.100.2" });
      await record({ at: new Date("2026-10-23T10:00:00Z") });

      expect(await rollUpFinishedDays(NOW)).toBe(1);
      expect(await rollUpFinishedDays(NOW)).toBe(0);
      expect(await DailyStat.findOne({ day: "2026-10-21" }).lean()).toMatchObject({
        views: 2,
        visitors: 2,
        crawlerHits: 0,
      });
      // Today is still in progress, so it is not rolled up.
      expect(await DailyStat.countDocuments({ day: "2026-10-23" })).toBe(0);

      // The TTL monitor removes the raw rows; the trend must not change.
      await Pageview.deleteMany({ day: "2026-10-21" });
      const dashboard = await getAnalyticsDashboard(7, NOW);
      expect(dashboard.series.find((p) => p.day === "2026-10-21")).toMatchObject({ views: 2, visitors: 2 });
      expect(dashboard.totals.views).toBe(3);
    });

    it("waits a few minutes past midnight before rolling up yesterday", async () => {
      await record({ at: new Date("2026-10-22T23:59:59Z") });
      expect(await rollUpFinishedDays(new Date("2026-10-23T00:02:00Z"))).toBe(0);
      expect(await rollUpFinishedDays(new Date("2026-10-23T00:20:00Z"))).toBe(1);
    });

    it("compares with the previous period once there is data that far back", async () => {
      await DailyStat.create({ day: "2026-10-10", views: 5, visitors: 4, crawlerHits: 1 });
      await record({});

      const dashboard = await getAnalyticsDashboard(7, NOW);
      expect(dashboard.previous).toEqual({ views: 5, visitors: 4, crawlerHits: 1 });
      expect(dashboard.totals).toEqual({ views: 1, visitors: 1, crawlerHits: 0 });
    });

    it("is empty, not broken, before the first visit", async () => {
      const dashboard = await getAnalyticsDashboard(30, NOW);
      expect(dashboard.series).toHaveLength(30);
      expect(dashboard.totals).toEqual({ views: 0, visitors: 0, crawlerHits: 0 });
      expect(dashboard.pages).toEqual([]);
      expect(dashboard.crawlers).toEqual([]);
      expect(dashboard.collectingSince).toBeNull();
    });

    it("gives the teacher home page last week's numbers", async () => {
      await record({ at: new Date("2026-10-16T10:00:00Z") }); // 8 days ago: outside
      await record({ at: new Date("2026-10-17T10:00:00Z") });
      await record({ at: new Date("2026-10-23T10:00:00Z") });
      await record({ at: new Date("2026-10-23T11:00:00Z") });
      await record({ at: new Date("2026-10-23T11:00:00Z"), userAgent: GPTBOT });

      expect(await getAnalyticsHeadline(NOW)).toEqual({
        days: 7,
        visitors: 2,
        views: 3,
        collectingSince: "2026-10-16",
      });
    });
  });
});
