"use client";

import styled from "styled-components";
import { PageContainer } from "globalStyles/pageStyles";

/**
 * Dense grid, so the wide page width. Also fills the scroll area's height so
 * the month grid absorbs the leftover space rather than overflowing it by a
 * few pixels and forcing a scroll.
 */
export const CalendarContainer = styled(PageContainer).attrs({
  $width: "wide" as const,
})`
  /* Centred, unlike the other pages: the month grid is a fixed-proportion block
     rather than a column of content, so it reads better balanced than pinned left. */
  margin-inline: auto;
  height: 100%;
  min-height: 0;
  gap: 1.25rem;
`;

export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
`;

export {
  TitleBlock,
  PageTitle,
  PageSubtitle,
} from "globalStyles/pageStyles";

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
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-black-10);
  background: var(--primary-white);
  color: var(--primary-black-100);
  font-size: var(--text-lg);
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
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const LegendItem = styled.li<{ $color: string; $hollow?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);

  &::before {
    content: "";
    width: 0.7rem;
    height: 0.7rem;
    box-sizing: border-box;
    border: ${(props) => (props.$hollow ? "2px solid var(--primary-black-60)" : "none")};
    border-radius: var(--radius-sm);
    background: ${(props) => props.$color};
  }
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  /* Takes the height the header and legend don't use. */
  flex: 1;
  min-height: 0;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 2.25rem repeat(7, minmax(0, 1fr));
  /* Weekday header sizes to content; week rows share whatever is left, down to
     a floor below which the calendar scrolls rather than crushing the cells. */
  grid-template-rows: auto;
  grid-auto-rows: minmax(5.5rem, 1fr);
  height: 100%;
  min-height: 0;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--primary-white);
`;

export const Corner = styled.div`
  background: var(--primary-black-5);
  border-bottom: 1px solid var(--primary-black-10);
`;

export const WeekdayHead = styled.div`
  padding: 0.6rem 0.5rem;
  text-align: center;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--primary-black-60);
  background: var(--primary-black-5);
  border-bottom: 1px solid var(--primary-black-10);
`;

export const WeekNumCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-30);
  background: var(--primary-black-5);
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
  /* Height comes from the grid row, which stretches to fill the page. */
  min-height: 0;
  overflow: hidden;
  padding: 0.4rem;
  text-align: left;
  border: none;
  border-top: 1px solid var(--primary-black-10);
  border-left: 1px solid var(--primary-black-10);
  /*
   * A neutral three-step ramp: the days you act on are brightest, weekends
   * recede, days outside the month sink into the frame. Purple is reserved
   * for today and the selected day, so the accent means "here", not "Saturday".
   */
  background: ${(props) =>
    props.$muted
      ? "var(--primary-black-10)"
      : props.$weekend
        ? "var(--primary-black-5)"
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
  font-size: var(--text-xs);
  font-weight: ${(props) => (props.$today ? 700 : 500)};
  color: ${(props) =>
    props.$today
      ? "var(--primary-white)"
      : props.$muted
        ? "var(--primary-black-30)"
        : "var(--primary-black-100)"};
  background: ${(props) =>
    props.$today ? "var(--theme-module3-100)" : "transparent"};
  border-radius: var(--radius-pill);
`;

/**
 * A single-day event. The viewer's own (private or team) events are hollow:
 * an outline instead of a tint, so "mine" reads at a glance next to the
 * shared schedule.
 */
export const EventPill = styled.span<{ $color: string; $hollow?: boolean }>`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0.12rem 0.35rem 0.12rem 0.45rem;
  border-radius: var(--radius-sm);
  border-left: 3px solid ${(props) => props.$color};
  border-top: ${(props) => (props.$hollow ? `1px dashed ${props.$color}` : "none")};
  border-right: ${(props) => (props.$hollow ? `1px dashed ${props.$color}` : "none")};
  border-bottom: ${(props) => (props.$hollow ? `1px dashed ${props.$color}` : "none")};
  /* The category colours are CSS variables, so an appended hex alpha
     ("var(--x)1a") is invalid and silently rendered no background at all. */
  background: ${(props) =>
    props.$hollow
      ? "transparent"
      : `color-mix(in srgb, ${props.$color} 10%, transparent)`};
  font-size: var(--text-xs);
  line-height: 1.35;
  color: var(--primary-black-100);
`;

export const MorePill = styled.span`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  padding: 0 0.35rem;
`;

/**
 * One day-segment of a multi-day event. Bleeds over the cell padding (and the
 * 1px cell border) so consecutive days join into one continuous line, like in
 * Google Calendar; only the first and last day are rounded.
 */
export const SpanBar = styled.span<{
  $color: string;
  $start: boolean;
  $end: boolean;
}>`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 1.15rem;
  line-height: 1.15rem;
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-white);
  background: ${(props) => props.$color};
  padding: 0 ${(props) => (props.$start ? "0.35rem" : "0")};
  margin-left: ${(props) => (props.$start ? "0" : "calc(-0.4rem - 1px)")};
  margin-right: ${(props) => (props.$end ? "0" : "-0.4rem")};
  border-radius: ${(props) =>
    `${props.$start ? "var(--radius-sm)" : "0"} ${props.$end ? "var(--radius-sm)" : "0"} ${
      props.$end ? "var(--radius-sm)" : "0"
    } ${props.$start ? "var(--radius-sm)" : "0"}`};
