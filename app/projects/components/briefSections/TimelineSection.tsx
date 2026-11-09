"use client";

import { useMemo, useState } from "react";
import styled, { css } from "styled-components";
import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { rich } from "../Rich";
import { ease, dateFmt, Pill, Panel, Checks } from "./shared";

const DAY = 24 * 60 * 60 * 1000;

/* -------------------------------- Timeline ------------------------------- */

type TimelineProps = {
  brief: ResolvedBrief;
  startDate: string;
  endDate: string;
  presentationDate: string | null;
  /** Date.now() after hydration; null on the server. */
  now: number | null;
};

const Track = styled.div`
  position: relative;
  display: flex;
  gap: 4px;
  padding-top: 2.4rem;

  @container brief-body (max-width: 640px) {
    flex-direction: column;
    padding-top: 0;
  }
`;

const PhaseButton = styled.button<{ $active: boolean; $passed: boolean; $after?: boolean }>`
  flex-basis: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid ${({ $active }) => ($active ? "var(--b-accent)" : "var(--b-line)")};
  border-radius: var(--radius-md);
  background: ${({ $active, $passed, $after }) =>
    $active
      ? "var(--b-accent)"
      : $after
        ? "repeating-linear-gradient(135deg, var(--b-soft) 0 6px, var(--b-surface) 6px 12px)"
        : $passed
          ? "var(--b-soft)"
          : "var(--b-surface)"};
  color: ${({ $active }) => ($active ? "var(--b-accent-text)" : "var(--b-text)")};
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ${ease}, border-color 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--b-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--b-accent);
    outline-offset: 2px;
  }

  svg {
    font-size: 1.3rem;
  }

  strong {
    font-family: var(--b-head);
    font-size: 1rem;
    line-height: 1.15;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  small {
    font-size: 0.78rem;
    opacity: 0.8;
    white-space: nowrap;
  }

  em {
    font-style: normal;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.05rem 0.45rem;
    border-radius: var(--radius-pill);
    background: var(--b-text);
    color: var(--b-bg);
  }

  @container brief-body (max-width: 640px) {
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    flex-grow: 0 !important;

    small {
      margin-left: auto;
    }
  }
`;

const Marker = styled.div<{ $tone: "today" | "flag" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  pointer-events: none;
  z-index: 2;

  &::before {
    content: "";
    position: absolute;
    top: 1.6rem;
    bottom: -0.35rem;
    left: -1px;
    border-left: 2px ${({ $tone }) => ($tone === "today" ? "solid" : "dashed")}
      ${({ $tone }) => ($tone === "today" ? "var(--b-text)" : "var(--b-accent)")};
  }

  span {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-pill);
    ${({ $tone }) =>
      $tone === "today"
        ? css`
            background: var(--b-text);
            color: var(--b-bg);
          `
        : css`
            color: var(--b-accent);
          `}
  }

  @container brief-body (max-width: 640px) {
    display: none;
  }
`;

const Detail = styled(Panel)`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem 2rem;

  @container brief-body (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }

  h3 {
    margin: 0 0 0.25rem;
    font-family: var(--b-head);
    font-size: 1.5rem;
    line-height: 1.15;
  }
`;

const Countdown = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  align-items: baseline;
  margin-bottom: 0.25rem;

  strong {
    font-family: var(--b-head);
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  span {
    color: var(--b-muted);
  }
`;

const KeyDates = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  margin: 1.25rem 0 0;

  div {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
  }

  dt {
    color: var(--b-muted);
    font-size: 0.9rem;
  }

  dd {
    margin: 0;
    font-weight: 700;
  }
