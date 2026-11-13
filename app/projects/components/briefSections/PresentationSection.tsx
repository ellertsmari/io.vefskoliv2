"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { DISCIPLINE_META } from "constants/groupWork";
import type { RubricItem } from "constants/groupWork";
import { rich } from "../Rich";
import { ease, Pill, Panel } from "./shared";

/* ------------------------------ Presentation ----------------------------- */

const AgendaBar = styled.div`
  position: relative;
  display: flex;
  gap: 4px;
  margin-top: 0.5rem;

  @container brief-body (max-width: 560px) {
    flex-direction: column;
  }
`;

const AgendaPart = styled.button<{ $active: boolean }>`
  position: relative;
  flex-basis: 0;
  min-width: 0;
  padding: 1rem 0.9rem;
  border-radius: var(--radius-md);
  border: 1px solid ${({ $active }) => ($active ? "var(--b-accent)" : "var(--b-line)")};
  background: ${({ $active }) => ($active ? "var(--b-hero-bg)" : "var(--b-surface)")};
  color: ${({ $active }) => ($active ? "var(--b-hero-text)" : "var(--b-text)")};
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

  &:focus-visible {
    outline: 2px solid var(--b-accent);
    outline-offset: 2px;
  }

  strong {
    display: block;
    font-family: var(--b-head);
    font-size: 1.05rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  /* The playhead fill while the rehearsal runs through this part. */
  i {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 4px;
    background: var(--b-accent);
    transform-origin: left;
  }

  @container brief-body (max-width: 560px) {
    flex-grow: 0 !important;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
`;

const PlayRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  margin-bottom: 0.75rem;
`;

const PlayButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--b-accent);
  color: var(--b-accent-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.25s ${ease};

  &:hover {
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--b-text);
    outline-offset: 2px;
  }
`;

const Clock = styled.span`
  font-family: var(--b-head);
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const CriteriaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

/** One second of rehearsal per minute of presentation. */
const SECONDS_PER_MINUTE = 1;

const mmss = (minutes: number) => {
  const whole = Math.floor(minutes);
  const seconds = Math.floor((minutes - whole) * 60);
  return `${String(whole).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const PresentationSection = ({
  brief,
  rubric,
}: {
  brief: ResolvedBrief;
  rubric: RubricItem[];
}) => {
  const parts = brief.presentation;
  const total = parts.reduce((sum, p) => sum + p.minutes, 0);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef(0);

  // Offsets of each part, in minutes.
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((s, p) => s + p.minutes, 0));

  useEffect(() => {
    if (!playing) return;
    const began = performance.now() - elapsed * SECONDS_PER_MINUTE * 1000;
    const tick = (time: number) => {
      const minutes = (time - began) / (SECONDS_PER_MINUTE * 1000);
      if (minutes >= total) {
        setElapsed(total);
        setPlaying(false);
        return;
      }
      setElapsed(minutes);
      let part = 0;
      starts.forEach((s, i) => {
        if (s <= minutes) part = i;
      });
      setActive(part);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only on play/pause
  }, [playing]);

  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (elapsed >= total) setElapsed(0);
    setPlaying(true);
  };

  const byKey = new Map(rubric.map((item) => [item.key, item]));
  const part = parts[active];

  return (
    <>
      <PlayRow data-animate="fade-up">
        <PlayButton type="button" onClick={play} aria-pressed={playing}>
          <Icon icon={playing ? "mdi:pause" : elapsed >= total ? "mdi:replay" : "mdi:play"} aria-hidden />
          {playing ? "Pause" : elapsed >= total ? "Run it again" : "Run through it"}
        </PlayButton>
        <Clock aria-live="off">
          {mmss(elapsed)} <small style={{ fontSize: "0.9rem", opacity: 0.6 }}>/ {mmss(total)}</small>
        </Clock>
        <span style={{ color: "var(--b-muted)", fontSize: "0.9rem" }}>
          {total} minutes, sped up to {total * SECONDS_PER_MINUTE} seconds
        </span>
      </PlayRow>
      <AgendaBar role="group" aria-label="Presentation parts">
        {parts.map((p, i) => {
          const fill = Math.min(1, Math.max(0, (elapsed - starts[i]) / p.minutes));
          return (
            <AgendaPart
              key={p.title}
              type="button"
              style={{ flexGrow: p.minutes }}
              $active={i === active}
              aria-pressed={i === active}
              onClick={() => {
                setPlaying(false);
                setActive(i);
                setElapsed(starts[i]);
              }}
            >
              <strong>{p.title}</strong>
              <small>{p.minutes} min</small>
              <i style={{ width: "100%", transform: `scaleX(${fill})` } as CSSProperties} aria-hidden />
            </AgendaPart>
          );
        })}
      </AgendaBar>
      {part && (
        <Panel key={active} style={{ marginTop: "1rem" }} aria-live="polite">
          <p style={{ color: "var(--b-text)", margin: 0 }}>
            <strong>{part.title}</strong> · {part.minutes} min — {rich(part.text)}
          </p>
          {part.criteria.length > 0 && (
            <>
              <CriteriaList>
                {part.criteria.map((key) => {
                  const item = byKey.get(key);
                  const meta = DISCIPLINE_META[item?.discipline ?? "general"];
                  return (
                    <Pill key={key} $color={meta.color} $background={meta.background} title={item?.description}>
                      {item?.title ?? key.replace(/-/g, " ")}
                    </Pill>
                  );
                })}
              </CriteriaList>
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem" }}>
                Scored here: {part.criteria.length} of the {rubric.length} criteria.
              </p>
            </>
          )}
        </Panel>
      )}
      {brief.presentationNote && (
        <p style={{ margin: "1.25rem 0 0", color: "var(--b-muted)" }}>{rich(brief.presentationNote)}</p>
      )}
    </>
  );
};
