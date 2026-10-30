import type { CrawlerKind, RangeDays } from "utils/analytics";

/** Shapes the analytics dashboard is rendered from. All plain JSON. */

export type DayTotals = {
  /** Page views by people. */
  views: number;
  /** Sum of each day's distinct visitors — see AnalyticsDashboard.totals. */
  visitors: number;
  crawlerHits: number;
};

export type DailyPoint = DayTotals & { day: string };

/** One row of a "top N" list. */
export type BreakdownRow = {
  /** What was grouped on: a path, a host, a country code. Null = unknown. */
  key: string | null;
  /** What to show: a guide title instead of its path, a country name. */
  label: string;
  /** Secondary line, e.g. the path under a guide's title. */
  detail?: string;
  views: number;
  visitors: number;
};

export type CrawlerRow = {
  bot: string;
  kind: CrawlerKind;
  hits: number;
  /** Distinct /guides/<id> pages it fetched in the range. */
  guidePages: number;
  /** Whether it asked for /robots.txt in the range. */
  fetchedRobots: boolean;
  lastSeen: string;
  /** For unnamed groups ("Other bot", "Script"…): the names behind them. */
  agents: CrawlerAgent[];
};

/** What an unnamed bot called itself, and how often it came. */
export type CrawlerAgent = { name: string; hits: number };

export type CrawlerFetch = {
  at: string;
  bot: string;
  /** The bot's own name, when it is one we don't name. */
  agent?: string;
  path: string;
  /** Guide title when the path is a guide. */
  label?: string;
};

export type AnalyticsDashboard = {
  range: RangeDays;
  from: string;
  to: string;
  /**
   * Over the whole range. Visitor ids change every day, so `visitors` is the
   * sum of daily visitors: someone who came on three days counts three times.
   * Counting them once would need an id that lasts — exactly what this
   * design refuses to store.
   */
  totals: DayTotals;
  /** The range before this one, when there is data that far back. */
  previous: DayTotals | null;
  series: DailyPoint[];
  pages: BreakdownRow[];
  sources: BreakdownRow[];
  countries: BreakdownRow[];
  devices: BreakdownRow[];
  crawlers: CrawlerRow[];
  recentCrawls: CrawlerFetch[];
  /** Guides in the database, for "fetched N of M guides". */
  guideCount: number;
  /** First day anything was recorded; null before the first hit. */
  collectingSince: string | null;
};

/** The one line the teacher home page shows. */
export type AnalyticsHeadline = {
  days: number;
  visitors: number;
  views: number;
  collectingSince: string | null;
};
