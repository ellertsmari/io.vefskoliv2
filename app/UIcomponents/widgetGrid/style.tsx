"use client";
import styled from "styled-components";

export const WIDGET_GRID_BREAKPOINT = "1000px";

/**
 * Dashboard layout: one full-width stack, top to bottom.
 *
 * This used to be a work column beside a status rail, which put progress and
 * grades off to one side. Reading order is now simply page order, so whatever
 * needs to be seen first goes first.
 */
export const WidgetGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

/**
 * Widgets side by side, sharing the width equally, wrapping to a stack when
 * there isn't room for them. auto-fit rather than a fixed column count so a
 * row of two doesn't become two narrow slivers on a laptop.
 */
export const WidgetRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
  gap: 1.5rem;
  align-items: start;
  width: 100%;
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

/**
 * Icon, then title and subtitle. Same shape as a guide tile's header, and the
 * icon chip is the only place a widget carries colour — the surface itself
 * stays a plain white card so a page of widgets reads as one system.
 */
export const WidgetIcon = styled.span<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: ${({ $accent }) => `var(--accent-${$accent}-10)`};
  color: ${({ $accent }) => `var(--accent-${$accent}-text)`};

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

/**
 * Opens the widget's explanation. Quiet by default: the description is useful
 * the first week and noise thereafter, so it earns a click rather than a
 * permanent two lines under every title.
 */
export const WidgetHelpButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--primary-black-10);
  background: var(--primary-white);
  color: var(--primary-black-30);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;

  &:hover,
  &[aria-expanded="true"] {
    border-color: var(--primary-black-30);
    background: var(--primary-black-5);
    color: var(--primary-black-100);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;

export const WidgetHelpText = styled.p`
  margin: 0.15rem 0 0 0;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

/**
 * Controls pinned to the right of a header. The question mark comes last, so
 * it lands in the same corner on every widget whether or not there is anything
 * beside it.
 */
export const WidgetHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

/** The stacked text beside the icon. */
export const WidgetHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
`;

/** Icon beside the text block, with the spacing a widget header needs. */
export const WidgetHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
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
