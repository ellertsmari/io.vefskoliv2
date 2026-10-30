"use client";

import type { CrawlerFetch, CrawlerRow } from "types/analyticsTypes";
import type { CrawlerKind } from "utils/analytics";
import { formatCount, formatDateTime } from "./format";
import {
  Empty,
  HiddenCaption,
  KindChip,
  RowDetail,
  RowLabel,
  ScrollBox,
  SubHeading,
  Table,
} from "./style";

const KIND_LABELS: Record<CrawlerKind, string> = {
  ai: "AI",
  search: "Search",
  social: "Link preview",
  seo: "SEO tool",
  other: "Other",
};

/** AI and search first: they are what the guides are trying to be found by. */
const KIND_ORDER: CrawlerKind[] = ["ai", "search", "social", "seo", "other"];

export const CrawlerTable = ({
  crawlers,
  guideCount,
}: {
  crawlers: CrawlerRow[];
  guideCount: number;
}) => {
  if (crawlers.length === 0) {
    return <Empty>No crawler has visited in this range yet.</Empty>;
  }
  const sorted = [...crawlers].sort(
    (a, b) =>
      KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.hits - a.hits
  );

  return (
    <ScrollBox>
      <Table>
        <HiddenCaption>Crawlers that fetched public pages</HiddenCaption>
        <thead>
          <tr>
            <th scope="col">Crawler</th>
            <th scope="col">Kind</th>
            <th scope="col" className="num">Fetches</th>
            <th scope="col" className="num">Guides fetched</th>
            <th scope="col" className="num">robots.txt</th>
            <th scope="col" className="num">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((crawler) => (
            <tr key={crawler.bot}>
              <td>
                <RowLabel>
                  <span className="label">{crawler.bot}</span>
                </RowLabel>
              </td>
              <td>
                <KindChip>{KIND_LABELS[crawler.kind]}</KindChip>
              </td>
              <td className="num">{formatCount(crawler.hits)}</td>
              <td className="num">
                {formatCount(crawler.guidePages)} of {formatCount(guideCount)}
              </td>
              <td className="num">{crawler.fetchedRobots ? "Yes" : "No"}</td>
              <td className="num">{formatDateTime(crawler.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ScrollBox>
  );
};

export const RecentCrawls = ({ crawls }: { crawls: CrawlerFetch[] }) => {
  if (crawls.length === 0) return null;
  return (
    <>
      <SubHeading>Latest fetches</SubHeading>
      <ScrollBox $maxHeight="22rem">
        <Table>
          <HiddenCaption>The most recent pages fetched by crawlers</HiddenCaption>
          <thead>
            <tr>
              <th scope="col">When (UTC)</th>
              <th scope="col">Crawler</th>
              <th scope="col">Page</th>
            </tr>
          </thead>
          <tbody>
            {crawls.map((crawl, i) => (
              <tr key={`${crawl.at}-${crawl.bot}-${i}`}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(crawl.at)}</td>
                <td>{crawl.bot}</td>
                <td>
                  <RowLabel>
                    <span className="label">{crawl.label ?? crawl.path}</span>
                    {crawl.label && <RowDetail>{crawl.path}</RowDetail>}
                  </RowLabel>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollBox>
    </>
  );
};
