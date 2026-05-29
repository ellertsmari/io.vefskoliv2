"use client";

import styled from "styled-components";

export const DocsContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
`;

export const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0 0 0.5rem 0;
`;

export const PageSubtitle = styled.p`
  font-size: 1rem;
  color: var(--primary-black-60);
  margin: 0 0 2rem 0;
`;

export const FormulaBox = styled.div`
  background: var(--primary-black-5);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--primary-black-100);
  border-left: 3px solid var(--error-success-100);
`;

export const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => props.$color}20;
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
  font-size: 0.9rem;
  color: var(--primary-black-80);
`;
