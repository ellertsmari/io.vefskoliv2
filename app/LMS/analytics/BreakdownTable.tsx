"use client";

import type { BreakdownRow } from "types/analyticsTypes";
import { formatCount } from "./format";
import {
  BarFill,
  BarTrack,
  Empty,
  HiddenCaption,
  RowDetail,
  RowLabel,
  Table,
} from "./style";

/**
 * A "top N" list as a table: name, a magnitude bar, and the two counts.
 * A table rather than a bar chart because the names are long (guide titles)
 * and the exact numbers matter more than the shape.
 */
export const BreakdownTable = ({
  rows,
  caption,
  heading,
  linkPaths = false,
}: {
  rows: BreakdownRow[];
  /** For screen readers: what the table lists. */
  caption: string;
  /** Header of the first column. */
  heading: string;
  /** Rows are site paths: link them, opening in a new tab. */
  linkPaths?: boolean;
}) => {
  if (rows.length === 0) {
    return <Empty>Nothing recorded in this range yet.</Empty>;
  }
  const max = Math.max(...rows.map((r) => r.views));

  return (
    <Table>
      <HiddenCaption>{caption}</HiddenCaption>
      <thead>
        <tr>
          <th scope="col">{heading}</th>
          <th scope="col" className="num">Views</th>
          <th scope="col" className="num">Visitors</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const path = row.detail ?? row.key ?? "";
          return (
            <tr key={row.key ?? "unknown"}>
              <td>
                <RowLabel>
                  {linkPaths && path.startsWith("/") ? (
                    <a href={path} target="_blank" rel="noopener noreferrer">
                      {row.label}
                    </a>
                  ) : (
                    <span className="label">{row.label}</span>
                  )}
                  {row.detail && <RowDetail>{row.detail}</RowDetail>}
                </RowLabel>
                <BarTrack aria-hidden="true">
                  <BarFill style={{ width: `${(row.views / max) * 100}%` }} />
                </BarTrack>
              </td>
              <td className="num">{formatCount(row.views)}</td>
              <td className="num">{formatCount(row.visitors)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