`;

const dayRange = (from: number, to: number) => {
  const a = dateFmt(from, { day: "numeric", month: "short" });
  const b = dateFmt(to, { day: "numeric", month: "short" });
  return a === b ? a : `${a} – ${b}`;
};

export const TimelineSection = ({ brief, startDate, endDate, presentationDate, now }: TimelineProps) => {
  const start = new Date(startDate).getTime();
  const end = Math.max(start + DAY, new Date(endDate).getTime());
  const show = presentationDate ? new Date(presentationDate).getTime() : end;
  const span = end - start;

  // Phases share kick-off → presentation day by weight; whatever is left
  // after the presentations is the wrap-up.
  const phases = useMemo(() => {
    const total = brief.phases.reduce((sum, p) => sum + Math.max(0.1, p.weight), 0) || 1;
    let cursor = start;
    const workSpan = Math.max(DAY, show - start);
    const list = brief.phases.map((phase) => {
      const from = cursor;
      const to = from + (workSpan * Math.max(0.1, phase.weight)) / total;
      cursor = to;
      return { ...phase, from, to, after: false };
    });
    if (end - show >= DAY) {
      list.push({
        title: "Wrap-up",
        icon: "mdi:flag-checkered",
        weight: 0,
        text: "Peer evaluation, feedback and the retro.",
        tasks: ["Rate your teammates", "Read the feedback on your team", "Retro: what would you do differently?"],
        from: show,
        to: end,
        after: true,
      });
    }
    return list;
  }, [brief.phases, start, show, end]);

  const currentIndex =
    now === null ? -1 : phases.findIndex((p) => now >= p.from && now < p.to);
  const [picked, setPicked] = useState<number | null>(null);
  const active = picked ?? (currentIndex >= 0 ? currentIndex : 0);
  const phase = phases[active];

  const at = (time: number) => `${((time - start) / span) * 100}%`;
  const todayIn = now !== null && now >= start && now <= end;

  let headline: { big: string; small: string } | null = null;
  if (now !== null) {
    if (now < start) {
      const days = Math.ceil((start - now) / DAY);
      headline = { big: `${days} day${days === 1 ? "" : "s"}`, small: "until kick-off" };
    } else if (now < show) {
      const days = Math.ceil((show - now) / DAY);
      headline = { big: `${days} day${days === 1 ? "" : "s"}`, small: "until presentation day" };
    } else if (now <= end) {
      headline = { big: "Presentations", small: "are done — now the wrap-up" };
    } else {
      headline = { big: "Finished", small: `on ${dateFmt(end, { day: "numeric", month: "long", year: "numeric" })}` };
    }
  }

  return (
    <>
      {headline && (
        <Countdown>
          <strong>{headline.big}</strong>
          <span>{headline.small}</span>
        </Countdown>
      )}
      <Track role="group" aria-label="Project phases">
        {todayIn && (
          <Marker $tone="today" style={{ left: at(now!) }}>
            <span>Today</span>
          </Marker>
        )}
        {presentationDate && show < end && (
          <Marker $tone="flag" style={{ left: at(show) }}>
            <span>Presentations</span>
          </Marker>
        )}
        {phases.map((p, index) => (
          <PhaseButton
            key={p.title}
            type="button"
            style={{ flexGrow: Math.max(0.6, (p.to - p.from) / DAY) }}
            $active={index === active}
            $passed={now !== null && now >= p.to}
            $after={p.after}
            aria-pressed={index === active}
            onClick={() => setPicked(index)}
            title={`${p.title} · ${dayRange(p.from, p.to - 1)}`}
          >
            <Icon icon={p.icon} aria-hidden />
            <strong>{p.title}</strong>
            {index === currentIndex && <em>Now</em>}
            <small>{dayRange(p.from, p.to - 1)}</small>
          </PhaseButton>
        ))}
      </Track>
      {phase && (
        <Detail key={active} aria-live="polite">
          <div>
            <Pill style={{ marginBottom: "0.6rem" }}>
              <Icon icon="mdi:calendar-range" aria-hidden /> {dayRange(phase.from, phase.to - 1)}
              {currentIndex === active && " · now"}
            </Pill>
            <h3>{phase.title}</h3>
            <p style={{ margin: 0, color: "var(--b-muted)" }}>{rich(phase.text)}</p>
          </div>
          <Checks>
            {phase.tasks.map((task) => (
              <li key={task}>
                <Icon icon="mdi:arrow-right-circle" aria-hidden />
                <span>{rich(task)}</span>
              </li>
            ))}
          </Checks>
        </Detail>
      )}
      <KeyDates>
        <div>
          <dt>Kick-off</dt>
          <dd>{dateFmt(start, { weekday: "short", day: "numeric", month: "short" })}</dd>
        </div>
        {presentationDate && (
          <div>
            <dt>Presentations</dt>
            <dd>{dateFmt(show, { weekday: "short", day: "numeric", month: "short" })}</dd>
          </div>
        )}
        <div>
          <dt>Ends</dt>
          <dd>{dateFmt(end, { weekday: "short", day: "numeric", month: "short" })}</dd>
        </div>
      </KeyDates>
    </>
  );
};
