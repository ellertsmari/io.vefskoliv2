"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { DISCIPLINE_META } from "constants/groupWork";
import type { RubricItem } from "constants/groupWork";
import { rich } from "./Rich";

/*
 * The brief's sections, one component each. Every one is about a screen
 * tall, and the ones that are about time or numbers can be played with:
 * pick a phase, play the presentation, tick what you'll build.
 */

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
const DAY = 24 * 60 * 60 * 1000;

export const dateFmt = (iso: string | number, opts: Intl.DateTimeFormatOptions) =>
  // Iceland is UTC all year; pinning it keeps server and browser identical.
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

/* ------------------------------ Shared bits ------------------------------ */

const Lead = styled.p`
  margin: 0 0 clamp(1.5rem, 3vw, 2.25rem);
  font-family: var(--b-head);
  font-size: clamp(1.5rem, 3.2vw, 2.4rem);
  line-height: 1.2;
  letter-spacing: -0.01em;
  max-width: 28ch;
  text-wrap: balance;
`;

const CardGrid = styled.div<{ $min?: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${({ $min }) => $min ?? "11rem"}, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: var(--b-surface);
  border: 1px solid var(--b-line);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.25rem 1.1rem;
  transition: transform 0.35s ${ease}, box-shadow 0.35s ${ease}, border-color 0.35s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--b-accent) 45%, var(--b-line));
    box-shadow: 0 14px 30px -18px color-mix(in srgb, var(--b-text) 40%, transparent);
  }

  > svg {
    font-size: 1.6rem;
    color: var(--b-accent);
  }

  h3 {
    margin: 0.6rem 0 0.35rem;
    font-family: var(--b-head);
    font-size: 1.15rem;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: var(--b-muted);
    font-size: 0.97rem;
    line-height: 1.5;
  }
`;

const SubHead = styled.h3`
  margin: clamp(1.75rem, 4vw, 2.5rem) 0 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--b-muted);
`;

const Pill = styled.span<{ $color?: string; $background?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $color }) => $color ?? "var(--b-text)"};
  background: ${({ $background }) => $background ?? "var(--b-soft)"};
`;

const Prose = styled.div`
  p {
    margin: 0 0 1rem;
  }
  a {
    color: var(--b-accent);
    text-underline-offset: 3px;
  }
  code {
    font-size: 0.9em;
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    background: var(--b-soft);
  }
`;

/* -------------------------------- Mission -------------------------------- */

const MissionGrid = styled.div<{ $aside: boolean }>`
  display: grid;
  grid-template-columns: ${({ $aside }) => ($aside ? "minmax(0, 1.25fr) minmax(0, 1fr)" : "minmax(0, 46rem)")};
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
  margin-bottom: clamp(1.75rem, 4vw, 2.5rem);

  @container brief-body (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Aside = styled.aside`
  position: relative;
  padding: 1.4rem 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--b-hero-bg);
  color: var(--b-hero-text);
  font-size: 0.97rem;
  line-height: 1.6;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: auto -30% -60% auto;
    width: 70%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--b-accent) 55%, transparent), transparent);
    pointer-events: none;
  }

  h3 {
    position: relative;
    margin: 0 0 0.6rem;
    font-family: var(--b-head);
    font-size: 1.2rem;
    line-height: 1.2;
  }

  p {
    position: relative;
    margin: 0;
    opacity: 0.92;
  }
`;

const Media = styled.figure`
  margin: 0 0 clamp(1.75rem, 4vw, 2.5rem);

  iframe,
  img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 0;
    border-radius: var(--radius-lg);
    object-fit: cover;
    background: var(--b-soft);
  }

  figcaption {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: var(--b-muted);
  }
