"use client";

import styled from "styled-components";

/** The Meetings dialog: wider than a form, since it holds lists and grids. */
export const MeetingsCard = styled.div`
  background: var(--primary-white);
  border-radius: var(--radius-lg);
  width: min(100%, 720px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

export const DialogHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--primary-black-10);
`;

export const DialogTitle = styled.h2`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--primary-black-100);
  overflow-wrap: anywhere;
`;

export const IconButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.6rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  background: var(--primary-white);
  color: var(--primary-black-100);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--theme-module3-10);
    border-color: var(--theme-module3-30);
  }
`;

export const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--primary-black-60);
`;

export const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const PrimaryButton = styled.button`
  border: 1px solid var(--theme-module3-100);
  background: var(--theme-module3-100);
  color: var(--primary-white);
  border-radius: var(--radius-pill);
  padding: 0.5rem 1.1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--theme-module3-hover);
    border-color: var(--theme-module3-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const QuietButton = styled.button<{ $danger?: boolean }>`
  border: 1px solid
    ${({ $danger }) =>
      $danger ? "var(--error-failure-100)" : "var(--primary-black-30)"};
  background: var(--primary-white);
  color: ${({ $danger }) =>
    $danger ? "var(--error-failure-100)" : "var(--primary-black-100)"};
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.85rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--primary-black-5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

// ── Home: the list ────────────────────────────────────────────────────────

export const RowList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/** One meeting in the list. A button when it opens something. */
export const MeetingRow = styled.button<{ $attention?: boolean }>`
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  text-align: left;
  font: inherit;
  color: var(--primary-black-100);
  border: 1px solid
    ${({ $attention }) =>
      $attention ? "var(--theme-module3-60)" : "var(--primary-black-10)"};
  border-radius: var(--radius-md);
  background: ${({ $attention }) =>
    $attention ? "var(--theme-module3-10)" : "var(--primary-white)"};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--theme-module3-100);
  }

  &:disabled {
    cursor: default;
  }
`;

export const RowWhen = styled.span`
  display: flex;
  flex-direction: column;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);

  strong {
    font-size: var(--text-sm);
    color: var(--primary-black-100);
  }
`;

export const RowBody = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.1rem;
`;

export const RowTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  overflow-wrap: anywhere;
`;

export const RowSub = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  overflow-wrap: anywhere;
`;

export const RowAction = styled.span<{ $strong?: boolean }>`
  font-size: var(--text-xs);
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $strong }) =>
    $strong ? "var(--theme-module3-100)" : "var(--primary-black-60)"};
`;

/** The count on the Meetings button: things waiting for the viewer. */
export const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.4rem;
  padding: 0 0.35rem;
  border-radius: var(--radius-pill);
  background: var(--theme-module3-100);
  color: var(--primary-white);
  font-size: var(--text-xs);
  font-weight: 700;
`;

// ── New meeting: the three kinds ──────────────────────────────────────────

export const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const ChoiceCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem;
  text-align: left;
  font: inherit;
  color: var(--primary-black-100);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  background: var(--primary-white);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover:not(:disabled) {
    border-color: var(--theme-module3-100);
    background: var(--theme-module3-10);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

export const ChoiceIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md);
  background: var(--theme-module3-10);
  color: var(--theme-module3-100);
  font-size: 1.25rem;
`;

export const ChoiceTitle = styled.span`
  font-size: var(--text-base);
  font-weight: 700;
`;

export const ChoiceText = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

// ── Slots ─────────────────────────────────────────────────────────────────

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
`;

export const CheckLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  cursor: pointer;
`;

/** A slot in the "new sheet" preview: on, off, or greyed because it clashes. */
export const PreviewChip = styled.button<{ $on: boolean; $taken: boolean }>`
  border: 1px solid
    ${({ $on }) => ($on ? "var(--theme-module3-100)" : "var(--primary-black-30)")};
  background: ${({ $on, $taken }) =>
    $on
      ? "var(--theme-module3-10)"
      : $taken
        ? "repeating-linear-gradient(135deg, transparent 0 4px, var(--primary-black-10) 4px 6px)"
        : "var(--primary-white)"};
  color: ${({ $on }) =>
    $on ? "var(--primary-black-100)" : "var(--primary-black-60)"};
  text-decoration: ${({ $on }) => ($on ? "none" : "line-through")};
  border-radius: var(--radius-pill);
  padding: 0.3rem 0.7rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: var(--theme-module3-100);
  }
`;

export const SlotList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  overflow: hidden;
`;

export const SlotRow = styled.li<{ $mine?: boolean; $dim?: boolean }>`
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.8rem;
  background: ${({ $mine }) =>
    $mine ? "var(--theme-module3-10)" : "var(--primary-white)"};
  opacity: ${({ $dim }) => ($dim ? 0.55 : 1)};

  & + & {
    border-top: 1px solid var(--primary-black-10);
  }

  @media (max-width: 520px) {
    grid-template-columns: 5.5rem minmax(0, 1fr);

    & > :last-child {
      grid-column: 1 / -1;
    }
  }
`;

export const SlotTime = styled.span`
  font-size: var(--text-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary-black-100);
`;

export const SlotWho = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  overflow-wrap: anywhere;

  small {
    font-size: var(--text-xs);
    color: var(--primary-black-60);
  }
`;

export const SlotActions = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
`;

export const Pill = styled.span<{ $tone?: "mine" | "free" | "muted" }>`
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 700;
  white-space: nowrap;
  background: ${({ $tone }) =>
    $tone === "mine"
      ? "var(--theme-module3-100)"
      : $tone === "free"
        ? "var(--error-success-30)"
        : "var(--primary-black-10)"};
  color: ${({ $tone }) =>
    $tone === "mine" ? "var(--primary-white)" : "var(--primary-black-100)"};
`;

/** A coloured strip that says where the viewer stands on a sheet. */
export const Notice = styled.div<{ $tone?: "info" | "done" | "warn" }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  background: ${({ $tone }) =>
    $tone === "done"
      ? "var(--error-success-10)"
      : $tone === "warn"
        ? "var(--error-warning-10)"
        : "var(--theme-module3-10)"};
  border: 1px solid
    ${({ $tone }) =>
      $tone === "done"
        ? "var(--error-success-60)"
        : $tone === "warn"
          ? "var(--error-warning-60)"
          : "var(--theme-module3-30)"};
`;

export const InlineForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem;
`;

export const SmallInput = styled.input`
  width: 5.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--text-sm);
`;

export const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--primary-black-10);
`;

export const Tab = styled.button<{ $active: boolean }>`
  border: none;
  background: transparent;
  padding: 0.5rem 0.8rem;
  margin-bottom: -1px;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  color: ${({ $active }) =>
    $active ? "var(--primary-black-100)" : "var(--primary-black-60)"};
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "var(--theme-module3-100)" : "transparent")};
`;
