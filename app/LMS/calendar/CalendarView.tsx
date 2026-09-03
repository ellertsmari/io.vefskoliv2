"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META } from "constants/semesterPlan";
import { deleteCalendarEvent } from "serverActions/calendarEvents";
import {
  describeSemester,
  initialMonthIndex,
  semesterMonths,
  todayKey,
} from "utils/calendarUtils";
import type { CalendarEvent, SemesterInfo } from "types/calendarTypes";
import { EventForm } from "./EventForm";
import { Avatar } from "UIcomponents/avatar/Avatar";
import {
  CalendarContainer,
  Header,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  HeaderActions,
  MonthNav,
  NavButton,
  TodayButton,
  MonthLabel,
  AddEventButton,
  Legend,
  LegendItem,
  Layout,
  Grid,
  Corner,
  WeekdayHead,
  WeekNumCell,
  DayCell,
  DayNumber,
  EventPill,
  MorePill,
  SpanBar,
  Panel,
  SheetClose,
  PanelDate,
  PanelHint,
  PanelAddButton,
  EventList,
  EventItem,
  EventTitle,
  EventMeta,
  CategoryBadge,
  EventTime,
  EventDescription,
  EventLink,
  OwnerLine,
  CreatorRow,
  CreatorName,
  EventActions,
  SmallActionButton,
  ConfirmText,
  FormError,
} from "./style";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Monday-first weekday index (0 = Mon … 6 = Sun). */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** ISO 8601 week number. */
function isoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3,
  );
  return (
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000))
  );
}

