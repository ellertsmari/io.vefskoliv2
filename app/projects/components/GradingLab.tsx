"use client";

import { CSSProperties, useMemo, useState } from "react";
import styled from "styled-components";
import {
  CONTRIBUTION_SCORES,
  DISCIPLINE_META,
  EVALUATION_MAX_SCORE,
  PEER_SCORE_VALUES,
  RubricDiscipline,
  TEAMBUILDING_SCORES,
  clampGrade,
  peerGradeFactor,
  round1,
} from "constants/groupWork";
import type { RubricItem } from "constants/groupWork";

/*
 * How a grade is made, as something to play with rather than a paragraph to
 * believe: score a team on the real rubric, see how the two juries blend, and
 * see what your teammates' ratings do to your own grade. Every number comes
 * from the same functions the LMS grades with (constants/groupWork).
 */

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
const DISCIPLINES: RubricDiscipline[] = ["design", "code", "general"];

const Lab = styled.div`
  background: var(--b-surface);
  border: 1px solid var(--b-line);
  border-radius: var(--radius-xl);
  overflow: hidden;
`;

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--b-line);

  @container brief-body (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Step = styled.button<{ $active: boolean }>`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.25rem;
  border: none;
  border-bottom: 3px solid ${({ $active }) => ($active ? "var(--b-accent)" : "transparent")};
  background: ${({ $active }) => ($active ? "var(--b-soft)" : "transparent")};
  color: var(--b-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.25s ease, border-color 0.25s ease;

  &:focus-visible {
    outline: 2px solid var(--b-accent);
    outline-offset: -2px;
  }

  b {
    flex: none;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: ${({ $active }) => ($active ? "var(--b-accent)" : "var(--b-soft)")};
    color: ${({ $active }) => ($active ? "var(--b-accent-text)" : "var(--b-text)")};
    font-variant-numeric: tabular-nums;
  }

  span {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }

  small {
    color: var(--b-muted);
    font-size: 0.82rem;
  }
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
  gap: clamp(1.25rem, 3vw, 2rem);
  padding: clamp(1.1rem, 3vw, 1.75rem);
  align-items: start;

  @container brief-body (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }

  /* display: grid would otherwise beat the hidden attribute. */
  &[hidden] {
    display: none;
  }

  > div > p:first-child {
    margin-top: 0;
  }
`;

const Result = styled.div`
  position: sticky;
  top: 4.5rem;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  background: var(--b-hero-bg);
  color: var(--b-hero-text);

  @container brief-body (max-width: 760px) {
    position: static;
    order: -1;
  }

  small {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  strong {
    display: block;
    margin: 0.25rem 0 0.5rem;
    font-family: var(--b-head);
    font-size: clamp(3rem, 7vw, 4.25rem);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  p {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.88;
  }
`;

const Gauge = styled.div`
  height: 8px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--b-hero-text) 18%, transparent);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--b-accent);
    transition: width 0.35s ${ease};
  }
`;

const Shares = styled.div`
  display: flex;
  height: 10px;
  border-radius: 99px;
  overflow: hidden;
  margin: 0.9rem 0 0.4rem;

  span {
    transition: flex-grow 0.35s ${ease};
  }
`;

const Group = styled.div<{ $color: string }>`
  border: 1px solid var(--b-line);
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;

  > header {
    display: grid;
    grid-template-columns: minmax(9rem, 1fr) minmax(7rem, 12rem) 2.75rem auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 0.9rem;
  }

  > header > span:first-child {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }

  > header small {
    color: var(--b-muted);
    font-size: 0.82rem;
  }

  @container brief-body (max-width: 620px) {
    > header {
      grid-template-columns: minmax(0, 1fr) 2.75rem auto;
    }
    > header input {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

const Expand = styled.button`
  border: 1px solid var(--b-line);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--b-muted);
  font: inherit;
  font-size: 0.82rem;
  padding: 0.25rem 0.65rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--b-text);
    border-color: var(--b-accent);
  }
`;

const Rows = styled.div`
  border-top: 1px solid var(--b-line);
  padding: 0.35rem 0.9rem 0.6rem;
