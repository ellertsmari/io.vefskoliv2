import type { PipelineStage } from "mongoose";
import { DailyStat } from "models/dailyStat";
import { Guide } from "models/guide";
import { Pageview } from "models/pageview";
import { connectToDatabase } from "serverActions/mongoose-connector";
import type {
  AnalyticsDashboard,
  AnalyticsHeadline,
  BreakdownRow,
  CrawlerFetch,
  CrawlerRow,
  DailyPoint,
  DayTotals,
} from "types/analyticsTypes";
import {
  RETENTION_DAYS,
  crawlerKind,
  dayKey,
  daysBetween,
  guideIdFromPath,
  shiftDay,
  type RangeDays,
} from "utils/analytics";

/**
 * Reading the analytics: the per-day roll-up and the dashboard's queries.
 *
 * Plain server functions, deliberately not server actions: a "use server"
 * export is a public endpoint, and these return traffic data. Only server
 * components call them, after checking the viewer is a teacher.
 */

const ZERO: DayTotals = { views: 0, visitors: 0, crawlerHits: 0 };

/**
 * A finished day isn't rolled up until this long after midnight, so a page
 * view still being written when the day ended is not left out of its total.
 */
const SETTLE_MS = 10 * 60 * 1000;

/**
 * Per-day totals from the raw rows. Grouping on (day, visitor) first makes
 * each visitor count once per day however many pages they read.
 */
const totalsByDay = async (
  match: Record<string, unknown>
): Promise<Map<string, DayTotals>> => {
  const rows = await Pageview.aggregate<DayTotals & { _id: string }>([
    { $match: match },
    {
      $group: {
        _id: {
          day: "$day",
          visitor: "$visitor",
          isBot: { $ne: [{ $ifNull: ["$bot", null] }, null] },
        },
        hits: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.day",
        views: { $sum: { $cond: ["$_id.isBot", 0, "$hits"] } },
        visitors: { $sum: { $cond: ["$_id.isBot", 0, 1] } },
        crawlerHits: { $sum: { $cond: ["$_id.isBot", "$hits", 0] } },
      },
    },
  ]);
  return new Map(
    rows.map(({ _id, views, visitors, crawlerHits }) => [
      _id,
      { views, visitors, crawlerHits },
    ])
  );
};

/**
 * Store totals for every finished day that has raw rows and no roll-up yet.
 * Idempotent and cheap when there is nothing to do, so every read of the
 * dashboard (and the teacher home card) calls it — that is what keeps the
 * long-term totals filled in without a cron job. A day that nobody looked at
 * for RETENTION_DAYS would be lost; with teachers on the home page daily,
 * that does not happen.
 *
 * Only days the TTL monitor cannot have started on are rolled up, so a total
 * is never taken from a half-expired day.
 */
export async function rollUpFinishedDays(now = new Date()): Promise<number> {
  const settledToday = dayKey(new Date(now.getTime() - SETTLE_MS));
  const oldest = shiftDay(dayKey(now), -(RETENTION_DAYS - 1));

  const done = await DailyStat.distinct("day", {
    day: { $gte: oldest, $lt: settledToday },
  });
  const totals = await totalsByDay({
    day: { $gte: oldest, $lt: settledToday, $nin: done },
  });
  if (totals.size === 0) return 0;

  await DailyStat.bulkWrite(
    [...totals].map(([day, values]) => ({
      updateOne: {
        filter: { day },
        update: { $set: values },
        upsert: true,
      },
    }))
  );
  return totals.size;
}

/**
 * Totals for each of `days`: rolled-up days from `dailystats`, anything else
 * (today, yesterday's first minutes, a day with no traffic) counted live.
 */
const dailyTotals = async (days: string[]): Promise<DailyPoint[]> => {
  const stored = await DailyStat.find({ day: { $in: days } })
    .select({ _id: 0, day: 1, views: 1, visitors: 1, crawlerHits: 1 })
    .lean();
  const byDay = new Map<string, DayTotals>(
    stored.map(({ day, views, visitors, crawlerHits }) => [
      day,
      { views, visitors, crawlerHits },
    ])
  );

  const missing = days.filter((day) => !byDay.has(day));
  if (missing.length > 0) {
    const live = await totalsByDay({ day: { $in: missing } });
    live.forEach((values, day) => byDay.set(day, values));
  }

  return days.map((day) => ({ day, ...(byDay.get(day) ?? ZERO) }));
};

const sum = (points: DayTotals[]): DayTotals =>
  points.reduce(
    (total, point) => ({
      views: total.views + point.views,
      visitors: total.visitors + point.visitors,
      crawlerHits: total.crawlerHits + point.crawlerHits,
    }),
    { ...ZERO }
  );

/** The first day anything was recorded, from whichever store reaches further. */
const collectingSince = async (): Promise<string | null> => {
  const [stat, view] = await Promise.all([
    DailyStat.findOne().sort({ day: 1 }).select({ day: 1 }).lean(),
    Pageview.findOne().sort({ day: 1 }).select({ day: 1 }).lean(),
  ]);
  const days = [stat?.day, view?.day].filter((d): d is string => Boolean(d));
  return days.length > 0 ? days.sort()[0] : null;
};

type Grouped = { _id: string | null; views: number; visitors: number };

/** Top `limit` values of one field among people's page views in the range. */
const breakdown = (
  key: unknown,
  from: string,
  to: string,
  limit: number
): Promise<Grouped[]> =>
  Pageview.aggregate<Grouped>([
    { $match: { day: { $gte: from, $lte: to }, bot: null } },
    {
      $group: {
        _id: { key, day: "$day", visitor: "$visitor" },
        views: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.key",
        views: { $sum: "$views" },
        visitors: { $sum: 1 },
      },
    },
    { $sort: { views: -1, _id: 1 } },
    { $limit: limit },
  ] as PipelineStage[]);

