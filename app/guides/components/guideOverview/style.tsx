"use client";
import styled from "styled-components";
import { PageContainer } from "globalStyles/pageStyles";

const MOBILE = "700px";

export { PageTitle, TitleBlock } from "globalStyles/pageStyles";

/** Full width — the canvas should use the whole desk, not a 1200px column. */
export const Shell = styled(PageContainer).attrs({ $width: "full" as const })`
  height: 100%;
  min-height: 0;
  gap: 1rem;
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  flex-wrap: wrap;
`;

/**
 * Section chips and canvas buttons share one row to the right of the title,
 * which is otherwise empty space. Wraps as a unit when the title leaves too
 * little room.
 */
export const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.4rem 0.75rem;
  flex: 1;
  min-width: 0;
`;

/** Keeps the section chips legible as a group next to the canvas buttons. */
export const ControlsDivider = styled.span`
  width: 1px;
  height: 1.4rem;
  background: var(--primary-black-10);
  flex-shrink: 0;
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

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

/**
 * Canvas controls, styled like the rest of the app's small controls rather
 * than as underlined text. `$active` is the pressed state of the snap toggle.
 */
export const ToolButton = styled.button<{ $active?: boolean }>`
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
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? "var(--theme-module3-10)" : "var(--primary-black-5)"};
    color: ${({ $active }) =>
      $active ? "var(--theme-module3-hover)" : "var(--primary-black-100)"};
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  }
`;

/**
 * Taskbar for the desk: every section, whether on the canvas or minimised.
 * Wraps rather than scrolls, so it takes only the rows it needs and never
 * competes with the canvas for height.
 */
export const Dock = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
`;

export const DockChip = styled.button<{ $visible: boolean; $accent: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 1.9rem;
  padding: 0 0.7rem;
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease,
    opacity 0.15s ease;

  /* Showing reads as present, minimised as faded. The chip itself stays neutral
     like the rest of the app's controls — only the icon carries the section's
     colour, and it drains away when the tile is put away. */
  border: 1px solid
    ${({ $visible }) =>
      $visible ? "var(--primary-black-30)" : "var(--primary-black-10)"};
  background: var(--primary-white);
  color: ${({ $visible }) =>
    $visible ? "var(--primary-black-100)" : "var(--primary-black-30)"};

  &:hover {
    border-color: var(--primary-black-100);
    color: ${({ $visible }) =>
      $visible ? "var(--primary-black-100)" : "var(--primary-black-60)"};
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    color: ${({ $visible, $accent }) =>
      $visible ? `var(--accent-${$accent}-text)` : "var(--primary-black-30)"};
  }
`;

export const EmptyCanvasHint = styled.p`
  margin: auto;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  text-align: center;
`;

/**
 * The desk. Tiles are absolutely positioned in fractions of this box, so a
 * layout survives a window resize instead of being pinned to pixel positions
 * that only made sense on the screen it was arranged on.
 */
export const Canvas = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
  border-radius: var(--radius-lg);

  /* Free positioning needs room; below this the tiles just stack. */
  @media (max-width: ${MOBILE}) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }
`;

/**
 * Positioned from CSS custom properties rather than direct inline left/top, so
 * the mobile fallback can ignore them — an inline `left` would win over any
 * media query, and the stacked layout would be positioned on top of itself.
 */
export const Tile = styled.article<{
  $dragging: boolean;
  $swapTarget?: boolean;
  $accent: string;
}>`
  position: absolute;
  left: var(--tile-x);
  top: var(--tile-y);
  width: var(--tile-w);
  height: var(--tile-h);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ $swapTarget }) =>
    $swapTarget ? "var(--theme-module3-10)" : "var(--primary-white)"};
  /* Plain card, same as every other surface in the app. The only colour a tile
     carries is its icon; a coloured top rule and a tinted header made the board
     louder than the pages around it. Dashed marks a pending swap. */
  border: 1px ${({ $swapTarget }) => ($swapTarget ? "dashed" : "solid")}
    ${({ $swapTarget }) =>
      $swapTarget ? "var(--theme-module3-100)" : "var(--primary-black-10)"};
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: ${({ $dragging }) =>
    $dragging
      ? "0 16px 40px rgba(0, 0, 0, 0.18)"
      : "0 1px 3px rgba(0, 0, 0, 0.06)"};
  /* The tile under the cursor must track it exactly, so it gets no transition.
     Every other tile eases, which is what makes a snapped tile being pushed
     aside read as being pushed rather than as teleporting. */
  transition: ${({ $dragging }) =>
    $dragging
      ? "none"
      : "left 0.18s ease, top 0.18s ease, width 0.18s ease, height 0.18s ease, box-shadow 0.15s ease"};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &:hover {
    box-shadow: ${({ $dragging }) =>
      $dragging
        ? "0 16px 40px rgba(0, 0, 0, 0.18)"
        : "0 4px 14px rgba(0, 0, 0, 0.1)"};
  }

  @media (max-width: ${MOBILE}) {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    height: auto;
    min-height: 16rem;
    flex-shrink: 0;
  }
`;

/**
 * The whole header is the drag surface — it is chrome, not content, so there
 * is nothing in it worth selecting. The body below stays fully selectable.
 */
export const TileHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid var(--primary-black-10);
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  /* Stops touch drags from scrolling the page instead of moving the tile. */
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  @media (max-width: ${MOBILE}) {
    cursor: default;
    touch-action: auto;
  }
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

/**
 * Sits in the drag surface, so it stops its own pointerdown from reaching the
 * header — otherwise minimising would begin a drag on the way to the click.
 */
export const MinimizeButton = styled.button`
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

/** Keyboard equivalent of dragging, and a visible affordance for the mouse. */
export const GripButton = styled.button`
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
  cursor: grab;

  &:hover {
    color: var(--primary-black-60);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const TileBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.85rem;
  scrollbar-width: thin;
`;

/** Corner grip. Quiet until the tile is hovered, like a window resize corner. */
export const ResizeHandle = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1.25rem;
  height: 1.25rem;
  cursor: nwse-resize;
  touch-action: none;
  opacity: 0;
  transition: opacity 0.15s ease;

  &::after {
    content: "";
    position: absolute;
    right: 0.3rem;
    bottom: 0.3rem;
    width: 0.45rem;
    height: 0.45rem;
    border-right: 2px solid var(--primary-black-30);
    border-bottom: 2px solid var(--primary-black-30);
  }

  ${Tile}:hover & {
    opacity: 1;
  }

  @media (max-width: ${MOBILE}) {
    display: none;
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

export const MaterialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const MaterialLink = styled.a`
  display: block;
  padding: 0.5rem 0.6rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--theme-module3-10);
    color: var(--theme-module3-hover);
  }
`;
