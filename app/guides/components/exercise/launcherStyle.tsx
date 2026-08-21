"use client";

import styled, { keyframes, css } from "styled-components";

export const LauncherCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--primary-black-10);
  background: var(--primary-white);
`;

export const LauncherHeading = styled.h2`
  margin: 0;
  font-size: var(--text-xl);
`;

export const LauncherNote = styled.p`
  margin: 0;
  color: var(--primary-black-60);
  font-size: var(--text-sm);
`;

export const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--primary-black-10);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number; $complete?: boolean }>`
  width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
  height: 100%;
  border-radius: var(--radius-pill);
  background: ${({ $complete }) => ($complete ? "var(--primary-black-100)" : "var(--theme-module3-100)")};
  transition: width 240ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ProgressLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

const pop = keyframes`
  0%   { transform: scale(0.85); }
  60%  { transform: scale(1.12); }
  100% { transform: scale(1); }
`;

export const Trophy = styled.span<{ $animate?: boolean }>`
  font-size: var(--text-4xl);
  line-height: 1;
  display: inline-block;

  ${({ $animate }) =>
    $animate &&
    css`
      animation: ${pop} 600ms ease-out;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PerfectBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--error-warning-10), var(--error-warning-30));
  border: 1px solid var(--error-warning-60);
`;

export const PerfectText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  strong {
    font-size: var(--text-base);
  }

  span {
    font-size: var(--text-sm);
    color: var(--primary-black-100);
  }
`;