const GUIDE_PATH = "^/guides/[0-9a-fA-F]{24}$";

const crawlerRows = async (from: string, to: string): Promise<CrawlerRow[]> => {
  const rows = await Pageview.aggregate<{
    _id: string;
    hits: number;
    guides: string[];
    robots: boolean;
    lastSeen: Date;
  }>([
    { $match: { day: { $gte: from, $lte: to }, bot: { $ne: null } } },
    {
      $group: {
        _id: "$bot",
        hits: { $sum: 1 },
        lastSeen: { $max: "$at" },
        robots: { $max: { $eq: ["$path", "/robots.txt"] } },
        guides: {
          $addToSet: {
            $cond: [
              { $regexMatch: { input: "$path", regex: GUIDE_PATH } },
              "$path",
              "$$REMOVE",
            ],
          },
        },
      },
    },
    { $sort: { hits: -1, _id: 1 } },
  ]);

  return rows.map((row) => ({
    bot: row._id,
    kind: crawlerKind(row._id),
    hits: row.hits,
    guidePages: row.guides.length,
    fetchedRobots: row.robots,
    lastSeen: row.lastSeen.toISOString(),
  }));
};

const recentCrawls = async (from: string, to: string) =>
  Pageview.find({ day: { $gte: from, $lte: to }, bot: { $ne: null } })
    .sort({ at: -1 })
    .limit(30)
    .select({ _id: 0, at: 1, bot: 1, path: 1 })
    .lean();

/** Guide titles for the guide paths in view, so lists read as guides, not ids. */
const guideTitles = async (paths: string[]): Promise<Map<string, string>> => {
  const ids = [...new Set(paths.map(guideIdFromPath))].filter(
    (id): id is string => id !== null
  );
  if (ids.length === 0) return new Map();
  const guides = await Guide.find({ _id: { $in: ids } })
    .select({ title: 1 })
    .lean();
  return new Map(guides.map((g) => [`/guides/${String(g._id)}`, g.title]));
};

const PAGE_NAMES: Record<string, string> = {
  "/": "Landing page",
  "/guides": "Guide list",
  "/showcase": "Showcase",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string | null) => {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const DEVICE_NAMES: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
};

const toRow = (
  { _id, views, visitors }: Grouped,
  label: string,
  detail?: string
): BreakdownRow => ({
  key: _id,
  label,
  ...(detail ? { detail } : {}),
  views,
  visitors,
});

export async function getAnalyticsDashboard(
  range: RangeDays,
  now = new Date()
): Promise<AnalyticsDashboard> {
  await connectToDatabase();
  await rollUpFinishedDays(now);

  const to = dayKey(now);
  const from = shiftDay(to, -(range - 1));
  const previousFrom = shiftDay(from, -range);

  const [
    series,
    previousSeries,
    since,
    pages,
    sources,
    countries,
    devices,
    crawlers,
    crawls,
    guideCount,
  ] = await Promise.all([
    dailyTotals(daysBetween(from, to)),
    dailyTotals(daysBetween(previousFrom, shiftDay(from, -1))),
    collectingSince(),
    breakdown("$path", from, to, 15),
    // A campaign tag says where a link was placed on purpose; it wins over
    // whatever referrer the browser happened to send.
    breakdown({ $ifNull: ["$source", "$referrer"] }, from, to, 10),
    breakdown("$country", from, to, 10),
    breakdown("$device", from, to, 3),
    crawlerRows(from, to),
    recentCrawls(from, to),
    Guide.countDocuments(),
  ]);

  const titles = await guideTitles([
    ...pages.map((p) => p._id ?? ""),
    ...crawls.map((c) => c.path),
  ]);

  return {
    range,
    from,
    to,
    totals: sum(series),
    // Only compare against a period we were actually recording through,
    // or the first weeks would all read as "up from nothing".
    previous: since && since <= previousFrom ? sum(previousSeries) : null,
    series,
    pages: pages.map((p) => {
      const path = p._id ?? "";
      const title = titles.get(path);
      return title
        ? toRow(p, title, path)
        : toRow(p, PAGE_NAMES[path] ?? path, PAGE_NAMES[path] ? path : undefined);
    }),
    sources: sources.map((s) => toRow(s, s._id ?? "Direct or unknown")),
    countries: countries.map((c) => toRow(c, countryName(c._id))),
    devices: devices.map((d) => toRow(d, DEVICE_NAMES[d._id ?? ""] ?? "Unknown")),
    crawlers,
    recentCrawls: crawls.map(
      (c): CrawlerFetch => ({
        at: new Date(c.at).toISOString(),
        bot: c.bot ?? "",
        path: c.path,
        ...(titles.has(c.path) ? { label: titles.get(c.path) } : {}),
      })
    ),
    guideCount,
    collectingSince: since,
  };
}

/** Last week's visitors and views, for the card on the teacher home page. */
export async function getAnalyticsHeadline(
  now = new Date()
): Promise<AnalyticsHeadline> {
  const days = 7;
  await connectToDatabase();
  await rollUpFinishedDays(now);
  const to = dayKey(now);
  const [series, since] = await Promise.all([
    dailyTotals(daysBetween(shiftDay(to, -(days - 1)), to)),
    collectingSince(),
  ]);
  const { visitors, views } = sum(series);
  return { days, visitors, views, collectingSince: since };
}
