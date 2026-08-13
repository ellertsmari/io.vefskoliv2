"use client";

import styled, { keyframes, css } from "styled-components";

export const LauncherCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--theme-border, #e3e3e3);
  background: var(--theme-surface, #fff);
`;

export const LauncherHeading = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

export const LauncherNote = styled.p`
  margin: 0;
  color: #555;
  font-size: 0.9rem;
`;

export const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #ececec;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number; $complete?: boolean }>`
  width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
  height: 100%;
  border-radius: 999px;
  background: ${({ $complete }) => ($complete ? "#0f5132" : "#6563eb")};
  transition: width 240ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ProgressLabel = styled.span`
  font-size: 0.85rem;
  color: #555;
`;

const pop = keyframes`
  0%   { transform: scale(0.85); }
  60%  { transform: scale(1.12); }
  100% { transform: scale(1); }
`;

export const Trophy = styled.span<{ $animate?: boolean }>`
  font-size: 2.5rem;
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
  border-radius: 12px;
  background: linear-gradient(135deg, #fff8e1, #fff3cd);
  border: 1px solid #ffe08a;
`;

export const PerfectText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  strong {
    font-size: 1.05rem;
  }

  span {
    font-size: 0.9rem;
    color: #6b5900;
  }
`;