`;

export const MissionSection = ({ brief }: { brief: ResolvedBrief }) => {
  const { mission } = brief;
  return (
    <>
      <Lead data-animate="fade-up">{rich(mission.statement)}</Lead>
      <MissionGrid $aside={!!mission.aside}>
        <Prose data-animate="fade-up">
          {mission.paragraphs.map((text, index) => (
            <p key={index}>{rich(text)}</p>
          ))}
        </Prose>
        {mission.aside && (
          <Aside data-animate="slide-left">
            <h3>{mission.aside.title}</h3>
            <p>{rich(mission.aside.text)}</p>
          </Aside>
        )}
      </MissionGrid>
      {mission.media && (
        <Media data-animate="blur-in">
          {mission.media.type === "youtube" ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(mission.media.id)}`}
              title={mission.media.title}
              allow="accelerometer; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- any https host */}
              <img src={mission.media.src} alt={mission.media.alt} loading="lazy" />
              {mission.media.caption && <figcaption>{mission.media.caption}</figcaption>}
            </>
          )}
        </Media>
      )}
      <CardGrid data-stagger="80">
        {mission.goals.map((goal) => (
          <Card key={goal.title}>
            <Icon icon={goal.icon} aria-hidden />
            <h3>{goal.title}</h3>
            <p>{rich(goal.text)}</p>
          </Card>
        ))}
      </CardGrid>
    </>
  );
};

/* ------------------------------ Requirements ----------------------------- */

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid ${({ $active }) => ($active ? "var(--b-accent)" : "var(--b-line)")};
  background: ${({ $active }) => ($active ? "var(--b-accent)" : "var(--b-surface)")};
  color: ${({ $active }) => ($active ? "var(--b-accent-text)" : "var(--b-text)")};
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.25s ${ease};

  &:hover {
    transform: translateY(-1px);
    border-color: var(--b-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--b-accent);
    outline-offset: 2px;
  }
`;

const Panel = styled.div`
  background: var(--b-surface);
  border: 1px solid var(--b-line);
  border-radius: var(--radius-lg);
  padding: clamp(1.1rem, 3vw, 1.75rem);
  animation: brief-panel-in 0.45s ${ease};

  @keyframes brief-panel-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  > p {
    margin: 0 0 0.9rem;
    color: var(--b-muted);
  }
`;

const Checks = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;

  li {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    line-height: 1.5;
  }

  li > svg {
    flex: none;
    margin-top: 0.2rem;
    color: var(--b-accent);
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const Toggle = styled.label<{ $on: boolean }>`
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  line-height: 1.45;
  background: ${({ $on }) => ($on ? "var(--b-soft)" : "transparent")};
  transition: background-color 0.25s ease;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  svg {
    flex: none;
    margin-top: 0.1rem;
    font-size: 1.2rem;
    color: ${({ $on }) => ($on ? "var(--b-accent)" : "var(--b-muted)")};
    transition: transform 0.3s ${ease};
    transform: scale(${({ $on }) => ($on ? 1.1 : 1)});
  }

  &:has(input:focus-visible) {
    outline: 2px solid var(--b-accent);
  }
`;

const Meter = styled.div<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.25rem 0 1rem;
  font-weight: 700;

  > div {
    flex: 1;
    height: 8px;
    border-radius: 99px;
    background: var(--b-soft);
    overflow: hidden;
  }

  > div > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: ${({ $done }) => ($done ? "var(--b-accent)" : "color-mix(in srgb, var(--b-accent) 55%, var(--b-muted))")};
    transition: width 0.45s ${ease};
  }
`;

const useChecks = (count: number) => {
  const [checked, setChecked] = useState<boolean[]>(() => Array(count).fill(false));
  const toggle = (index: number) =>
    setChecked((current) => current.map((value, i) => (i === index ? !value : value)));
  return [checked, toggle] as const;
};

const PickList = ({ list }: { list: NonNullable<ResolvedBrief["pickList"]> }) => {
  const [checked, toggle] = useChecks(list.items.length);
  const count = checked.filter(Boolean).length;
  const done = count >= list.minimum;
  return (
    <Panel style={{ marginTop: "1rem" }}>
      <p>{rich(list.intro)}</p>
      <Meter $done={done} aria-live="polite">
        <div>
          <span style={{ width: `${Math.min(1, count / list.minimum) * 100}%` }} />
        </div>
        {done ? (
          <span>
            <Icon icon="mdi:check-decagram" aria-hidden /> {count} — enough
          </span>
        ) : (
          <span>
            {count} of {list.minimum}
          </span>
        )}
      </Meter>
      <Columns style={{ marginTop: 0, gap: "0.15rem 1rem" }}>
        {list.items.map((item, index) => (
          <Toggle key={item} $on={checked[index]}>
            <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} />
            <Icon icon={checked[index] ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"} aria-hidden />
            <span>{rich(item)}</span>
          </Toggle>
        ))}
      </Columns>
    </Panel>
  );
};