/** Weeks (rows of 7 Date objects, Monday-first) covering the given month. */
function buildWeeks(year: number, month: number): Date[][] {
  const firstWeekday = mondayIndex(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const numWeeks = Math.ceil((firstWeekday + daysInMonth) / 7);
  const cursor = new Date(year, month, 1 - firstWeekday);
  const weeks: Date[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const formatLongDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return `${WEEKDAYS[mondayIndex(new Date(y, m - 1, d))]} ${d} ${MONTH_NAMES[m - 1]}`;
};

const isMine = (event: CalendarEvent) =>
  !!event.visibility && event.visibility !== "everyone";

type Dialog =
  | { mode: "create"; date?: string }
  | { mode: "edit"; event: CalendarEvent }
  | null;

export default function CalendarView({
  events,
  semester,
  isTeacher,
  teamName = null,
  settings,
}: {
  events: CalendarEvent[];
  semester: SemesterInfo;
  isTeacher: boolean;
  /** The viewer's team, for "My team" events. */
  teamName?: string | null;
  /** Teacher-only settings, rendered under the header. */
  settings?: React.ReactNode;
}) {
  const router = useRouter();
  const months = useMemo(
    () => semesterMonths(semester.startDate, semester.endDate),
    [semester.startDate, semester.endDate],
  );
  const today = todayKey();
  const [monthCursor, setMonthCursor] = useState(() =>
    initialMonthIndex(months, today),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const { year, month } = months[Math.min(monthCursor, months.length - 1)];

  // Multi-day events render as continuous bars; the rest as day pills.
  const multiDayEvents = useMemo(
    () =>
      events
        .filter((e) => e.endDate && e.endDate > e.date)
        .sort(
          (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
        ),
    [events],
  );
  const singleDayEvents = useMemo(
    () =>
      events
        .filter((e) => !(e.endDate && e.endDate > e.date))
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (a.time ?? "").localeCompare(b.time ?? ""),
        ),
    [events],
  );

  // Every day each multi-day event covers, precomputed once.
  const spansByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of multiDayEvents) {
      const [y, m, d] = event.date.split("-").map(Number);
      const cursor = new Date(y, m - 1, d);
      // hard cap guards against a malformed endDate looping forever
      for (let i = 0; i < 370 && toKey(cursor) <= event.endDate!; i++) {
        const key = toKey(cursor);
        const list = map.get(key);
        if (list) list.push(event);
        else map.set(key, [event]);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [multiDayEvents]);

  const spansOnDay = (key: string) => spansByDate.get(key) ?? [];

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of singleDayEvents) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [singleDayEvents]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  const selectedEvents = selectedKey
    ? [...spansOnDay(selectedKey), ...(eventsByDate.get(selectedKey) ?? [])]
    : [];

  const monthEventCount = useMemo(() => {
    const prefix = `${year}-${pad(month + 1)}`;
    const monthStart = `${prefix}-01`;
    const monthEnd = toKey(new Date(year, month + 1, 0));
    const singles = singleDayEvents.filter((e) =>
      e.date.startsWith(prefix),
    ).length;
    const spans = multiDayEvents.filter(
      (e) => e.date <= monthEnd && e.endDate! >= monthStart,
    ).length;
    return singles + spans;
  }, [singleDayEvents, multiDayEvents, month, year]);

  const goToMonth = (next: number) => {
    setMonthCursor(next);
    setSelectedKey(null);
    setConfirmDelete(null);
  };

  const goToToday = () => {
    setMonthCursor(initialMonthIndex(months, today));
    const [y, m] = today.split("-").map(Number);
    const inTerm = months.some((ym) => ym.year === y && ym.month === m - 1);
    setSelectedKey(inTerm ? today : null);
  };

  const removeEvent = (event: CalendarEvent, applyToSeries: boolean) => {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteCalendarEvent(event.id, { applyToSeries });
      if (result.success) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        setDeleteError(result.message);
      }
    });
  };

  const closeDialog = () => setDialog(null);

  return (
    <CalendarContainer>
      <Header>
        <TitleBlock>
          <PageTitle>Calendar</PageTitle>
          <PageSubtitle>{describeSemester(semester)}</PageSubtitle>
        </TitleBlock>
        <HeaderActions>
          <MonthNav>
            <NavButton
              type="button"
              aria-label="Previous month"
              disabled={monthCursor === 0}
              onClick={() => goToMonth(monthCursor - 1)}
            >
              ‹
            </NavButton>
            <MonthLabel>
              {MONTH_NAMES[month]} {year}
            </MonthLabel>
            <NavButton
              type="button"
              aria-label="Next month"
              disabled={monthCursor >= months.length - 1}
              onClick={() => goToMonth(monthCursor + 1)}
            >
              ›
            </NavButton>
            <TodayButton type="button" onClick={goToToday}>
              Today
            </TodayButton>
          </MonthNav>
          <AddEventButton
            type="button"
            onClick={() =>
              setDialog({ mode: "create", date: selectedKey ?? undefined })
            }
          >
            + New event
          </AddEventButton>
        </HeaderActions>
      </Header>

      {settings}

      <Legend>
        {Object.values(CATEGORY_META).map((meta) => (
          <LegendItem key={meta.label} $color={meta.color}>
            {meta.label}
          </LegendItem>
        ))}
        {!isTeacher && (
          <LegendItem $color="transparent" $hollow>
            Mine / my team
          </LegendItem>
        )}
      </Legend>

      <Layout>
        <Grid>
          <Corner />
          {WEEKDAYS.map((wd) => (
            <WeekdayHead key={wd}>{wd}</WeekdayHead>
          ))}

          {weeks.map((week) => (
            <Fragment key={toKey(week[0])}>
              <WeekNumCell>V{isoWeek(week[0])}</WeekNumCell>
              {week.map((day) => {
                const key = toKey(day);
                const inMonth = day.getMonth() === month;
                const weekendDay = mondayIndex(day) >= 5;
                const daySpans = inMonth ? spansOnDay(key) : [];
                const dayEvents = inMonth ? (eventsByDate.get(key) ?? []) : [];
                const visible = dayEvents.slice(0, daySpans.length > 0 ? 2 : 3);
                const hidden = dayEvents.length - visible.length;

                return (
                  <DayCell
                    key={key}
                    type="button"
                    $muted={!inMonth}
                    $weekend={weekendDay}
                    $selected={selectedKey === key && inMonth}
                    $today={key === today}
                    disabled={!inMonth}
                    aria-label={`${formatLongDate(key)}, ${dayEvents.length + daySpans.length} events`}
                    onClick={() => {
                      if (!inMonth) return;
                      setSelectedKey(key);
                      setConfirmDelete(null);
                    }}
                  >
                    <DayNumber $muted={!inMonth} $today={key === today}>
                      {day.getDate()}
                    </DayNumber>
                    {daySpans.map((event) => {
                      const isStart = event.date === key;
                      const isEnd = event.endDate === key;
                      // Repeat the label at the start of every week row.
                      const showLabel = isStart || mondayIndex(day) === 0;
                      return (
                        <SpanBar
                          key={event.id}
                          $color={CATEGORY_META[event.category].color}
                          $start={isStart}
                          $end={isEnd}
                          title={event.title}
                        >
                          {showLabel ? event.title : " "}
                        </SpanBar>
                      );
                    })}
                    {visible.map((event) => (
                      <EventPill
                        key={event.id}
                        $color={CATEGORY_META[event.category].color}
                        $hollow={isMine(event)}
                        title={event.title}
                      >
                        {event.time ? `${event.time} ` : ""}
                        {event.title}
                      </EventPill>
                    ))}
                    {hidden > 0 && <MorePill>+{hidden} more</MorePill>}
                  </DayCell>
                );
              })}
            </Fragment>
          ))}
        </Grid>

        <Panel $sheet={selectedKey !== null} aria-live="polite">
          {selectedKey ? (
            <>
              <SheetClose type="button" onClick={() => setSelectedKey(null)}>
                Close
              </SheetClose>
              <PanelDate>{formatLongDate(selectedKey)}</PanelDate>
              {selectedEvents.length === 0 ? (
                <PanelHint>No events scheduled.</PanelHint>
              ) : (
                <EventList>
                  {selectedEvents.map((event) => {
                    const meta = CATEGORY_META[event.category];
                    const confirming = confirmDelete === event.id;
                    return (
                      <EventItem key={event.id} $color={meta.color}>
                        <EventTitle>{event.title}</EventTitle>
                        <EventMeta>
                          <CategoryBadge $color={meta.color}>
                            {meta.label}
                          </CategoryBadge>
                          {event.time && (
                            <EventTime>
                              {event.time}
                              {event.endTime ? `–${event.endTime}` : ""}
                            </EventTime>
                          )}
                          {event.endDate && (
                            <EventTime>
                              {formatLongDate(event.date)} –{" "}
                              {formatLongDate(event.endDate)}
                            </EventTime>
                          )}
                          {event.link && (
                            <EventLink
                              href={event.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open link
                            </EventLink>
                          )}
                        </EventMeta>
                        {event.description && (
                          <EventDescription>{event.description}</EventDescription>
                        )}
                        {event.source === "generated" ? (
                          <OwnerLine>From group projects; edit it there.</OwnerLine>
                        ) : (
                          <CreatorRow>
                            {event.ownerName ? (
                              <>
                                <Avatar
                                  name={event.ownerName}
                                  url={event.ownerAvatarUrl}
                                  size={20}
                                />
                                <CreatorName>{event.ownerName}</CreatorName>
                              </>
                            ) : (
                              <CreatorName>Vefskólinn</CreatorName>
                            )}
                            <span>
                              {event.visibility === "team"
                                ? `· ${event.ownerLabel}`
                                : event.visibility === "private"
                                  ? "· only you"
                                  : "· everyone"}
                            </span>
                          </CreatorRow>
                        )}
                        {event.canEdit && (
                          <EventActions>
                            {confirming ? (
                              <>
                                <ConfirmText>Delete this event?</ConfirmText>
                                <SmallActionButton
                                  type="button"
                                  $danger
                                  disabled={deleting}
                                  onClick={() => removeEvent(event, false)}
                                >
                                  {deleting ? "Deleting…" : "Delete"}
                                </SmallActionButton>
                                {event.seriesId && (
                                  <SmallActionButton
                                    type="button"
                                    $danger
                                    disabled={deleting}
                                    onClick={() => removeEvent(event, true)}
                                  >
                                    Delete every week
                                  </SmallActionButton>
                                )}
                                <SmallActionButton
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => setConfirmDelete(null)}
                                >
                                  Keep
                                </SmallActionButton>
                              </>
                            ) : (
                              <>
                                <SmallActionButton
                                  type="button"
                                  onClick={() =>
                                    setDialog({ mode: "edit", event })
                                  }
                                >
                                  Edit
                                </SmallActionButton>
                                <SmallActionButton
                                  type="button"
                                  $danger
                                  onClick={() => {
                                    setDeleteError(null);
                                    setConfirmDelete(event.id);
                                  }}
                                >
                                  Delete
                                </SmallActionButton>
                              </>
                            )}
                          </EventActions>
                        )}
                        {confirming && deleteError && (
                          <FormError role="alert">{deleteError}</FormError>
                        )}
                      </EventItem>
                    );
                  })}
                </EventList>
              )}
              <PanelAddButton
                type="button"
                onClick={() => setDialog({ mode: "create", date: selectedKey })}
              >
                + Add an event on this day
              </PanelAddButton>
            </>
          ) : (
            <>
              <PanelDate>
                {MONTH_NAMES[month]} {year}
              </PanelDate>
              <PanelHint>
                {monthEventCount} event{monthEventCount === 1 ? "" : "s"} this
                month. Select a day to see what&apos;s on.
              </PanelHint>
            </>
          )}
        </Panel>
      </Layout>

      {dialog && (
        <EventForm
          key={dialog.mode === "edit" ? dialog.event.id : `new-${dialog.date ?? ""}`}
          initial={dialog.mode === "edit" ? dialog.event : undefined}
          defaultDate={dialog.mode === "create" ? dialog.date : undefined}
          isTeacher={isTeacher}
          teamName={teamName}
          onClose={closeDialog}
        />
      )}
    </CalendarContainer>
  );
}