`;

// ── Detail panel ──────────────────────────────────────────────────────────

/**
 * The day detail. Beside the grid on wide screens; on narrow ones it used to
 * drop below the grid, where tapping a day looked like nothing happened, so
 * there it slides up as a sheet over the page while a day is selected.
 */
export const Panel = styled.aside<{ $sheet: boolean }>`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  background: var(--primary-white);
  padding: 1.25rem;
  position: sticky;
  top: 1rem;

  @media (max-width: 899px) {
    ${(props) =>
      props.$sheet &&
      `
      position: fixed;
      inset: auto 0 0 0;
      max-height: 70vh;
      overflow-y: auto;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
      z-index: 50;
    `}
  }
`;

export const SheetClose = styled.button`
  display: none;
  float: right;
  border: none;
  background: transparent;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-60);
  cursor: pointer;
  padding: 0 0 0.5rem 0.5rem;

  @media (max-width: 899px) {
    display: inline-block;
  }
`;

export const PanelDate = styled.h2`
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0 0 0.25rem 0;
`;

export const PanelHint = styled.p`
  font-size: var(--text-sm);
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
  font-size: var(--text-base);
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
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  background: ${(props) =>
    `color-mix(in srgb, ${props.$color} 15%, transparent)`};
  color: ${(props) => props.$color};
`;

export const EventTime = styled.span`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
`;

export const EventDescription = styled.p`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  margin: 0.15rem 0 0 0;
`;

// ── Actions, dialog, settings ─────────────────────────────────────────────

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const TodayButton = styled(NavButton)`
  width: auto;
  padding: 0 0.75rem;
  font-size: var(--text-sm);
  font-weight: 600;
`;

export const AddEventButton = styled.button`
  border: 1px solid var(--primary-black-100);
  background: var(--primary-black-100);
  color: var(--primary-white);
  border-radius: var(--radius-pill);
  padding: 0.5rem 1.1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

export const PanelAddButton = styled.button`
  margin-top: 0.75rem;
  width: 100%;
  text-align: left;
  border: 1px dashed var(--primary-black-30);
  background: transparent;
  color: var(--primary-black-100);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    background: var(--primary-black-5);
  }
`;

export const OwnerLine = styled.p`
  margin: 0.2rem 0 0 0;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const EventLink = styled.a`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--theme-module3-100);
  text-decoration: underline;
`;

export const EventActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
`;

export const SmallActionButton = styled.button<{ $danger?: boolean }>`
  border: 1px solid
    ${({ $danger }) =>
      $danger ? "var(--error-failure-100)" : "var(--primary-black-30)"};
  color: ${({ $danger }) =>
    $danger ? "var(--error-failure-100)" : "var(--primary-black-100)"};
  background: transparent;
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.6rem;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--primary-black-5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const ConfirmText = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1rem 2rem;
  overflow-y: auto;
  z-index: 100;
`;

export const FormCard = styled.div`
  background: var(--primary-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: min(100%, 560px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
`;

export const FormTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--primary-black-100);
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

export const FieldLabel = styled.label`
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--primary-black-60);
`;

export const NativeSelect = styled.select`
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-sm);
  background: var(--primary-white);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
`;

export const FieldHint = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const RadioRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
`;

export const RadioLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
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
  font-size: var(--text-sm);
  color: var(--error-failure-100);
`;

export const FormSuccess = styled.p`
  margin: 0.75rem 0 0 0;
  font-size: var(--text-sm);
  color: var(--error-success-100);
`;

export const SettingsCard = styled.section`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  background: var(--primary-white);
  padding: 1rem 1.25rem;
`;

export const SettingsSummary = styled.summary`
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &::before {
    content: "▸ ";
    color: var(--primary-black-60);
  }

  details[open] > &::before {
    content: "▾ ";
  }
`;

export const SettingsBody = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 1rem;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

export const SettingsTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--primary-black-100);
`;
