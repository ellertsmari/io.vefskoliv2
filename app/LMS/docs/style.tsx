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

export const Section = styled.section`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--primary-white);
  border-radius: 12px;
  border: 1px solid var(--primary-black-10);
`;

export const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SectionContent = styled.div`
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--primary-black-80);

  p {
    margin: 0 0 1rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  ul {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  li {
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: var(--primary-black-100);
  }
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

export const ExampleBox = styled.div`
  background: var(--theme-module3-10);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1rem 0;
`;

export const ExampleTitle = styled.div`
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--primary-black-100);
  margin-bottom: 0.5rem;
`;

export const ExampleContent = styled.div`
  font-size: 0.9rem;
  color: var(--primary-black-80);
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

export const GradeNumber = styled.div`
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const GradeDescription = styled.div`
  font-size: 0.9rem;
  color: var(--primary-black-80);
`;
