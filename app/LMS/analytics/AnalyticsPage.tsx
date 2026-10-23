"use client";

import type { AnalyticsDashboard } from "types/analyticsTypes";
import {
  PageContainer,
  PageSubtitle,
  PageTitle,
  TitleBlock,
} from "globalStyles/pageStyles";
import { Widget, WidgetRow } from "UIcomponents/widgetGrid/style";
import { WidgetHeading } from "UIcomponents/widgetGrid/WidgetHeading";
import { RANGE_OPTIONS, RETENTION_DAYS } from "utils/analytics";
import { BreakdownTable } from "./BreakdownTable";
import { ColumnChart, TrendChart, type LineSeries } from "./Charts";
import { CrawlerTable, RecentCrawls } from "./CrawlerPanel";
import {
  formatCount,
  formatDay,
  formatDayLong,
  percentChange,
  plural,
} from "./format";
import {
  CrawlerIcon,
  DeviceIcon,
  GlobeIcon,
  LinkIcon,
  PageIcon,
  TrendIcon,
} from "./icons";
import {
  Footnote,
  HeaderRow,
  HiddenCaption,
  Notice,
  RangeLink,
  RangeNav,
  SERIES,
  SubHeading,
  Table,
  TableToggle,
  Tile,
  TileDelta,
  TileLabel,
  TileRow,
  TileValue,
} from "./style";

const TREND_SERIES: LineSeries[] = [
  { key: "visitors", label: "Visitors", color: SERIES.visitors, area: true },
  { key: "views", label: "Page views", color: SERIES.views },
];

/**
 * A headline number with its change against the period before. When there is
 * no earlier period on record, it says so rather than showing a fake "+100%".
 */
const StatTile = ({
  label,
  value,
  previous,
  range,
  hero = false,
  neutral = false,
}: {
  label: string;
  value: number;
  previous: number | undefined;
  range: number;
  hero?: boolean;
  /** Up is neither good nor bad (crawler fetches): no green or red. */
  neutral?: boolean;
}) => {
  const period = `the previous ${range} days`;
  let delta: { text: string; direction: "up" | "down" | "flat" };
  if (previous === undefined) {
    delta = { text: "No earlier period to compare yet", direction: "flat" };
  } else {
    const change = percentChange(value, previous);
    if (change === null) {
      delta = {
        text: value > 0 ? `Up from 0 in ${period}` : `Also 0 in ${period}`,
        direction: value > 0 ? "up" : "flat",
      };
    } else if (change === 0) {
      delta = { text: `Same as ${period}`, direction: "flat" };
    } else {
      delta = {
        text: `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}% vs ${period}`,
        direction: change > 0 ? "up" : "down",
      };
    }
  }

  return (
    <Tile>
      <TileLabel>{label}</TileLabel>
      <TileValue $hero={hero}>{formatCount(value)}</TileValue>
      <TileDelta $direction={neutral ? "flat" : delta.direction}>
        {delta.text}
      </TileDelta>
    </Tile>
  );
};

