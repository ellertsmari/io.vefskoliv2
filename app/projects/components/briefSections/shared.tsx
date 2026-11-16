"use client";

import styled from "styled-components";

export const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

export const dateFmt = (iso: string | number, opts: Intl.DateTimeFormatOptions) =>
  // Iceland is UTC all year; pinning it keeps server and browser identical.
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

export const CardGrid = styled.div<{ $min?: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${({ $min }) => $min ?? "11rem"}, 1fr));
  gap: 1rem;
`;

export const Card = styled.div`
  background: var(--b-surface);
  border: 1px solid var(--b-line);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.25rem 1.1rem;
  transition: transform 0.35s ${ease}, box-shadow 0.35s ${ease}, border-color 0.35s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--b-accent) 45%, var(--b-line));
    box-shadow: 0 14px 30px -18px color-mix(in srgb, var(--b-text) 40%, transparent);
  }

  > svg {
    font-size: 1.6rem;
    color: var(--b-accent);
  }

  h3 {
    margin: 0.6rem 0 0.35rem;
    font-family: var(--b-head);
    font-size: 1.15rem;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: var(--b-muted);
    font-size: 0.97rem;
    line-height: 1.5;
  }
`;

export const Pill = styled.span<{ $color?: string; $background?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $color }) => $color ?? "var(--b-text)"};
  background: ${({ $background }) => $background ?? "var(--b-soft)"};
`;

export const Panel = styled.div`
  background: var(--b-surface);
  border: 1px solid var(--b-line);
  border-radius: var(--radius-lg);
  padding: clamp(1.1rem, 3vw, 1.75rem);
  animation: brief-panel-in 0.45s ${ease};

  @keyframes brief-panel-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  > p {
    margin: 0 0 0.9rem;
    color: var(--b-muted);
  }
`;

export const Checks = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;

  li {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    line-height: 1.5;
  }

  li > svg {
    flex: none;
    margin-top: 0.2rem;
    color: var(--b-accent);
  }
`;
