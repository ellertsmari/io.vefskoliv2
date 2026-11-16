"use client";

import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { rich } from "../Rich";
import { ease, Card, Pill, Panel, Checks } from "./shared";

const SubHead = styled.h3`
  margin: clamp(1.75rem, 4vw, 2.5rem) 0 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--b-muted);
`;

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
