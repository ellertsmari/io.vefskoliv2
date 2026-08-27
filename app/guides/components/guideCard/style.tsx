"use client";
import styled from "styled-components";

export const CardWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

export type CardStatus =
  | "default"
  | "needsReview"
  | "awaitingReviews"
  | "passed"
  | "failed"
  | "hallOfFame";

/**
 * Border colours are the ones the StatusLegend explains, so they stay exactly
 * as they were. What is new is the tint behind them: a bare coloured outline
 * read as an alert next to the app's other cards, which are all a filled
 * surface. Hall of fame gets an extra inner ring instead of a thicker border,
 * because under border-box a 3px border eats 4px of the content width and
 * those cards laid their text out narrower than the ones beside them.
 */
const STATUS_SURFACE: Record<
  CardStatus,
  { border: string; background: string; ring?: string }
> = {
  default: {
    border: "var(--primary-black-10)",
    background: "var(--primary-white)",
  },
  needsReview: {
    border: "var(--error-warning-100)",
    background: "var(--error-warning-10)",
  },
  awaitingReviews: {
    border: "var(--error-success-100)",
    background: "var(--error-success-10)",
  },
  passed: {
    border: "var(--error-success-100)",
    background: "var(--error-success-10)",
  },
  failed: {
    border: "var(--error-failure-100)",
    background: "var(--error-failure-10)",
  },
  hallOfFame: {
    border: "var(--theme-module3-100)",
    background: "var(--theme-module3-10)",
    ring: "var(--theme-module3-100)",
  },
};

const RESTING_SHADOW = "0 1px 3px rgba(0, 0, 0, 0.06)";
const LIFTED_SHADOW = "0 6px 18px rgba(0, 0, 0, 0.1)";

const shadowFor = (status: CardStatus, shadow: string) => {
  const ring = STATUS_SURFACE[status].ring;
  return ring ? `inset 0 0 0 2px ${ring}, ${shadow}` : shadow;
};

/**
 * Fills the cell it is given rather than being a fixed 190x200 block. The old
 * fixed size left ~80px of dead space on either side of every card once these
 * were placed in the dashboard's wider grid tracks.
 */
export const InfoWrapper = styled.div<{ $status: CardStatus }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 190px;
  position: relative;
  border-radius: var(--radius-lg);
  border: 1px solid ${({ $status }) => STATUS_SURFACE[$status].border};
  background: ${({ $status }) => STATUS_SURFACE[$status].background};
  box-shadow: ${({ $status }) => shadowFor($status, RESTING_SHADOW)};
  transition: box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $status }) => shadowFor($status, LIFTED_SHADOW)};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

export const WriteFeedbackContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const VotingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  max-width: 400px;
`;
export const VoteContainer = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid var(--primary-black-100);
    outline-offset: 4px;
    border-radius: var(--radius-md);
  }
`;

export const VoteDescription = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  text-align: center;
  line-height: 1.3;
  margin-top: 0.25rem;
`;

export const VoteIcon = styled.div`
  display: flex;
  border-width: 1px;
  border-style: solid;
  border-radius: var(--radius-md);
  width: 100px;
  height: 100px;
  justify-content: center;
  align-items: center;
`;
