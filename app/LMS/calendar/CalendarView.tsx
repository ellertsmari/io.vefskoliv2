"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CALENDAR_EVENTS,
  CATEGORY_META,
  SEMESTER,
  type CalendarEvent,
} from "./calendarData";
import {
  CalendarContainer,
  Header,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  MonthNav,
  NavButton,
  MonthLabel,
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
  PanelDate,
  PanelHint,
  EventList,
  EventItem,
  EventTitle,
  EventMeta,
  CategoryBadge,
  EventTime,
  EventDescription,
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

export default function CalendarView({
  extraEvents = [],
}: {
  /** Dynamic events (e.g. group projects) merged into the static schedule. */
  extraEvents?: CalendarEvent[];
}) {
  const { year, months } = SEMESTER;
  const [monthCursor, setMonthCursor] = useState(0); // index into SEMESTER.months
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const month = months[monthCursor];
  const todayKey = toKey(new Date());

  const allEvents = useMemo(
    () => [...CALENDAR_EVENTS, ...extraEvents],
    [extraEvents],
  );

  // Multi-day events render as continuous bars; the rest as day pills.
  const multiDayEvents = useMemo(
    () =>
      allEvents
        .filter((e) => e.endDate && e.endDate > e.date)
        .sort(
          (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
        ),
    [allEvents],
  );
  const singleDayEvents = useMemo(
    () => allEvents.filter((e) => !(e.endDate && e.endDate > e.date)),
    [allEvents],
  );

  // Every day each multi-day event covers, precomputed once (mirrors
  // eventsByDate below instead of filtering per day cell per render).
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

  // Group single-day events by date once.
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
    const monthStart = `${year}-${pad(month + 1)}-01`;
    const monthEnd = toKey(new Date(year, month + 1, 0));
    const singles = singleDayEvents.filter(
      (e) => Number(e.date.split("-")[1]) - 1 === month,
    ).length;
    const spans = multiDayEvents.filter(
      (e) => e.date <= monthEnd && e.endDate! >= monthStart,
    ).length;
    return singles + spans;
  }, [singleDayEvents, multiDayEvents, month, year]);

  const goToMonth = (next: number) => {
    setMonthCursor(next);
    setSelectedKey(null);
  };

  return (
    <CalendarContainer>
      <Header>
        <TitleBlock>
          <PageTitle>Calendar</PageTitle>
          <PageSubtitle>{SEMESTER.label} · Spönn 1 &amp; 2</PageSubtitle>
        </TitleBlock>
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
            disabled={monthCursor === months.length - 1}
            onClick={() => goToMonth(monthCursor + 1)}
          >
            ›
          </NavButton>
        </MonthNav>
      </Header>

      <Legend>
        {Object.values(CATEGORY_META).map((meta) => (
          <LegendItem key={meta.label} $color={meta.color}>
            {meta.label}
          </LegendItem>
        ))}
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
                    $today={key === todayKey}
                    disabled={!inMonth}
                    onClick={() => inMonth && setSelectedKey(key)}
                  >
                    <DayNumber $muted={!inMonth} $today={key === todayKey}>
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
                          {showLabel ? event.title : " "}
                        </SpanBar>
                      );
                    })}
                    {visible.map((event) => (
                      <EventPill
                        key={event.id}
                        $color={CATEGORY_META[event.category].color}
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

        <Panel>
          {selectedKey ? (
            <>
              <PanelDate>{formatLongDate(selectedKey)}</PanelDate>
              {selectedEvents.length === 0 ? (
                <PanelHint>No events scheduled.</PanelHint>
              ) : (
                <EventList>
                  {selectedEvents.map((event) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <EventItem key={event.id} $color={meta.color}>
                        <EventTitle>{event.title}</EventTitle>
                        <EventMeta>
                          <CategoryBadge $color={meta.color}>
                            {meta.label}
                          </CategoryBadge>
                          {event.time && <EventTime>{event.time}</EventTime>}
                          {event.endDate && (
                            <EventTime>
                              {formatLongDate(event.date)} –{" "}
                              {formatLongDate(event.endDate)}
                            </EventTime>
                          )}
                        </EventMeta>
                        {event.description && (
                          <EventDescription>
                            {event.description}
                          </EventDescription>
                        )}
                      </EventItem>
                    );
                  })}
                </EventList>
              )}
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
    </CalendarContainer>
  );
}
