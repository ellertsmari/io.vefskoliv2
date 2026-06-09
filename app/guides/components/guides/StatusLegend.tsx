"use client";
import styled from "styled-components";

const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  align-items: center;
  padding: 0.25rem 0 0.75rem 0;
  font-size: 0.8rem;
  color: #444;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const Swatch = styled.span<{ $color: string }>`
  width: 0.8rem;
  height: 0.8rem;
  flex: 0 0 auto;
  border-radius: 3px;
  border: 2px solid ${({ $color }) => $color};
  background: transparent;
`;

/**
 * Explains the card border colors. Color is never the ONLY signal (cards also
 * show status text + icons), but the legend gives students the mapping at a
 * glance without opening each card.
 */
export const StatusLegend = () => (
  <LegendRow aria-label="Guide status color legend">
    <LegendItem>
      <Swatch $color="var(--error-warning-100)" />
      Action needed — review a classmate
    </LegendItem>
    <LegendItem>
      <Swatch $color="var(--error-success-100)" />
      Returned / passed
    </LegendItem>
    <LegendItem>
      <Swatch $color="var(--error-failure-100)" />
      Didn&apos;t pass yet — improve &amp; resubmit
    </LegendItem>
    <LegendItem>
      <Swatch $color="var(--theme-module3-100)" />
      Hall of fame
    </LegendItem>
  </LegendRow>
);