const HandIn = ({ items }: { items: string[] }) => {
  const [checked, toggle] = useChecks(items.length);
  return (
    <Card as="div" style={{ transform: "none" }}>
      <Icon icon="mdi:package-variant-closed-check" aria-hidden />
      <h3>What you hand in</h3>
      <div style={{ marginTop: "0.4rem" }}>
        {items.map((item, index) => (
          <Toggle key={item} $on={checked[index]} style={{ paddingInline: "0.4rem" }}>
            <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} />
            <Icon icon={checked[index] ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"} aria-hidden />
            <span>{rich(item)}</span>
          </Toggle>
        ))}
      </div>
    </Card>
  );
};

export const RequirementsSection = ({ brief }: { brief: ResolvedBrief }) => {
  const [active, setActive] = useState(0);
  return (
    <>
      <Tabs role="tablist" aria-label="Requirement areas" data-animate="fade-up">
        {brief.requirements.map((req, index) => (
          <Tab
            key={req.label}
            type="button"
            role="tab"
            aria-selected={index === active}
            $active={index === active}
            onClick={() => setActive(index)}
          >
            <Icon icon={req.icon} aria-hidden /> {req.label}
          </Tab>
        ))}
      </Tabs>
      {/* Every area stays in the page for search engines; only one shows. */}
      {brief.requirements.map((req, index) => (
        <Panel key={req.label} role="tabpanel" hidden={index !== active} aria-label={req.label}>
          {req.intro && <p>{rich(req.intro)}</p>}
          <Checks>
            {req.items.map((item) => (
              <li key={item}>
                <Icon icon="mdi:check-circle" aria-hidden />
                <span>{rich(item)}</span>
              </li>
            ))}
          </Checks>
        </Panel>
      ))}

      {brief.pickList && (
        <>
          <SubHead>{brief.pickList.title}</SubHead>
          <PickList list={brief.pickList} />
        </>
      )}

      <Columns data-stagger="90">
        <HandIn items={brief.handIn} />
        {brief.bonus && (
          <Card style={{ transform: "none" }}>
            <Icon icon="mdi:star-four-points-outline" aria-hidden />
            <h3>{brief.bonus.title}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
              {brief.bonus.items.map((item) => (
                <Pill key={item}>{rich(item)}</Pill>
              ))}
            </div>
          </Card>
        )}
      </Columns>
    </>
  );
};

/* --------------------------------- Ideas --------------------------------- */

export const IdeasSection = ({ brief }: { brief: ResolvedBrief }) => (
  <>
    <CardGrid $min="15rem" data-stagger="80">
      {brief.ideas.map((idea) => (
        <Card key={idea.title}>
          <Icon icon={idea.icon} aria-hidden />
          <h3>{idea.title}</h3>
          <p>{rich(idea.text)}</p>
        </Card>
      ))}
    </CardGrid>
    {brief.ideasNote && (
      <p style={{ margin: "1.25rem 0 0", color: "var(--b-muted)" }} data-animate="fade-up">
        <Icon icon="mdi:lightbulb-on-outline" aria-hidden /> {rich(brief.ideasNote)}
      </p>
    )}
  </>
);

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

/* ---------------------------------- FAQ ---------------------------------- */

const Faq = styled.div`
  display: grid;
  gap: 0.6rem;

  details {
    background: var(--b-surface);
    border: 1px solid var(--b-line);
    border-radius: var(--radius-md);
    padding: 0 1.1rem;
    transition: border-color 0.25s ease;
  }

  details[open] {
    border-color: color-mix(in srgb, var(--b-accent) 50%, var(--b-line));
  }

  summary {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.95rem 0;
    font-weight: 700;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary svg {
    flex: none;
    color: var(--b-accent);
    transition: transform 0.3s ${ease};
  }

  details[open] summary svg {
    transform: rotate(45deg);
  }

  details p {
    margin: 0 0 1rem;
    color: var(--b-muted);
  }
`;

export const FaqSection = ({ brief }: { brief: ResolvedBrief }) => (
  <Faq data-stagger="60">
    {brief.faq.map((item) => (
      <details key={item.question}>
        <summary>
          {item.question}
          <Icon icon="mdi:plus" aria-hidden />
        </summary>
        <p>{rich(item.answer)}</p>
      </details>
    ))}
  </Faq>
);
