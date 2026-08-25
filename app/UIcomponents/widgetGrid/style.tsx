"use client";
import styled from "styled-components";

/**
 * Dashboard layout: a fluid work column beside a fixed-width status rail.
 *
 * The rail is a fixed size rather than a fraction, so extra screen width all
 * goes to the work column, where the card grids turn it into more columns.
 * A proportional rail would just stretch progress bars over empty space.
 *
 * Below the breakpoint the two bands stack, work first.
 */
export const WIDGET_GRID_BREAKPOINT = "1000px";

/** Wide enough for a module label and a progress bar, narrow enough to scan. */
export const WIDGET_RAIL_WIDTH = "21rem";

export const WidgetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
  width: 100%;

  @media (min-width: ${WIDGET_GRID_BREAKPOINT}) {
    grid-template-columns: minmax(0, 1fr) ${WIDGET_RAIL_WIDTH};
  }
`;

export const Widget = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1.25rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
`;

/** A widget that ignores the bands and runs the full width of the grid. */
export const WidgetFullWidth = styled(Widget)`
  @media (min-width: ${WIDGET_GRID_BREAKPOINT}) {
    grid-column: 1 / -1;
  }
`;

/**
 * A stack of widgets filling one band of the grid. Keeps a group at a shared
 * width with a stable top edge, instead of each widget being pushed around by
 * whatever happens to sit above it.
 */
export const WidgetColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
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
