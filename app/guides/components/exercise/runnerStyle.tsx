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
  border-radius: 10px;
  background: #f6f6fb;
  border: 1px solid #e6e6f2;
  font-size: 0.85rem;
  align-self: start;
  position: sticky;
  top: 0;
`;

export const HelpHeading = styled.h4`
  margin: 0.35rem 0 0 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #555;

  &:first-child {
    margin-top: 0;
  }
`;

export const HelpBody = styled.p`
  margin: 0;
  line-height: 1.5;
  color: #333;
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
    color: #4a48c4;
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
`;

export const Segment = styled.button<{
  $state: "untried" | "correct" | "wrong";
  $current: boolean;
}>`
  flex: 1;
  height: 10px;
  padding: 0;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: transform 120ms ease;
  background: ${({ $state }) =>
    $state === "correct" ? "#1a7f4b" : $state === "wrong" ? "#c0392b" : "#dcdce4"};
  outline: ${({ $current }) => ($current ? "2px solid #6563eb" : "none")};
  outline-offset: 2px;

  &:hover {
    transform: scaleY(1.4);
  }

  &:focus-visible {
    outline: 2px solid #6563eb;
    outline-offset: 2px;
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
  border-top: 1px solid #eee;
  background: var(--primary-white, #fff);
`;

export const Spacer = styled.div`
  flex: 1;
`;

export const Prompt = styled.h3`
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.4;

  /* Focused on each new question so a keyboard user lands on the question
     rather than at the top of the modal, but without a focus ring on click. */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid #6563eb;
    outline-offset: 4px;
  }
`;

export const Feedback = styled.p<{ $tone: "right" | "wrong" }>`
  margin: 0.25rem 0 0 0;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: ${({ $tone }) => ($tone === "right" ? "#0f5132" : "#842029")};
  background: ${({ $tone }) => ($tone === "right" ? "#d1e7dd" : "#f8d7da")};
`;

export const ScoreBig = styled.p`
  margin: 0;
  font-size: 2.5rem;
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
  font-size: 0.9rem;
`;

export const GoalRow = styled.li<{ $mastered: boolean }>`
  color: ${({ $mastered }) => ($mastered ? "#0f5132" : "#664d03")};
`;
