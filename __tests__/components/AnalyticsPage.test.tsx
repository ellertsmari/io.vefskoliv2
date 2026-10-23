/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { AnalyticsPage } from "../../app/LMS/analytics/AnalyticsPage";
import type { AnalyticsDashboard, DailyPoint } from "types/analyticsTypes";

const day = (d: string, views: number, visitors: number, crawlerHits: number): DailyPoint => ({
  day: d,
  views,
  visitors,
  crawlerHits,
});

const dashboard = (overrides: Partial<AnalyticsDashboard> = {}): AnalyticsDashboard => ({
  range: 7,
  from: "2026-10-17",
  to: "2026-10-23",
  totals: { views: 1500, visitors: 1200, crawlerHits: 40 },
  previous: { views: 1000, visitors: 1200, crawlerHits: 10 },
  series: [
    day("2026-10-17", 100, 80, 2),
    day("2026-10-18", 200, 150, 5),
    day("2026-10-19", 150, 120, 3),
    day("2026-10-20", 300, 250, 10),
    day("2026-10-21", 250, 200, 8),
    day("2026-10-22", 250, 200, 7),
    day("2026-10-23", 250, 200, 5),
  ],
  pages: [
    { key: "/guides/5f13205ab279dc27c467ca56", label: "HTML & CSS", detail: "/guides/5f13205ab279dc27c467ca56", views: 900, visitors: 700 },
    { key: "/guides", label: "Guide list", detail: "/guides", views: 600, visitors: 500 },
  ],
  sources: [{ key: null, label: "Direct or unknown", views: 1000, visitors: 800 }],
  countries: [{ key: "IS", label: "Iceland", views: 1400, visitors: 1100 }],
  devices: [{ key: "mobile", label: "Mobile", views: 900, visitors: 800 }],
  crawlers: [
    { bot: "Googlebot", kind: "search", hits: 30, guidePages: 20, fetchedRobots: true, lastSeen: "2026-10-23T08:00:00.000Z" },
    { bot: "GPTBot", kind: "ai", hits: 10, guidePages: 3, fetchedRobots: false, lastSeen: "2026-10-22T14:05:00.000Z" },
  ],
  recentCrawls: [
    { at: "2026-10-23T08:00:00.000Z", bot: "Googlebot", path: "/guides/5f13205ab279dc27c467ca56", label: "HTML & CSS" },
  ],
  guideCount: 42,
  collectingSince: "2026-09-01",
  ...overrides,
});

describe("AnalyticsPage", () => {
  it("leads with the totals and how they changed", () => {
    render(<AnalyticsPage dashboard={dashboard()} />);

    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("▲ 50% vs the previous 7 days")).toBeInTheDocument();
    expect(screen.getByText("Same as the previous 7 days")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Last 7 days" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Last 90 days" })).toHaveAttribute("href", "/LMS/analytics?days=90");
  });

  it("does not invent a comparison before there is an earlier period", () => {
    render(<AnalyticsPage dashboard={dashboard({ previous: null, collectingSince: "2026-10-20" })} />);

    expect(screen.getAllByText("No earlier period to compare yet")).toHaveLength(3);
    expect(screen.getByText(/Recording started on Tue 20 Oct/)).toBeInTheDocument();
  });

  it("lists guides by title, linked to the page", () => {
    render(<AnalyticsPage dashboard={dashboard()} />);
    const link = screen.getByRole("link", { name: "HTML & CSS" });
    expect(link).toHaveAttribute("href", "/guides/5f13205ab279dc27c467ca56");
  });

  it("puts AI crawlers first and shows guide coverage", () => {
    render(<AnalyticsPage dashboard={dashboard()} />);
    const table = screen.getByRole("table", { name: "Crawlers that fetched public pages" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("GPTBot")).toBeInTheDocument();
    expect(within(rows[0]).getByText("3 of 42")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Googlebot")).toBeInTheDocument();
  });

  it("has every daily number in a table, not only in the chart", () => {
    render(<AnalyticsPage dashboard={dashboard()} />);
    fireEvent.click(screen.getByText("Show as a table"));
    const table = screen.getByRole("table", { name: "Visitors, page views and crawler fetches per day" });
    expect(within(table).getAllByRole("row")).toHaveLength(8);
    expect(within(table).getByText("Fri 23 Oct")).toBeInTheDocument();
  });

  it("reads a day's values with the keyboard", () => {
    render(<AnalyticsPage dashboard={dashboard()} />);
    const chart = screen.getByLabelText(/^Visitors and page views per day, .* Use the arrow keys/);
    fireEvent.focus(chart);
    expect(within(chart).getByText("Fri 23 Oct")).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    expect(within(chart).getByText("Thu 22 Oct")).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: "Home" });
    expect(within(chart).getByText("Sat 17 Oct")).toBeInTheDocument();
    expect(within(chart).getByText("80")).toBeInTheDocument();
  });

  it("explains an empty dashboard", () => {
    render(
      <AnalyticsPage
        dashboard={dashboard({
          totals: { views: 0, visitors: 0, crawlerHits: 0 },
          previous: null,
          series: [day("2026-10-23", 0, 0, 0)],
          pages: [],
          sources: [],
          countries: [],
          devices: [],
          crawlers: [],
          recentCrawls: [],
          collectingSince: null,
        })}
      />
    );
    expect(screen.getByText(/Nothing has been recorded yet/)).toBeInTheDocument();
    expect(screen.getAllByText("Nothing recorded in this range yet.")).toHaveLength(4);
    expect(screen.getByText("No crawler has visited in this range yet.")).toBeInTheDocument();
  });
});
