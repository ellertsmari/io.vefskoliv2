"use client";
import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  /* Capsules size to their labels, so let the row wrap rather than squeezing
     fixed-width pills with space-between. */
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * Same shape as the app's other pill controls (the alias switcher, the guide
 * canvas toolbar): a light surface with a hairline border, filling black when
 * it is the one selected. It used to carry a full-strength black border in
 * every state, which made an eight-module filter row read as eight buttons all
 * shouting equally.
 */
export const CapsuleButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.85rem;
  flex: 0 0 auto;
  white-space: nowrap;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease,
    color 0.15s ease;

  border: 1px solid
    ${({ $active }) =>
      $active ? "var(--primary-black-100)" : "var(--primary-black-10)"};
  background-color: ${({ $active }) =>
    $active ? "var(--primary-black-100)" : "var(--primary-white)"};
  color: ${({ $active }) =>
    $active ? "var(--primary-white)" : "var(--primary-black-60)"};

  &:hover {
    /* The selected pill must not wash out to grey on hover, which is what the
       single shared hover rule used to do. */
    background-color: ${({ $active }) =>
      $active ? "var(--primary-black-60)" : "var(--primary-black-5)"};
    border-color: ${({ $active }) =>
      $active ? "var(--primary-black-60)" : "var(--primary-black-30)"};
    color: ${({ $active }) =>
      $active ? "var(--primary-white)" : "var(--primary-black-100)"};
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;
