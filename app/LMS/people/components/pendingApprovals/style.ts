"use client";
import styled from "styled-components";

export const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--error-warning-100);
  border-radius: var(--radius-lg);
  background: var(--error-warning-10);
`;

export const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--error-failure-100);
`;

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

export const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 0;
  border-top: 1px solid var(--primary-black-10);

  &:first-child {
    border-top: none;
  }
`;

export const Identity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

export const Name = styled.span`
  font-size: var(--text-base);
  color: var(--primary-black-100);
  overflow-wrap: anywhere;
`;

export const Meta = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  overflow-wrap: anywhere;
`;

export const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;
