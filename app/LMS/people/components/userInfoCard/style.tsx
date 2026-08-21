"use client";
import styled from "styled-components";

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
`;

export const PersonHeading = styled.h2`
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--primary-black-100);
  line-height: 1.3;
`;

/**
 * Label above value on a phone; label beside value once there is room, so the
 * values line up in a readable column.
 */
export const DetailGrid = styled.div`
  display: grid;
  gap: 0.25rem 1.5rem;

  @media (min-width: 480px) {
    grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
    gap: 0.75rem 1.5rem;
    align-items: baseline;
  }
`;

export const DetailLabel = styled.span`
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--theme-module3-100);
`;

export const DetailValue = styled.p`
  color: var(--primary-black-100);
  overflow-wrap: anywhere;

  &:not(:last-child) {
    margin-bottom: 0.75rem;
  }

  @media (min-width: 480px) {
    &:not(:last-child) {
      margin-bottom: 0;
    }
  }
`;

export const NoInfo = styled.p`
  color: var(--primary-black-60);
  text-align: center;
`;
