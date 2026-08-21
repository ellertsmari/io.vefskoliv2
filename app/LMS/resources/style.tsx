"use client"
import styled from "styled-components";

import { PageContainer } from "globalStyles/pageStyles";

/* Full width so the video grid keeps adding columns instead of stopping at
   three with the rest of the screen empty. */
export const ResourcesContainer = styled(PageContainer).attrs({
  $width: "full" as const,
})``;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Notice = styled.p`
  color: var(--primary-black-60);
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
`;

export const SectionTitle = styled.h2`
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
`;

export const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`