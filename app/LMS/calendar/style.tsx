"use client";

import styled from "styled-components";

export const CalendarContainer = styled.div`
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
`;

export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0;
`;

export const PageSubtitle = styled.p`
  font-size: 1rem;
  color: var(--primary-black-60);
  margin: 0;
`;

export const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  border: 1px solid var(--primary-black-10);
  background: var(--primary-white);
  color: var(--primary-black-100);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--theme-module3-10);
    border-color: var(--theme-module3-30);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export const MonthLabel = styled.span`
  min-width: 9.5rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  list-style: none;
  margin: 0 0 1.25rem 0;
  padding: 0;
`;

export const LegendItem = styled.li<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--primary-black-60);

  &::before {
    content: "";
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 3px;
    background: ${(props) => props.$color};
  }
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: start;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 300px;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 2.25rem repeat(7, minmax(0, 1fr));
  border: 1px solid var(--primary-black-10);
  border-radius: 12px;
  overflow: hidden;
  background: var(--primary-white);
`;

export const Corner = styled.div`
  background: var(--primary-black-5, #f7f7f7);
  border-bottom: 1px solid var(--primary-black-10);
`;

export const WeekdayHead = styled.div`
  padding: 0.6rem 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--primary-black-60);
  background: var(--primary-black-5, #f7f7f7);
  border-bottom: 1px solid var(--primary-black-10);
`;

export const WeekNumCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary-black-30);
  background: var(--primary-black-5, #f7f7f7);
  border-top: 1px solid var(--primary-black-10);
`;

export const DayCell = styled.button<{
  $muted: boolean;
  $weekend: boolean;
  $selected: boolean;
  $today: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem;
  min-height: 6.5rem;
  padding: 0.4rem;
  text-align: left;
  border: none;
  border-top: 1px solid var(--primary-black-10);
  border-left: 1px solid var(--primary-black-10);
  background: ${(props) =>
    props.$muted
      ? "var(--primary-black-5, #fafafa)"
      : props.$weekend
        ? "#fcfcfd"
        : "var(--primary-white)"};
  cursor: ${(props) => (props.$muted ? "default" : "pointer")};
  font: inherit;
  transition: box-shadow 0.12s ease;

  outline: ${(props) =>
    props.$selected ? "2px solid var(--theme-module3-100)" : "none"};
  outline-offset: -2px;
  z-index: ${(props) => (props.$selected ? 1 : 0)};

  &:hover {
    box-shadow: ${(props) =>
      props.$muted ? "none" : "inset 0 0 0 1px var(--theme-module3-30)"};
  }
`;

export const DayNumber = styled.span<{ $muted: boolean; $today: boolean }>`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.25rem;
  font-size: 0.8rem;
  font-weight: ${(props) => (props.$today ? 700 : 500)};
  color: ${(props) =>
    props.$today
      ? "var(--primary-white)"
      : props.$muted
        ? "var(--primary-black-30)"
        : "var(--primary-black-100)"};
  background: ${(props) =>
    props.$today ? "var(--theme-module3-100)" : "transparent"};
  border-radius: 999px;
`;

export const EventPill = styled.span<{ $color: string }>`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0.12rem 0.35rem 0.12rem 0.45rem;
  border-radius: 4px;
  border-left: 3px solid ${(props) => props.$color};
  background: ${(props) => props.$color}1a;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--primary-black-100);
`;

export const MorePill = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary-black-60);
  padding: 0 0.35rem;
`;

// ── Detail panel ──────────────────────────────────────────────────────────

export const Panel = styled.aside`
  border: 1px solid var(--primary-black-10);
  border-radius: 12px;
  background: var(--primary-white);
  padding: 1.25rem;
  position: sticky;
  top: 1rem;
`;

export const PanelDate = styled.h2`
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0 0 0.25rem 0;
`;

export const PanelHint = styled.p`
  font-size: 0.9rem;
  color: var(--primary-black-60);
  margin: 0;
`;

export const EventList = styled.ul`
  list-style: none;
  margin: 0.75rem 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const EventItem = styled.li<{ $color: string }>`
  border-left: 3px solid ${(props) => props.$color};
  padding-left: 0.75rem;
`;

export const EventTitle = styled.p`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
`;

export const EventMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0.2rem 0;
`;

export const CategoryBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(props) => props.$color}26;
  color: ${(props) => props.$color};
`;

export const EventTime = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--primary-black-60);
`;

export const EventDescription = styled.p`
  font-size: 0.85rem;
  color: var(--primary-black-60);
  margin: 0.15rem 0 0 0;
`;

/* ── CRUD additions ──────────────────────────────────────────────────────── */

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const AddEventButton = styled.button`
  border: 1px solid var(--primary-black-100);
  background: var(--primary-black-100);
  color: var(--primary-white);
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

export const PanelAddButton = styled.button`
  margin-top: 0.75rem;
  border: 1px dashed var(--primary-black-60);
  background: transparent;
  color: var(--primary-black-100);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: var(--primary-black-10);
  }
`;

export const OwnerLine = styled.p`
  margin: 0.35rem 0 0 0;
  font-size: 0.75rem;
  color: #777;
`;

export const EventActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

export const SmallActionButton = styled.button<{ $danger?: boolean }>`
  border: 1px solid
    ${({ $danger }) =>
      $danger ? "var(--error-failure-100)" : "var(--primary-black-60)"};
  color: ${({ $danger }) =>
    $danger ? "var(--error-failure-100)" : "var(--primary-black-100)"};
  background: transparent;
  border-radius: 6px;
  padding: 0.2rem 0.7rem;
  font-size: 0.75rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ $danger }) =>
      $danger ? "var(--error-failure-10)" : "var(--primary-black-10)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

/* ── Event form overlay ──────────────────────────────────────────────────── */

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4rem 1rem 2rem;
  overflow-y: auto;
  z-index: 100;
`;

export const FormCard = styled.div`
  background: var(--primary-white);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
`;

export const FormTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
`;

export const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const FieldLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
`;

export const FieldHint = styled.span`
  font-size: 0.75rem;
  color: #777;
`;

export const NativeSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--primary-black-30);
  border-radius: 6px;
  font: inherit;
  background: var(--primary-white);
`;

export const RadioRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
`;

export const PeoplePicker = styled.div`
  margin-top: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--primary-black-30);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const PersonOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
`;

export const FormError = styled.p`
  margin: 0.75rem 0 0 0;
  color: var(--error-failure-100);
  font-size: 0.85rem;
`;
