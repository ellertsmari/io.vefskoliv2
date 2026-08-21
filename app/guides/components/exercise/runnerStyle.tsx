"use client";

import styled from "styled-components";

/**
 * Fills the modal rather than sitting in a narrow column inside it. The shared
 * modal already grows to 90dvw, so capping the content at a fixed width left a
 * wide empty box with the questions stranded in the middle — and squeezed the
 * code editor into whatever the help panel did not take.
 *
 * The max-width is still there so a line of text never runs the full width of
 * an ultrawide display, but it is generous enough that code has room.
 */
export const RunnerShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  min-height: min(26rem, 55dvh);
`;

export const RunnerHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

/** Question on the left, help on the right; stacked on a narrow screen. */
export const RunnerColumns = styled.div`
  display: grid;
  /* The question takes the room; the help panel grows a little on a wide
     screen but never dominates. */
  grid-template-columns: minmax(0, 1fr) clamp(16rem, 22%, 24rem);
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  align-items: start;

  @media (max-width: 60rem) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const HelpPanel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md);
  background: var(--theme-module3-10);
  border: 1px solid var(--theme-module3-30);
  font-size: var(--text-sm);
  align-self: start;
  position: sticky;
  top: 0;
`;

export const HelpHeading = styled.h4`
  margin: 0.35rem 0 0 0;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--primary-black-60);

  &:first-child {
    margin-top: 0;
  }
`;

export const HelpBody = styled.p`
  margin: 0;
  line-height: 1.5;
  color: var(--primary-black-60);
`;

export const HelpLinkList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const HelpLinkItem = styled.li`
  a {
    color: var(--theme-module3-hover);
    text-decoration: underline;
    overflow-wrap: anywhere;
  }
`;

/**
 * One segment per question, coloured by how it has gone and clickable to jump
 * straight there. A plain bar told the student how far along they were; this
 * also tells them which ones still need work.
 */
export const SegmentBar = styled.div`
  display: flex;
  gap: 3px;
  width: 100%;
  /* Room for the focus ring and the hover lift, INSIDE the bar's own box.
     The modal is a scroll container, so anything drawn outside it is clipped —
     and a negative margin here would hand that space straight back, which is
     why the ring was still cropped at the top. The 4px ring needs 6px. */
  padding: 6px;
`;

export const Segment = styled.button<{
  $state: "untried" | "correct" | "wrong";
  $current: boolean;
}>`
  flex: 1;
  height: 10px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: transform 120ms ease;
  background: ${({ $state }) =>
    $state === "correct" ? "var(--error-success-100)" : $state === "wrong" ? "var(--error-failure-100)" : "var(--theme-module3-30)"};
  /* A ring drawn with box-shadow rather than outline: it follows the border
     radius and stays within the padding above, so nothing is clipped. */
  box-shadow: ${({ $current }) =>
    $current ? "0 0 0 2px var(--primary-white), 0 0 0 4px var(--theme-module3-100)" : "none"};

  &:hover {
    transform: scaleY(1.4);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--primary-white), 0 0 0 4px var(--theme-module3-100);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

export const RunnerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
`;

/**
 * Sticks to the bottom of the modal's scroll area: the modal scrolls, and on a
 * long code question the controls would otherwise scroll out of reach.
 */
export const RunnerFooter = styled.footer`
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 0 0 0;
  border-top: 1px solid var(--primary-black-10);
  background: var(--primary-white);
`;

export const Spacer = styled.div`
  flex: 1;
`;

export const Prompt = styled.h3`
  margin: 0;
  font-size: var(--text-lg);
  line-height: 1.4;

  /* Focused on each new question so a keyboard user lands on the question
     rather than at the top of the modal, but without a focus ring on click. */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 4px;
  }
`;

export const Feedback = styled.p<{ $tone: "right" | "wrong" }>`
  margin: 0.25rem 0 0 0;
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: ${({ $tone }) => ($tone === "right" ? "var(--primary-black-100)" : "var(--primary-black-100)")};
  background: ${({ $tone }) => ($tone === "right" ? "var(--error-success-30)" : "var(--error-failure-30)")};
`;

export const ScoreBig = styled.p`
  margin: 0;
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: 1;
`;

export const GoalList = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: var(--text-sm);
`;

export const GoalRow = styled.li<{ $mastered: boolean }>`
  color: ${({ $mastered }) => ($mastered ? "var(--primary-black-100)" : "var(--primary-black-100)")};
`;

export const ConfirmNotice = styled.p`
  margin: 0;
  padding: 0.9rem 1.1rem;
  border-radius: var(--radius-md);
  background: var(--error-warning-30);
  border: 1px solid var(--error-warning-60);
  color: var(--primary-black-100);
  line-height: 1.55;
`;

export const ReviewRow = styled.div`
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-top: 1px solid var(--primary-black-10);
  font-size: var(--text-sm);
  align-items: start;

  @media (max-width: 36rem) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.25rem;
  }
`;

export const ReviewOutcome = styled.span<{
  $tone: "good" | "ok" | "bad" | "none";
}>`
  font-weight: 600;
  white-space: nowrap;
  color: ${({ $tone }) =>
    $tone === "good"
      ? "var(--primary-black-100)"
      : $tone === "ok"
      ? "var(--primary-black-100)"
      : $tone === "bad"
      ? "var(--primary-black-100)"
      : "var(--primary-black-60)"};
`;

export const ReviewAnswer = styled.p`
  margin: 0.15rem 0 0 0;
  color: var(--primary-black-60);
  overflow-wrap: anywhere;
`;

export const ReviewNote = styled.p`
  margin: 0.25rem 0 0 0;
  color: var(--primary-black-100);
`;
