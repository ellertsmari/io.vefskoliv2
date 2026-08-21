"use client";
import styled from "styled-components";

/**
 * Shared page chrome. Every LMS page had its own copy of this with a different
 * max-width (800 / 1100 / 1200 / 1400 / none), so "the same" page frame drifted
 * per feature. Pick a width by what the content is, not by page.
 */
export const PAGE_WIDTHS = {
  narrow: "800px", // prose and reading (docs)
  default: "1200px", // cards and lists (dashboard, groups, people)
  wide: "1400px", // dense grids and tables (calendar, reports)
  // Tiling card grids that should keep adding columns rather than leaving the
  // right-hand side of a wide screen empty (resources, gallery).
  full: "100%",
} as const;

export type PageWidth = keyof typeof PAGE_WIDTHS;

export const PageContainer = styled.div<{ $width?: PageWidth }>`
  width: 100%;
  max-width: ${({ $width = "default" }) => PAGE_WIDTHS[$width]};
  /* Left-aligned, not centred: content-heavy pages start at the left edge, and
     a centred block makes short pages disagree with long ones about where the
     first column begins. max-width still caps the measure. */
  margin: 0;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 600px) {
    padding: 1rem;
  }
`;

export const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const PageTitle = styled.h1`
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0;
  color: var(--primary-black-100);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const PageSubtitle = styled.p`
  font-size: var(--text-base);
  color: var(--primary-black-60);
  margin: 0;
`;

/** Title and subtitle stacked, for headers that carry both. */
export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
