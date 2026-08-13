"use client";

import styled from "styled-components";

export const RunnerShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(48rem, 92vw);
  max-height: 80vh;
`;

export const RunnerHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

/** Question on the left, help on the right; stacked on a narrow screen. */
export const RunnerColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 17rem;
  gap: 1.25rem;
  flex: 1;
  min-height: 0;

  @media (max-width: 48rem) {
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
  overflow-y: auto;
  align-self: start;
  max-height: 100%;
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
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

export const RunnerFooter = styled.footer`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
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
