"use client";
import styled, { css } from "styled-components";
import Link from "next/link";
import { GroupProjectStatus } from "constants/groupWork";

// Shared styled primitives for the group-work pages, matching the
// card aesthetic used on the dashboard (white cards, var(--primary-black-10) borders).

// Page frame now comes from the shared chrome in globalStyles/pageStyles.
export {
  PageContainer,
  PageHeader,
  PageTitle,
} from "globalStyles/pageStyles";

export const SectionTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
`;

export const MutedText = styled.p`
  color: var(--primary-black-60);
  margin: 0;
  font-size: var(--text-sm);
`;

/**
 * The card surface, matching the guide cards: a white panel with a hairline
 * border and a resting shadow. Cards used to sit flat with no shadow at all
 * and only gained one on hover, which made hovering look like the card had
 * appeared rather than lifted.
 */
const cardSurface = css`
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const Card = styled.div`
  ${cardSurface}
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

/**
 * Lifts on hover exactly like a guide card, rather than snapping its border to
 * full black — a hairline going to 100% black is a bigger visual jump than the
 * hover deserves, and it was the one card in the app that did it.
 */
export const ClickableCard = styled(Link)`
  ${cardSurface}
  text-decoration: none;
  color: inherit;
  /* Named properties rather than "all": transitioning everything also animates
     the border colour and padding on any future change, for no benefit. */
  /* Shadow only — see the guide card: a card that moves on hover can move out
     from under the cursor and flicker. */
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const statusColors: Record<GroupProjectStatus, { bg: string; fg: string }> = {
  formation: { bg: "var(--theme-module3-100)", fg: "white" },
  active: { bg: "var(--error-success-100)", fg: "white" },
  archived: { bg: "var(--primary-black-10)", fg: "var(--primary-black-60)" },
};

export const StatusChip = styled.span<{ $status: GroupProjectStatus }>`
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $status }) => statusColors[$status].bg};
  color: ${({ $status }) => statusColors[$status].fg};
`;

export const Pill = styled.span`
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  color: var(--primary-black-60);
`;

// A Pill tinted by the discipline of the rubric category it shows
// (coding / design / general — the docs' rubric color coding).
export const ScorePill = styled(Pill)<{ $color: string; $background: string }>`
  color: ${({ $color }) => $color};
  background: ${({ $background }) => $background};
  /* color-mix rather than an appended hex alpha, which would silently break
     if DISCIPLINE_META ever moves to CSS variables. */
  border-color: ${({ $color }) =>
    `color-mix(in srgb, ${$color} 20%, transparent)`};
`;

export const buttonBase = css`
  border-radius: var(--radius-md);
  padding: 0.6rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  ${buttonBase}
  background: var(--primary-black-100);
  color: white;

  &:hover:not(:disabled) {
    background: var(--primary-black-60);
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  background: white;
  color: var(--primary-black-100);
  border-color: var(--primary-black-10);

  &:hover:not(:disabled) {
    border-color: var(--primary-black-100);
  }
`;

export const DangerButton = styled.button`
  ${buttonBase}
  background: white;
  color: var(--error-failure-100);
  border-color: var(--error-failure-100);

  &:hover:not(:disabled) {
    background: var(--error-failure-100);
    color: white;
  }
`;

// ── Stepper ───────────────────────────────────────────────────────────────

export const StepList = styled.nav`
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 0.25rem;

  @media (max-width: 760px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

type StepStateProps = { $state: "done" | "current" | "available" | "locked" };

/**
 * One step. Flex-1 so the row divides evenly however many steps a project has,
 * and relative so the connector can be pinned to its right edge.
 */
export const StepButton = styled.button<StepStateProps>`
  position: relative;
  flex: 1 1 0;
  min-width: 10rem;
  /* Marker above the label, not beside it: with them side by side the
     connector to the next step ran straight through the label text. */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.25rem 1rem 0.85rem 0;
  background: none;
  border: none;
  text-align: left;
  font: inherit;
  cursor: ${({ $state }) => ($state === "locked" ? "default" : "pointer")};

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
    border-radius: var(--radius-md);
  }

`;

/** The numbered disc, which becomes a tick when the step is finished. */
export const StepMarker = styled.span<StepStateProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: var(--text-xs);
  font-weight: 700;
  border: 1px solid;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  ${({ $state }) => {
    if ($state === "current") {
      return `
        background: var(--theme-module3-100);
        border-color: var(--theme-module3-100);
        color: var(--primary-white);
      `;
    }
    if ($state === "done") {
      return `
        background: var(--theme-module3-10);
        border-color: var(--theme-module3-60);
        color: var(--theme-module3-hover);
      `;
    }
    if ($state === "locked") {
      return `
        background: var(--primary-white);
        border-color: var(--primary-black-10);
        color: var(--primary-black-30);
      `;
    }
    return `
      background: var(--primary-white);
      border-color: var(--primary-black-30);
      color: var(--primary-black-60);
    `;
  }}
`;

