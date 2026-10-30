"use client";
import Link from "next/link";
import styled from "styled-components";

/** Series colours. Validated as a pair (CVD and contrast) on white. */
export const SERIES = {
  visitors: "var(--accent-blue-100)",
  views: "var(--accent-teal-100)",
  crawlers: "var(--accent-violet-100)",
} as const;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

/** The range presets: one row above everything they scope. */
export const RangeNav = styled.nav`
  display: inline-flex;
  padding: 0.2rem;
  gap: 0.2rem;
  background: var(--primary-black-5);
  border-radius: var(--radius-md);
`;

export const RangeLink = styled(Link)`
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--primary-black-60);
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: var(--primary-black-100);
  }

  &[aria-current="page"] {
    background: var(--primary-white);
    color: var(--primary-black-100);
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;

export const Notice = styled.p`
  margin: 0;
  padding: 0.85rem 1rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  background: var(--primary-black-5);
  border-radius: var(--radius-md);
`;

// ---------------------------------------------------------------- stat tiles

export const TileRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1rem;
`;

export const Tile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.1rem 1.25rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
`;

export const TileLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

/** Proportional figures: tabular digits look loose at this size. */
export const TileValue = styled.span<{ $hero?: boolean }>`
  font-size: ${({ $hero }) => ($hero ? "3rem" : "var(--text-3xl)")};
  font-weight: 600;
  line-height: 1.1;
  color: var(--primary-black-100);
`;

export const TileDelta = styled.span<{ $direction: "up" | "down" | "flat" }>`
  font-size: var(--text-sm);
  color: ${({ $direction }) =>
    $direction === "up"
      ? "var(--error-success-100)"
      : $direction === "down"
        ? "var(--error-failure-100)"
        : "var(--primary-black-60)"};
`;

// ---------------------------------------------------------------- charts

export const ChartFrame = styled.div`
  position: relative;
  width: 100%;

  svg {
    display: block;
    overflow: visible;
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 4px;
    border-radius: var(--radius-sm);
  }
`;

export const AxisText = styled.text`
  font-size: 11px;
  fill: var(--primary-black-60);
  font-variant-numeric: tabular-nums;
`;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0 0 0.75rem 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

/** A short stroke of the series colour: lines are keyed with lines. */
export const LineKey = styled.span<{ $color: string }>`
  display: inline-block;
  width: 14px;
  height: 2px;
  border-radius: 1px;
  background: ${({ $color }) => $color};
`;

export const Tooltip = styled.div`
  position: absolute;
  top: 0;
  pointer-events: none;
  min-width: 9rem;
  padding: 0.5rem 0.65rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: var(--text-sm);
  z-index: 1;
`;

export const TooltipTitle = styled.div`
  margin-bottom: 0.3rem;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  strong {
    font-variant-numeric: tabular-nums;
    color: var(--primary-black-100);
  }

  span:last-child {
    color: var(--primary-black-60);
  }
`;

export const TableToggle = styled.details`
  margin-top: 0.75rem;
  font-size: var(--text-sm);

  summary {
    cursor: pointer;
    color: var(--primary-black-60);
    width: fit-content;
  }

  summary:hover {
    color: var(--primary-black-100);
  }

  &[open] summary {
    margin-bottom: 0.5rem;
  }
`;

// ---------------------------------------------------------------- tables

export const ScrollBox = styled.div<{ $maxHeight?: string }>`
  overflow: auto;
  max-height: ${({ $maxHeight }) => $maxHeight ?? "none"};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);

  th {
    padding: 0 0.5rem 0.5rem 0;
    text-align: left;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--primary-black-60);
    white-space: nowrap;
  }

  td {
    padding: 0.45rem 0.5rem 0.45rem 0;
    border-top: 1px solid var(--primary-black-5);
    vertical-align: top;
  }

  th.num,
  td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding-right: 0;
    padding-left: 0.75rem;
  }
`;

export const RowLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;

  a,
  span.label {
    color: var(--primary-black-100);
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  a:hover {
    text-decoration: underline;
  }
`;

export const RowDetail = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  overflow-wrap: anywhere;
`;

/** Magnitude bar under a row's label: one hue on a lighter step of itself. */
export const BarTrack = styled.div`
  height: 6px;
  margin-top: 0.3rem;
  border-radius: 3px;
  background: var(--accent-blue-10);
  overflow: hidden;
`;

export const BarFill = styled.div`
  height: 100%;
  border-radius: 3px;
  background: var(--accent-blue-100);
`;

export const Empty = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const KindChip = styled.span`
  display: inline-block;
  padding: 0.05rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--primary-black-5);
  color: var(--primary-black-60);
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
`;

export const SubHeading = styled.h3`
  margin: 1.25rem 0 0.5rem 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const Footnote = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--primary-black-60);
  max-width: 70ch;
`;

/** A table caption for screen readers; the widget title says it visually. */
export const HiddenCaption = styled.caption`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
