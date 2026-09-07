"use client";
import styled, { css } from "styled-components";
import Link from "next/link";

/**
 * The tile vocabulary the guide page is built from — a card with an icon
 * chip and a title in its head, and a scrolling body — shared with the
 * guide editor so a teacher edits the same board a student reads. Layout
 * (where a tile sits, whether it drags) belongs to the caller.
 */

/** The card itself: plain surface, the icon is the only colour it carries. */
export const tileSurface = css`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  }
`;

export const TileHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid var(--primary-black-10);
  flex-shrink: 0;
`;

/** The one place a section's colour appears: a tinted chip with a coloured glyph. */
export const TileIcon = styled.span<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: ${({ $accent }) => `var(--accent-${$accent}-10)`};
  color: ${({ $accent }) => `var(--accent-${$accent}-text)`};

  svg {
    width: 1.1rem;
    height: 1.1rem;
  }
`;

export const TileTitle = styled.h2`
  flex: 1;
  min-width: 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TileBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.85rem;
  scrollbar-width: thin;
`;

/** A quiet icon button in a tile head: minimise, expand, and the like. */
export const TileIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--primary-black-30);
  cursor: pointer;

  &:hover {
    background: var(--primary-black-5);
    color: var(--primary-black-100);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const SubSectionHeading = styled.h3`
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-black-60);
  margin: 0 0 0.35rem 0;

  &:not(:first-child) {
    margin-top: 1rem;
  }
`;

/** Module name above the guide title — context, not a heading of its own. */
export const Eyebrow = styled.p`
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary-black-60);
  margin: 0;
`;

/**
 * Small pill controls for a board's toolbar, styled like the rest of the
 * app's small controls rather than as underlined text. `$active` is a
 * pressed state.
 */
export const toolStyles = css<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid
    ${({ $active }) =>
      $active ? "var(--theme-module3-60)" : "var(--primary-black-10)"};
  background: ${({ $active }) =>
    $active ? "var(--theme-module3-10)" : "var(--primary-white)"};
  color: ${({ $active }) =>
    $active ? "var(--theme-module3-hover)" : "var(--primary-black-60)"};
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? "var(--theme-module3-10)" : "var(--primary-black-5)"};
    color: ${({ $active }) =>
      $active ? "var(--theme-module3-hover)" : "var(--primary-black-100)"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  }
`;

export const ToolButton = styled.button<{ $active?: boolean }>`
  ${toolStyles}
`;

export const ToolLink = styled(Link)<{ $active?: boolean }>`
  ${toolStyles}
`;

/** The same pill as a plain anchor, for links that open a new tab. */
export const ToolAnchor = styled.a<{ $active?: boolean }>`
  ${toolStyles}
`;
