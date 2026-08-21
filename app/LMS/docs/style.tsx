"use client";

import styled from "styled-components";
import { PageContainer } from "globalStyles/pageStyles";

/* Prose width, from the shared page chrome. */
export const DocsContainer = styled(PageContainer).attrs({
  $width: "narrow" as const,
})``;

export { PageTitle, PageSubtitle } from "globalStyles/pageStyles";

export const FormulaBox = styled.div`
  background: var(--primary-black-5);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  border-left: 3px solid var(--error-success-100);
`;

export const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  /* $color is a CSS variable, so an appended hex alpha ("var(--x)20") is
     invalid and renders no background at all. */
  background: ${props => `color-mix(in srgb, ${props.$color} 12%, transparent)`};
  color: ${props => props.$color};
  margin-right: 0.5rem;
`;

export const GradeScale = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 0.5rem 1rem;
  margin: 1rem 0;
`;

export const GradeDescription = styled.div`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;
