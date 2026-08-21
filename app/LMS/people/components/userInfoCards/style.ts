"use client";
import { SubHeading1 } from "globalStyles/text";
import styled from "styled-components";

export const UserInfoCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const InfoSubtitle = styled(SubHeading1)``;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

export const PersonCount = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

/**
 * Auto-fill rather than a fixed column count, so the roster reflows from a
 * couple of columns on a phone up to as many as the page can hold.
 */
export const PeopleGrid = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 1.5rem 1rem;
  width: 100%;
`;

export const PersonCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 0.25rem;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: 0.15s ease-in-out;

  &:hover {
    border-color: var(--primary-black-10);
    background: var(--primary-black-5);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--theme-module3-100);
  }
`;

export const PersonName = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  text-align: center;
  line-height: 1.3;
  /* Long names wrap rather than stretching the column. */
  overflow-wrap: anywhere;
`;

export const EmptyState = styled.p`
  color: var(--primary-black-60);
`;