export const AnalyticsPage = ({ dashboard }: { dashboard: AnalyticsDashboard }) => {
  const {
    range,
    from,
    to,
    totals,
    previous,
    series,
    pages,
    sources,
    countries,
    devices,
    crawlers,
    recentCrawls,
    guideCount,
    collectingSince,
  } = dashboard;

  const span = `${formatDay(from)} – ${formatDay(to)}`;

  return (
    <PageContainer $width="wide">
      <HeaderRow>
        <TitleBlock>
          <PageTitle>Site analytics</PageTitle>
          <PageSubtitle>
            People and crawlers on the public pages, {span}
          </PageSubtitle>
        </TitleBlock>
        <RangeNav aria-label="Date range">
          {RANGE_OPTIONS.map((days) => (
            <RangeLink
              key={days}
              href={`/LMS/analytics?days=${days}`}
              aria-current={days === range ? "page" : undefined}
              scroll={false}
              replace
            >
              Last {days} days
            </RangeLink>
          ))}
        </RangeNav>
      </HeaderRow>

      {!collectingSince ? (
        <Notice>
          Nothing has been recorded yet. Counting starts with the first
          logged-out visit after this was deployed — open a guide in a private
          window to see one appear.
        </Notice>
      ) : (
        collectingSince > from && (
          <Notice>
            Recording started on {formatDayLong(collectingSince)}, so the days
            before that are empty, not quiet.
          </Notice>
        )
      )}

      <TileRow>
        <StatTile
          label="Visitors"
          value={totals.visitors}
          previous={previous?.visitors}
          range={range}
          hero
        />
        <StatTile
          label="Page views"
          value={totals.views}
          previous={previous?.views}
          range={range}
        />
        <StatTile
          label="Crawler fetches"
          value={totals.crawlerHits}
          previous={previous?.crawlerHits}
          range={range}
          neutral
        />
      </TileRow>

      <Widget>
        <WidgetHeading
          title="Visitors and page views per day"
          accent="blue"
          icon={<TrendIcon />}
          help={
            <>
              A visitor is one browser on one day. The id behind it changes
              every day, so someone who comes back tomorrow counts again —
              that is what lets this run without cookies or a consent banner.
              The total visitors above is the sum of the days. Logged-in
              students and teachers are never counted.
            </>
          }
        />
        <TrendChart
          points={series}
          series={TREND_SERIES}
          summary={`Visitors and page views per day, ${span}: ${plural(totals.visitors, "visitor")} and ${plural(totals.views, "page view")} in total.`}
        />
        <TableToggle>
          <summary>Show as a table</summary>
          <Table>
            <HiddenCaption>Visitors, page views and crawler fetches per day</HiddenCaption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col" className="num">Visitors</th>
                <th scope="col" className="num">Page views</th>
                <th scope="col" className="num">Crawler fetches</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((point) => (
                <tr key={point.day}>
                  <td>{formatDayLong(point.day)}</td>
                  <td className="num">{formatCount(point.visitors)}</td>
                  <td className="num">{formatCount(point.views)}</td>
                  <td className="num">{formatCount(point.crawlerHits)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableToggle>
      </Widget>

      <WidgetRow>
        <Widget>
          <WidgetHeading
            title="Top pages"
            accent="teal"
            icon={<PageIcon />}
            help="Pages people opened, most viewed first. Guides are shown by title. Visitors counts each person once per day."
          />
          <BreakdownTable
            rows={pages}
            heading="Page"
            caption="Most viewed public pages"
            linkPaths
          />
        </Widget>

        <Widget>
          <WidgetHeading
            title="Sources"
            accent="amber"
            icon={<LinkIcon />}
            help={
              <>
                Where people came from: the campaign tag on the link
                (?utm_source=…) when it had one, otherwise the site that
                linked here. &ldquo;Direct or unknown&rdquo; is typed-in
                addresses, bookmarks, apps, and sites that send no referrer.
              </>
            }
          />
          <BreakdownTable
            rows={sources}
            heading="Source"
            caption="Where visitors came from"
          />
        </Widget>
      </WidgetRow>

      <WidgetRow>
        <Widget>
          <WidgetHeading
            title="Countries"
            accent="green"
            icon={<GlobeIcon />}
            help="From Vercel's location lookup of the visitor's address at the time of the visit. The address itself is never stored."
          />
          <BreakdownTable
            rows={countries}
            heading="Country"
            caption="Visitors by country"
          />
        </Widget>

        <Widget>
          <WidgetHeading
            title="Devices"
            accent="rose"
            icon={<DeviceIcon />}
            help="Read from the browser's description of itself. iPads describe themselves as Macs, so they are counted as desktops."
          />
          <BreakdownTable
            rows={devices}
            heading="Device"
            caption="Visitors by device"
          />
        </Widget>
      </WidgetRow>

      <Widget>
        <WidgetHeading
          title="Crawlers"
          accent="violet"
          icon={<CrawlerIcon />}
          help={
            <>
              Search engines, AI crawlers and link previews fetching public
              pages. GPTBot, ClaudeBot and PerplexityBot do not run
              JavaScript, so they only see what the server sends: this panel
              is how to tell whether the guides are readable to them.
              Requests for robots.txt are recorded too.
            </>
          }
        />
        <ColumnChart
          points={series}
          valueKey="crawlerHits"
          label="Crawler fetches"
          color={SERIES.crawlers}
          summary={`Crawler fetches per day, ${span}: ${plural(totals.crawlerHits, "fetch", "fetches")} in total.`}
        />
        <SubHeading>Who came</SubHeading>
        <CrawlerTable crawlers={crawlers} guideCount={guideCount} />
        <RecentCrawls crawls={recentCrawls} />
      </Widget>

      <Footnote>
        Counted: logged-out page loads and in-app navigation on the landing
        page, the guides, the showcase and handouts. Not counted: anyone logged
        in, link prefetches, the sign-in page and judge links. No cookies, IP
        addresses or browser strings are stored; visitor ids are made with a
        salt that is deleted at the end of each day. Individual views are kept
        for {RETENTION_DAYS} days, daily totals for good. Days are UTC
        (Iceland time).
      </Footnote>
    </PageContainer>
  );
};
