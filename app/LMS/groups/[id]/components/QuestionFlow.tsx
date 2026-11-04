"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css, keyframes } from "styled-components";
import { Icon } from "@iconify/react";
import { PrimaryButton, SecondaryButton } from "../../styles";

/**
 * One question per screen, with a progress bar on top.
 *
 * The group-project forms used to be a single long page, so the submit button
 * and anything unanswered sat several screens below the first question. Here
 * each question gets the whole panel, Back/Next move through them, and the
 * last step is a review of every answer with the submit button next to it.
 *
 * The flow is controlled (`index` / `onIndexChange`) so a form can move on by
 * itself — e.g. straight after a single-choice answer is picked.
 */

export type FlowStep = {
  id: string;
  /** Short name for the progress bar tooltip and the review list. */
  label: string;
  /** The question itself, shown as the screen's heading. */
  title: ReactNode;
  /** Small line above the title — a category, a person, a discipline pill. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  content: ReactNode;
  /** Answered. Drives the progress bar and whether Next is enabled. */
  complete: boolean;
  /** Next is allowed even when not complete. */
  optional?: boolean;
  /** Shown beside a disabled Next, saying what is missing. */
  missingHint?: string;
};

type Props = {
  steps: FlowStep[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Kept in view above every step — e.g. a running balance. */
  pinned?: ReactNode;
  /** Shown in the bar's label, e.g. "Question". Defaults to "Step". */
  noun?: string;
};

const DURATION = 420;

/**
 * Call the returned function after an answer is picked to move on shortly
 * after — long enough to see the choice land, short enough to feel snappy.
 * Any pending move is cancelled if the user acts first or the form unmounts.
 */
export const useDelayedAdvance = (advance: () => void, delay = 380) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  return useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => advanceRef.current(), delay);
  }, [delay]);
};

export const QuestionFlow = ({
  steps,
  index,
  onIndexChange,
  pinned,
  noun = "Step",
}: Props) => {
  const safeIndex = Math.min(Math.max(index, 0), steps.length - 1);
  const step = steps[safeIndex];
  const isLast = safeIndex === steps.length - 1;
  // A skipped optional question is not missing anything.
  const doneCount = steps.filter((s) => s.complete || s.optional).length;
  const percent = Math.round((doneCount / steps.length) * 100);

  // Which way the new screen slides in from.
  const previous = useRef(safeIndex);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (previous.current !== safeIndex) {
      setDirection(safeIndex > previous.current ? "forward" : "back");
      previous.current = safeIndex;
    }
    // Move focus to the new question so keyboard and screen-reader users land
    // on it, but not on first render — that would yank the page on load.
    if (mounted.current) {
      headingRef.current?.focus({ preventScroll: true });
      const rect = headingRef.current?.getBoundingClientRect();
      if (rect && (rect.top < 0 || rect.top > window.innerHeight * 0.6)) {
        headingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    mounted.current = true;
  }, [safeIndex]);

  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return;
    onIndexChange(next);
  };

  const canAdvance = step.complete || !!step.optional;

  return (
    <Frame>
      <ProgressHead>
        <ProgressText aria-live="polite">
          <strong>
            {noun} {safeIndex + 1}
          </strong>{" "}
          of {steps.length}
          <ProgressPercent>{percent}% answered</ProgressPercent>
        </ProgressText>
        <Track
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Progress"
        >
          <Fill style={{ width: `${percent}%` }} />
        </Track>
        <Segments>
          {steps.map((s, i) => (
            <Segment
              key={s.id}
              type="button"
              title={s.label}
              aria-label={`${s.label}${s.complete ? " (answered)" : ""}`}
              aria-current={i === safeIndex ? "step" : undefined}
              $state={
                i === safeIndex ? "current" : s.complete ? "done" : "todo"
              }
              onClick={() => go(i)}
            />
          ))}
        </Segments>
      </ProgressHead>

      {pinned}

      <Viewport>
        <Slide key={step.id} $direction={direction}>
          {step.eyebrow && <Eyebrow style={stagger(0)}>{step.eyebrow}</Eyebrow>}
          <StepTitle ref={headingRef} tabIndex={-1} style={stagger(1)}>
            {step.title}
          </StepTitle>
          {step.description && (
            <StepDescription style={stagger(2)}>
              {step.description}
            </StepDescription>
          )}
          <StepBody style={stagger(3)}>{step.content}</StepBody>
        </Slide>
      </Viewport>

      <Nav>
        <SecondaryButton
          type="button"
          onClick={() => go(safeIndex - 1)}
          disabled={safeIndex === 0}
        >
          <Icon icon="mdi:arrow-left" aria-hidden /> Back
        </SecondaryButton>
        {!isLast && (
          <>
            {!canAdvance && step.missingHint && (
              <NavHint>{step.missingHint}</NavHint>
            )}
            <PrimaryButton
              type="button"
              onClick={() => go(safeIndex + 1)}
              disabled={!canAdvance}
            >
              {step.optional && !step.complete ? "Skip" : "Next"}{" "}
              <Icon icon="mdi:arrow-right" aria-hidden />
            </PrimaryButton>
          </>
        )}
      </Nav>
    </Frame>
  );
};

