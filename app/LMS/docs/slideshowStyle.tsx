"use client";

import styled, { keyframes } from "styled-components";

/* ---------- Docs landing card ---------- */

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

export const HowItWorksCard = styled.button`
  text-align: left;
  cursor: pointer;
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-left: 4px solid var(--theme-module3-100);
  border-radius: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  font: inherit;
  color: inherit;
  width: 100%;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
    border-color: var(--theme-module3-100);
    outline: none;
  }
`;

export const CardIcon = styled.div`
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
`;

export const CardTextWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

export const CardKicker = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--theme-module3-100);
`;

export const CardTitle = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-black-100);
`;

export const CardDesc = styled.span`
  font-size: 0.9rem;
  color: var(--primary-black-60);
`;

export const CardCta = styled.span`
  margin-top: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--theme-module3-100);
`;

/* ---------- Slideshow shell ---------- */

export const SlideshowRoot = styled.div`
  display: flex;
  flex-direction: column;
  min-height: min(74vh, 660px);
  width: 100%;
`;

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

export const ProgressBarTrack = styled.div`
  flex: 1;
  height: 8px;
  background: var(--primary-black-10);
  border-radius: 999px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: var(--theme-module3-100);
  border-radius: 999px;
  transition: width 0.25s ease;
`;

export const StepCount = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-black-60);
  white-space: nowrap;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const SlideStage = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
`;

export const Slide = styled.div`
  width: 100%;
  max-width: 640px;
  animation: ${fadeIn} 0.3s ease;
`;

export const SlideIcon = styled.div`
  font-size: 2.75rem;
  line-height: 1;
  margin-bottom: 0.75rem;
`;

export const SlideTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0 0 0.5rem 0;
`;

export const SlideSubtitle = styled.p`
  font-size: 1rem;
  color: var(--primary-black-60);
  margin: 0 0 1.25rem 0;
`;

export const SlideBody = styled.div`
  font-size: 0.97rem;
  line-height: 1.65;
  color: var(--primary-black-100);

  p {
    margin: 0 0 0.9rem 0;
  }
  strong {
    color: var(--primary-black-100);
  }
`;

export const Callout = styled.div`
  background: var(--theme-module3-10);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin: 1rem 0 0 0;
  font-size: 0.9rem;
  color: var(--primary-black-100);
  border-left: 3px solid var(--theme-module3-100);
`;

/* ---------- Footer / navigation ---------- */

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--primary-black-10);
`;

export const Dots = styled.div`
  display: flex;
  gap: 0.4rem;
`;

export const Dot = styled.button<{ $active: boolean }>`
  width: ${(p) => (p.$active ? "22px" : "8px")};
  height: 8px;
  border-radius: 999px;
  border: none;
  padding: 0;
  cursor: pointer;
  background: ${(p) =>
    p.$active ? "var(--theme-module3-100)" : "var(--primary-black-10)"};
  transition: width 0.2s ease, background 0.2s ease;
`;

export const NavButton = styled.button<{ $variant?: "primary" | "ghost" }>`
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  transition: background 0.15s ease, opacity 0.15s ease;

  ${(p) =>
    p.$variant === "primary"
      ? `
    background: var(--theme-module3-100);
    color: var(--primary-white);
    border: 1px solid var(--theme-module3-100);
    &:hover { background: var(--theme-module3-hover); }
  `
      : `
    background: transparent;
    color: var(--primary-black-60);
    border: 1px solid var(--primary-black-10);
    &:hover { background: var(--primary-black-10); }
  `}

  &:disabled {
    opacity: 0;
    pointer-events: none;
  }
`;

/* ---------- Interactive: grade calculator ---------- */

export const CalcWrap = styled.div`
  background: var(--primary-black-10);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 0.5rem;
`;

export const RangeLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin-bottom: 0.75rem;
`;

export const RangeInput = styled.input`
  width: 100%;
  accent-color: var(--theme-module3-100);
  cursor: pointer;
`;

export const RangeValue = styled.span`
  color: var(--theme-module3-100);
  font-weight: 700;
`;

export const StackBar = styled.div`
  display: flex;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.25rem 0 0.5rem 0;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
`;

export const StackBase = styled.div`
  width: 50%;
  background: var(--error-success-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-white);
  font-size: 0.8rem;
  font-weight: 600;
`;

export const StackReview = styled.div<{ $pct: number }>`
  width: ${(p) => p.$pct}%;
  background: var(--theme-module3-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-white);
  font-size: 0.8rem;
  font-weight: 600;
  transition: width 0.2s ease;
  overflow: hidden;
  white-space: nowrap;
`;

export const CalcReadout = styled.div`
  text-align: center;
  margin-top: 1rem;
`;

export const BigGrade = styled.div`
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--primary-black-100);
  line-height: 1;
`;

export const BigGradeLabel = styled.div`
  font-size: 0.85rem;
  color: var(--primary-black-60);
  margin-top: 0.25rem;
`;

/* ---------- Interactive: review-quality picker ---------- */

export const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0 1rem 0;
`;

export const Pill = styled.button<{ $active: boolean }>`
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid
    ${(p) => (p.$active ? "var(--theme-module3-100)" : "var(--primary-black-10)")};
  background: ${(p) =>
    p.$active ? "var(--theme-module3-100)" : "var(--primary-white)"};
  color: ${(p) => (p.$active ? "var(--primary-white)" : "var(--primary-black-60)")};
  transition: all 0.15s ease;
`;

export const PillDesc = styled.div`
  background: var(--primary-black-10);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  font-size: 0.95rem;
  color: var(--primary-black-100);
  min-height: 3.5rem;
  display: flex;
  align-items: center;
`;

/* ---------- Two-column duo (slide 2) ---------- */

export const DuoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 0.5rem 0 0 0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const DuoCard = styled.div`
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: 12px;
  padding: 1.25rem;
`;

export const DuoEmoji = styled.div`
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
`;

export const DuoHeading = styled.div`
  font-weight: 700;
  color: var(--primary-black-100);
  margin-bottom: 0.35rem;
`;

export const DuoText = styled.div`
  font-size: 0.88rem;
  color: var(--primary-black-60);
  line-height: 1.5;
`;