export const StepText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
`;

export const StepLabel = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
  transition: color 0.15s ease;

  ${StepButton}:disabled & {
    color: var(--primary-black-30);
  }

  ${StepButton}:hover:not(:disabled) & {
    color: var(--theme-module3-hover);
  }
`;

export const StepHint = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

/** Joins a step to the next one. Sits behind the markers, not between them. */
export const StepConnector = styled.span`
  position: absolute;
  /* From just past this step's marker to just before the next one, at the
     markers' own centre line: 0.25rem of padding plus half of 1.75rem. */
  left: 2.15rem;
  right: 0.6rem;
  top: 1.125rem;
  height: 1px;
  background: var(--primary-black-10);

  @media (max-width: 760px) {
    display: none;
  }
`;

/** Holds whichever step is open. */
export const StepPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const TabBar = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--primary-black-10);
  overflow-x: auto;
`;

export const TabButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 3px solid
    ${({ $active }) => ($active ? "var(--primary-black-100)" : "transparent")};
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $active }) => ($active ? "var(--primary-black-100)" : "var(--primary-black-60)")};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--primary-black-100);
  }
`;

export const Label = styled.label`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-60);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const Input = styled.input`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  font-size: var(--text-sm);
  font-family: inherit;
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
  }
`;

export const TextArea = styled.textarea`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  font-size: var(--text-sm);
  font-family: inherit;
  width: 100%;
  min-height: 110px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
  }
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

/**
 * Same pill language as the module filter on the guides page: a light surface
 * with a hairline border, filling black when chosen. The hover used to snap the
 * border to full black in both states, which made an unselected chip look
 * chosen and a chosen one look like it had been turned off.
 */
export const SelectableChip = styled.button<{ $selected: boolean }>`
  ${buttonBase}
  padding: 0.4rem 0.9rem;
  font-size: var(--text-sm);
  border-radius: var(--radius-pill);
  transition: background-color 0.15s ease, border-color 0.15s ease,
    color 0.15s ease;
  background: ${({ $selected }) =>
    $selected ? "var(--primary-black-100)" : "var(--primary-white)"};
  color: ${({ $selected }) =>
    $selected ? "var(--primary-white)" : "var(--primary-black-60)"};
  border-color: ${({ $selected }) =>
    $selected ? "var(--primary-black-100)" : "var(--primary-black-10)"};

  &:hover:not(:disabled) {
    background: ${({ $selected }) =>
      $selected ? "var(--primary-black-60)" : "var(--primary-black-5)"};
    border-color: ${({ $selected }) =>
      $selected ? "var(--primary-black-60)" : "var(--primary-black-30)"};
    color: ${({ $selected }) =>
      $selected ? "var(--primary-white)" : "var(--primary-black-100)"};
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;

/**
 * The preference questions. Each is one short prompt and a row of chips, so
 * stacking them full-width left two thirds of the page empty and pushed the
 * save button three screens down.
 */
export const QuestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
  gap: 1rem;
  align-items: start;
`;

export const QuestionCard = styled.div`
  ${cardSurface}
  padding: 1rem 1.25rem;
  gap: 0.75rem;
  height: 100%;
`;

/** Spans the grid — for a question whose answer needs the full width. */
export const WideQuestionCard = styled(QuestionCard)`
  grid-column: 1 / -1;
`;

/**
 * A question prompt, not a section heading. These were SectionTitle, so six
 * one-line questions each carried the same weight as the page's own headings.
 */
export const QuestionTitle = styled.h2`
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
`;

export const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1rem;
`;

export const StatCard = styled.div`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  padding: 1rem;
  text-align: center;
`;

export const StatValue = styled.div`
  font-size: var(--text-2xl);
  font-weight: 700;
`;

export const StatLabel = styled.div`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Message = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: var(--text-sm);
  color: ${({ $error }) =>
    $error ? "var(--error-failure-100)" : "var(--error-success-100)"};
`;

export const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
`;

export const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--primary-black-5);
`;

export const AvatarFallback = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--primary-black-60);
`;

export const LinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const ExternalLink = styled.a`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-100);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.6rem;
  text-decoration: none;

  &:hover {
    border-color: var(--primary-black-100);
  }
`;

export const ImagesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const TeamImage = styled.img`
  width: 110px;
  height: 75px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-black-10);
`;