`;

const Row = styled.label`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 13rem) 2.75rem;
  gap: 0.75rem;
  align-items: center;
  padding: 0.45rem 0;
  font-size: 0.95rem;

  span:first-child {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  small {
    color: var(--b-muted);
    font-size: 0.8rem;
  }

  @container brief-body (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr) 2.75rem;
    input {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

const Value = styled.output`
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const Slider = styled.input.attrs({ type: "range" })<{ $color?: string }>`
  width: 100%;
  accent-color: ${({ $color }) => $color ?? "var(--b-accent)"};
  cursor: pointer;
`;

const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0 0 1rem;

  button {
    border: 1px solid var(--b-line);
    border-radius: var(--radius-pill);
    background: var(--b-surface);
    color: var(--b-text);
    font: inherit;
    font-size: 0.88rem;
    padding: 0.35rem 0.85rem;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.25s ${ease};
  }

  button:hover {
    border-color: var(--b-accent);
    transform: translateY(-1px);
  }
`;

const Jury = styled.div`
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
`;

const JuryRow = styled.label`
  display: grid;
  grid-template-columns: minmax(9rem, 13rem) minmax(0, 1fr) 2.75rem;
  gap: 0.75rem;
  align-items: center;

  span {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
    font-weight: 600;
  }

  small {
    color: var(--b-muted);
    font-weight: 400;
    font-size: 0.82rem;
  }

  @container brief-body (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr) 2.75rem;
    input {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

const Blend = styled.div`
  display: flex;
  height: 2.5rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--b-line);
  font-size: 0.85rem;
  font-weight: 700;

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    transition: flex-grow 0.35s ${ease};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: auto repeat(5, minmax(0, 1fr));
  gap: 4px;
  margin: 0.5rem 0 0.75rem;
  font-size: 0.8rem;

  > span {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--b-muted);
    text-align: center;
    line-height: 1.1;
  }
`;

const Cell = styled.button<{ $active: boolean }>`
  aspect-ratio: 1.35;
  min-height: 2.4rem;
  border-radius: 8px;
  border: 2px solid ${({ $active }) => ($active ? "var(--b-text)" : "transparent")};
  color: #111;
  font: inherit;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transform: scale(${({ $active }) => ($active ? 1.08 : 1)});
  transition: transform 0.25s ${ease}, border-color 0.2s ease;

  &:focus-visible {
    outline: 2px solid var(--b-accent);
    outline-offset: 2px;
  }
`;

const Sum = styled.p`
  margin: 0.75rem 0 0;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  background: var(--b-soft);
  font-variant-numeric: tabular-nums;
  line-height: 1.6;

  code {
    font-size: 0.92em;
  }
`;

const fmt = (n: number) => n.toFixed(1);
const pct = (factor: number) => {
  const change = Math.round((factor - 1) * 100);
  return change === 0 ? "±0%" : `${change > 0 ? "+" : "−"}${Math.abs(change)}%`;
};

/** Green above 1, red below, by how far. */
const factorColor = (factor: number) => {
  if (factor >= 1) {
    const t = Math.min(1, (factor - 1) / 0.3);
    return `color-mix(in srgb, #2fbf71 ${Math.round(25 + t * 75)}%, #f1f3f5)`;
  }
  const t = Math.min(1, (1 - factor) / 0.7);
  return `color-mix(in srgb, #ef5350 ${Math.round(25 + t * 75)}%, #f1f3f5)`;
};

type Props = { rubric: RubricItem[]; panelWeight: number };