/* ---------- Review screen primitives, for the last step of a flow ---------- */

export const ReviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const ReviewRow = styled.li`
  display: grid;
  grid-template-columns: minmax(8rem, 14rem) 1fr auto;
  gap: 0.25rem 1rem;
  align-items: baseline;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--primary-black-10);
  font-size: var(--text-sm);
  animation: ${keyframes`
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  `} 0.35s ease both;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr auto;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ReviewLabel = styled.span`
  font-weight: 600;
  color: var(--primary-black-100);

  @media (max-width: 560px) {
    grid-column: 1 / -1;
  }
`;

const ReviewValue = styled.span<{ $missing?: boolean }>`
  color: ${({ $missing }) =>
    $missing ? "var(--error-failure-100)" : "var(--primary-black-60)"};
  white-space: pre-line;
`;

const EditLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: var(--primary-black-100);
  }
`;

export const ReviewItem = ({
  label,
  value,
  missing,
  onEdit,
  order = 0,
}: {
  label: ReactNode;
  value: ReactNode;
  missing?: boolean;
  onEdit: () => void;
  order?: number;
}) => (
  <ReviewRow style={{ animationDelay: `${order * 45}ms` }}>
    <ReviewLabel>{label}</ReviewLabel>
    <ReviewValue $missing={missing}>{value}</ReviewValue>
    <EditLink type="button" onClick={onEdit}>
      {missing ? "Answer" : "Edit"}
    </EditLink>
  </ReviewRow>
);

/** Animated tick for the moment a form is handed in. */
export const DoneBurst = ({ children }: { children: ReactNode }) => (
  <Done role="status">
    <svg viewBox="0 0 52 52" aria-hidden>
      <circle cx="26" cy="26" r="24" />
      <path d="M15 27 l7 7 l15 -16" />
    </svg>
    <span>{children}</span>
  </Done>
);

/* ------------------------------- styles ------------------------------- */

const stagger = (n: number) => ({ animationDelay: `${60 + n * 70}ms` });

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ProgressHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProgressText = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);

  strong {
    color: var(--primary-black-100);
  }
`;

const ProgressPercent = styled.span`
  margin-left: auto;
  font-variant-numeric: tabular-nums;
`;

const Track = styled.div`
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--primary-black-5);
  overflow: hidden;
`;

const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`;

const Fill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--theme-module3-100),
    var(--accent-violet-100),
    var(--theme-module3-100)
  );
  background-size: 200% 100%;
  animation: ${shimmer} 4s linear infinite;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

const Segments = styled.div`
  display: flex;
  gap: 4px;
`;

const Segment = styled.button<{ $state: "current" | "done" | "todo" }>`
  flex: 1;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 7px;
    height: 4px;
    border-radius: var(--radius-pill);
    transition: background-color 0.25s ease, transform 0.25s ease;
    background: ${({ $state }) =>
      $state === "current"
        ? "var(--primary-black-100)"
        : $state === "done"
          ? "var(--primary-black-30)"
          : "var(--primary-black-10)"};
    transform: ${({ $state }) => ($state === "current" ? "scaleY(1.6)" : "none")};
  }

  &:hover::after {
    background: var(--primary-black-60);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 1px;
    border-radius: var(--radius-sm);
  }
`;

const slideIn = (from: string) => keyframes`
  from { opacity: 0; transform: translateX(${from}); }
  to { opacity: 1; transform: none; }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

const Viewport = styled.div`
  overflow: hidden;
  /* Room for the focus ring of the first chip without clipping it. */
  padding: 4px;
  margin: -4px;
`;

const Slide = styled.section<{ $direction: "forward" | "back" }>`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 14rem;
  animation: ${({ $direction }) =>
    css`${slideIn($direction === "forward" ? "48px" : "-48px")} ${DURATION}ms
      cubic-bezier(0.22, 1, 0.36, 1) both`};

  & > * {
    animation: ${riseIn} ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    & > * {
      animation: none;
    }
  }
`;

const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--primary-black-60);
`;

const StepTitle = styled.h2`
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  line-height: 1.2;
  color: var(--primary-black-100);
  letter-spacing: -0.01em;

  &:focus {
    outline: none;
  }
`;

const StepDescription = styled.div`
  margin: 0;
  font-size: var(--text-base);
  color: var(--primary-black-60);
  max-width: 60ch;
`;

const StepBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const Nav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--primary-black-10);

  & > :last-child {
    margin-left: auto;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

const NavHint = styled.span`
  margin-left: auto;
  font-size: var(--text-sm);
  color: var(--primary-black-60);

  & + * {
    margin-left: 0 !important;
  }
`;

const draw = keyframes`
  to { stroke-dashoffset: 0; }
`;

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); }
`;

const Done = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--error-success-100);

  svg {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    animation: ${pop} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  circle,
  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  circle {
    stroke-dasharray: 151;
    stroke-dashoffset: 151;
    animation: ${draw} 0.5s ease-out 0.1s forwards;
  }

  path {
    stroke-dasharray: 40;
    stroke-dashoffset: 40;
    animation: ${draw} 0.3s ease-out 0.5s forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    svg,
    circle,
    path {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
`;
