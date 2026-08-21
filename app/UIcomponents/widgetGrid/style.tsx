"use client";
import styled from "styled-components";

/**
 * Dashboard layout as a 12-column grid rather than fixed left/right columns.
 * Adding a widget means dropping in one more <Widget $span={n}> — no reshuffling
 * of column containers, and the row packing sorts itself out.
 *
 * Below the breakpoint everything stacks, so spans only apply once there is
 * genuinely room to sit side by side.
 */
export const WIDGET_GRID_BREAKPOINT = "1000px";

export const WidgetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
  width: 100%;

  @media (min-width: ${WIDGET_GRID_BREAKPOINT}) {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
`;

export const Widget = styled.section<{ $span?: number }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1.25rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);

  @media (min-width: ${WIDGET_GRID_BREAKPOINT}) {
    grid-column: span ${({ $span = 4 }) => $span};
  }
`;

/** Title + optional subtitle, with the spacing a widget header needs. */
export const WidgetHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 1rem;
`;

export const WidgetTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
`;

export const WidgetSubtitle = styled.p`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  margin: 0;
`;

/** Header with no subtitle under it — used by the compact widgets. */
export const WidgetTitleOnly = styled(WidgetTitle)`
  margin-bottom: 1rem;
`;