export const GradingLab = ({ rubric, panelWeight }: Props) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(rubric.map((item) => [item.key, 7]))
  );
  const [open, setOpen] = useState<RubricDiscipline | null>(null);
  const [panel, setPanel] = useState(8);
  const [audience, setAudience] = useState(6);
  const [contribution, setContribution] = useState(0);
  const [teamwork, setTeamwork] = useState(0);

  const groups = useMemo(
    () =>
      DISCIPLINES.map((discipline) => ({
        discipline,
        meta: DISCIPLINE_META[discipline],
        items: rubric.filter((item) => (item.discipline ?? "general") === discipline),
      })).filter((group) => group.items.length > 0),
    [rubric]
  );

  const team = rubric.length
    ? rubric.reduce((sum, item) => sum + (scores[item.key] ?? 0), 0) / rubric.length
    : 0;
  const groupAvg = (items: RubricItem[]) =>
    items.reduce((sum, item) => sum + (scores[item.key] ?? 0), 0) / items.length;
  const setGroup = (items: RubricItem[], value: number) =>
    setScores((current) => ({
      ...current,
      ...Object.fromEntries(items.map((item) => [item.key, value])),
    }));
  const preset = (by: Partial<Record<RubricDiscipline, number>>) =>
    setScores(
      Object.fromEntries(rubric.map((item) => [item.key, by[item.discipline ?? "general"] ?? 7]))
    );

  const panelPercent = Math.round(panelWeight * 100);
  const blended = round1(panelWeight * panel + (1 - panelWeight) * audience);

  const factor = peerGradeFactor(contribution, teamwork);
  const p = (contribution + 2) * (teamwork + 2) - 4;
  const raw = team * factor;
  const grade = clampGrade(raw);

  const stepInfo = [
    { title: "Score a team", hint: `${rubric.length} criteria, 0–10 each` },
    { title: "Two juries", hint: `Panel ${panelPercent}% · audience ${100 - panelPercent}%` },
    { title: "Your own grade", hint: "Contribution × teamwork" },
  ];

  return (
    <Lab data-animate="fade-up">
      <Steps role="tablist" aria-label="How grading works">
        {stepInfo.map((info, index) => (
          <Step
            key={info.title}
            type="button"
            role="tab"
            aria-selected={step === index}
            $active={step === index}
            onClick={() => setStep(index)}
          >
            <b>{index + 1}</b>
            <span>
              <strong>{info.title}</strong>
              <small>{info.hint}</small>
            </span>
          </Step>
        ))}
      </Steps>

      {/* 1 — the team's result is the plain mean of every criterion. */}
      <Body role="tabpanel" hidden={step !== 0}>
        <div>
          <p>
            Teachers, invited industry judges and the other students score your
            team from 0 to 10 on each criterion. <strong>Every criterion counts
            the same</strong>, so an area with more criteria carries more of the
            grade. Drag the sliders and watch the result.
          </p>
          <Presets>
            <button type="button" onClick={() => preset({})}>All 7s</button>
            <button type="button" onClick={() => preset({ design: 9, code: 4, general: 7 })}>
              Great design, weak code
            </button>
            <button type="button" onClick={() => preset({ design: 4, code: 9, general: 7 })}>
              Great code, weak design
            </button>
            <button type="button" onClick={() => preset({ design: 8, code: 8, general: 4 })}>
              Strong product, shaky presentation
            </button>
          </Presets>
          {groups.map(({ discipline, meta, items }) => {
            const avg = groupAvg(items);
            const expanded = open === discipline;
            return (
              <Group key={discipline} $color={meta.color}>
                <header>
                  <span>
                    <strong style={{ color: meta.color }}>{meta.label}</strong>
                    <small>
                      {items.length} criteria · {Math.round((items.length / rubric.length) * 100)}% of grade
                    </small>
                  </span>
                  <Slider
                    $color={meta.color}
                    min={0}
                    max={EVALUATION_MAX_SCORE}
                    step={0.5}
                    value={round1(avg)}
                    onChange={(e) => setGroup(items, Number(e.target.value))}
                    aria-label={`${meta.label}: all criteria`}
                  />
                  <Value>{fmt(avg)}</Value>
                  <Expand type="button" onClick={() => setOpen(expanded ? null : discipline)} aria-expanded={expanded}>
                    {expanded ? "Hide" : "Each criterion"}
                  </Expand>
                </header>
                <Rows hidden={!expanded}>
                  {items.map((item) => (
                    <Row key={item.key}>
                      <span>
                        {item.title}
                        {item.description && <small>{item.description}</small>}
                      </span>
                      <Slider
                        $color={meta.color}
                        min={0}
                        max={EVALUATION_MAX_SCORE}
                        step={0.5}
                        value={scores[item.key] ?? 0}
                        onChange={(e) =>
                          setScores((current) => ({ ...current, [item.key]: Number(e.target.value) }))
                        }
                      />
                      <Value>{fmt(scores[item.key] ?? 0)}</Value>
                    </Row>
                  ))}
                </Rows>
              </Group>
            );
          })}
        </div>
        <Result aria-live="polite">
          <small>Team result</small>
          <strong>{fmt(team)}</strong>
          <Gauge>
            <span style={{ width: `${(team / EVALUATION_MAX_SCORE) * 100}%` }} />
          </Gauge>
          <Shares aria-hidden>
            {groups.map(({ discipline, meta, items }) => (
              <span key={discipline} style={{ flexGrow: items.length, background: meta.color }} />
            ))}
          </Shares>
          <p>
            The mean of all {rubric.length} criteria. The bar above shows how
            much of it each area carries.
          </p>
          <p>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", textDecoration: "underline", cursor: "pointer" }}
            >
              Now see your own grade →
            </button>
          </p>
        </Result>
      </Body>

      {/* 2 — each criterion blends the panel and the audience. */}
      <Body role="tabpanel" hidden={step !== 1}>
        <div>
          <p>
            Each criterion&apos;s score blends two juries. The <strong>panel</strong> —
            your teachers and the invited industry judges — carries{" "}
            <strong>{panelPercent}%</strong>
            {panelPercent < 100 ? (
              <>
                ; the <strong>student audience</strong> carries the other{" "}
                <strong>{100 - panelPercent}%</strong>.
              </>
            ) : (
              <>. The students&apos; scores are feedback and do not count.</>
            )}{" "}
            Try one criterion:
          </p>
          <Jury>
            <JuryRow>
              <span>
                Panel average <small>Teachers and judges</small>
              </span>
              <Slider min={0} max={10} step={0.5} value={panel} onChange={(e) => setPanel(Number(e.target.value))} />
              <Value>{fmt(panel)}</Value>
            </JuryRow>
            <JuryRow>
              <span>
                Audience average <small>The other students</small>
              </span>
              <Slider
                $color="#868e96"
                min={0}
                max={10}
                step={0.5}
                value={audience}
                onChange={(e) => setAudience(Number(e.target.value))}
              />
              <Value>{fmt(audience)}</Value>
            </JuryRow>
          </Jury>
          <Blend aria-hidden>
            <span style={{ flexGrow: panelWeight * panel || 0.001, background: "var(--b-accent)", color: "var(--b-accent-text)" }}>
              {fmt(panelWeight * panel)}
            </span>
            {panelPercent < 100 && (
              <span style={{ flexGrow: (1 - panelWeight) * audience || 0.001, background: "#ced4da", color: "#111" }}>
                {fmt((1 - panelWeight) * audience)}
              </span>
            )}
            <span style={{ flexGrow: Math.max(0.001, 10 - blended), background: "var(--b-soft)" }} />
          </Blend>
          <p style={{ color: "var(--b-muted)", fontSize: "0.92rem" }}>
            A judge invited for design or for code only counts on that area and
            the presentation criteria. If only one jury scored a criterion,
            that jury&apos;s score is used on its own.
          </p>
        </div>
        <Result aria-live="polite">
          <small>This criterion</small>
          <strong>{fmt(blended)}</strong>
          <Gauge>
            <span style={{ width: `${blended * 10}%` }} />
          </Gauge>
          <p>
            {panelPercent}% × {fmt(panel)}
            {panelPercent < 100 && <> + {100 - panelPercent}% × {fmt(audience)}</>}
          </p>
        </Result>
      </Body>

      {/* 3 — the individual grade: team result × the peer factor. */}
      <Body role="tabpanel" hidden={step !== 2}>
        <div>
          <p>
            After the presentations you rate each teammate on{" "}
            <strong>contribution</strong> and <strong>teamwork</strong>, from −2
            to +2. Your teachers read the ratings and confirm your figures, and
            those turn the team result into <strong>your</strong> grade. Pick a
            square:
          </p>
          <Presets>
            <button type="button" onClick={() => { setContribution(0); setTeamwork(0); }}>Average on both</button>
            <button type="button" onClick={() => { setContribution(1); setTeamwork(1); }}>Strong team player</button>
            <button type="button" onClick={() => { setContribution(2); setTeamwork(-2); }}>Carried the code, alone</button>
            <button type="button" onClick={() => { setContribution(-2); setTeamwork(-2); }}>Passenger</button>
          </Presets>
          <Grid role="group" aria-label="Contribution across, teamwork down">
            <span />
            {PEER_SCORE_VALUES.map((c) => (
              <span key={c} title={CONTRIBUTION_SCORES[c].label}>
                {c > 0 ? `+${c}` : c}
              </span>
            ))}
            {[...PEER_SCORE_VALUES].reverse().map((t) => (
              <Row2 key={t} t={t} contribution={contribution} teamwork={teamwork} pick={(c) => { setContribution(c); setTeamwork(t); }} />
            ))}
          </Grid>
          <p style={{ margin: 0, color: "var(--b-muted)", fontSize: "0.85rem" }}>
            Across: contribution. Down: teamwork. Each square is the change to the team result.
          </p>
          <Sum>
            {CONTRIBUTION_SCORES[contribution].emoji} Contribution{" "}
            <strong>{contribution > 0 ? `+${contribution}` : contribution}</strong> — {CONTRIBUTION_SCORES[contribution].label}
            <br />
            {TEAMBUILDING_SCORES[teamwork].emoji} Teamwork{" "}
            <strong>{teamwork > 0 ? `+${teamwork}` : teamwork}</strong> — {TEAMBUILDING_SCORES[teamwork].label}
            <br />
            <code>
              ({contribution} + 2) × ({teamwork} + 2) − 4 = {p}
            </code>{" "}
            → ×{factor.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} ({pct(factor)})
          </Sum>
          <p style={{ color: "var(--b-muted)", fontSize: "0.92rem" }}>
            The two figures multiply rather than average. Doing all the work
            while shutting the team out (+2, −2) is not “average”: it keeps 30%
            of the grade. The most a grade can rise is +30%; it can fall by
            as much as −70%.
          </p>
        </div>
        <Result aria-live="polite">
          <small>Your grade</small>
          <strong>{fmt(grade)}</strong>
          <Gauge>
            <span style={{ width: `${grade * 10}%` }} />
          </Gauge>
          <p>
            Team result {fmt(team)} × {pct(factor)}
            {raw > EVALUATION_MAX_SCORE ? ` = ${fmt(raw)}, held to ${EVALUATION_MAX_SCORE}` : ""}
          </p>
          <p>
            <button
              type="button"
              onClick={() => setStep(0)}
              style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", textDecoration: "underline", cursor: "pointer" }}
            >
              ← Change the team result
            </button>
          </p>
        </Result>
      </Body>
    </Lab>
  );
};

/** One teamwork row of the contribution × teamwork grid. */
const Row2 = ({
  t,
  contribution,
  teamwork,
  pick,
}: {
  t: number;
  contribution: number;
  teamwork: number;
  pick: (contribution: number) => void;
}) => (
  <>
    <span title={TEAMBUILDING_SCORES[t].label}>{t > 0 ? `+${t}` : t}</span>
    {PEER_SCORE_VALUES.map((c) => {
      const f = peerGradeFactor(c, t);
      const active = c === contribution && t === teamwork;
      return (
        <Cell
          key={c}
          type="button"
          $active={active}
          aria-pressed={active}
          aria-label={`Contribution ${c}, teamwork ${t}: ${pct(f)}`}
          style={{ background: factorColor(f) } as CSSProperties}
          onClick={() => pick(c)}
        >
          {pct(f)}
        </Cell>
      );
    })}
  </>
);
