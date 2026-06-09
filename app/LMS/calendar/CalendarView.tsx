"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SEMESTER } from "./calendarData";
import {
  CATEGORY_META,
  eachDateInRange,
  type ClientCalendarEvent,
} from "utils/calendarUtils";
import {
  deleteCalendarEvent,
  type ShareableUser,
} from "serverActions/calendarEvents";
import { EventForm } from "./EventForm";
import {
  CalendarContainer,
  Header,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  HeaderActions,
  AddEventButton,
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
  Panel,
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
  OwnerLine,
  EventActions,
  SmallActionButton,
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

const formatShortDate = (key: string) => {
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)}`;
};

/** "10:00–11:30" for timed events, "17 Aug – 21 Aug" for ranges, "" otherwise. */
const formatWhen = (event: ClientCalendarEvent): string => {
  if (event.startTime) {
    return event.endTime
      ? `${event.startTime}–${event.endTime}`
      : event.startTime;
  }
  if (event.startDate !== event.endDate) {
    return `${formatShortDate(event.startDate)} – ${formatShortDate(event.endDate)}`;
  }
  return "";
};

type FormState =
  | { open: false }
  | { open: true; initial?: ClientCalendarEvent; defaultDate?: string };

export default function CalendarView({
  events,
  people,
  viewerRole,
}: {
  events: ClientCalendarEvent[];
  people: ShareableUser[];
  viewerRole?: string;
}) {
  const { year, months } = SEMESTER;
  const [monthCursor, setMonthCursor] = useState(0); // index into SEMESTER.months
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ open: false });
  const [isDeleting, startDeleting] = useTransition();
  const router = useRouter();

  const month = months[monthCursor];
  const todayKey = toKey(new Date());

  // Group events by date, expanding multi-day events over their whole range.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ClientCalendarEvent[]>();
    for (const event of events) {
      for (const key of eachDateInRange(event.startDate, event.endDate)) {
        const list = map.get(key);
        if (list) list.push(event);
        else map.set(key, [event]);
      }
    }
    // timed events first within a day, ordered by start time
    for (const list of map.values()) {
      list.sort((a, b) =>
        (a.startTime ?? "99") < (b.startTime ?? "99") ? -1 : 1,
      );
    }
    return map;
  }, [events]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  const selectedEvents = selectedKey
    ? (eventsByDate.get(selectedKey) ?? [])
    : [];
  const monthPrefix = `${year}-${pad(month + 1)}`;
  const monthEventCount = useMemo(
    () =>
      events.filter(
        (e) =>
          e.startDate.startsWith(monthPrefix) ||
          e.endDate.startsWith(monthPrefix),
      ).length,
    [events, monthPrefix],
  );

  const goToMonth = (next: number) => {
    setMonthCursor(next);
    setSelectedKey(null);
  };

  const handleDelete = (event: ClientCalendarEvent) => {
    const sure = window.confirm(
      `Delete "${event.title}"? This can't be undone.`,
    );
    if (!sure) return;
    startDeleting(async () => {
      const result = await deleteCalendarEvent(event.id);
      if (!result.success) {
        window.alert(result.message);
      }
      router.refresh();
    });
  };

  return (
    <CalendarContainer>
      <Header>
        <TitleBlock>
          <PageTitle>Calendar</PageTitle>
          <PageSubtitle>{SEMESTER.label} · Spönn 1 &amp; 2</PageSubtitle>
        </TitleBlock>
        <HeaderActions>
          <AddEventButton
            type="button"
            onClick={() =>
              setForm({ open: true, defaultDate: selectedKey ?? undefined })
            }
          >
            + Add event
          </AddEventButton>
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
        </HeaderActions>
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
                const dayEvents = inMonth ? (eventsByDate.get(key) ?? []) : [];
                const visible = dayEvents.slice(0, 3);
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
                    {visible.map((event) => (
                      <EventPill
                        key={event.id}
                        $color={CATEGORY_META[event.category].color}
                      >
                        {event.visibility === "restricted" ? "🔒 " : ""}
                        {event.startTime ? `${event.startTime} ` : ""}
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
                    const when = formatWhen(event);
                    return (
                      <EventItem key={event.id} $color={meta.color}>
                        <EventTitle>{event.title}</EventTitle>
                        <EventMeta>
                          <CategoryBadge $color={meta.color}>
                            {meta.label}
                          </CategoryBadge>
                          {when && <EventTime>{when}</EventTime>}
                        </EventMeta>
                        {event.description && (
                          <EventDescription>
                            {event.description}
                          </EventDescription>
                        )}
                        <OwnerLine>
                          {event.ownerId
                            ? `Added by ${event.ownerName}`
                            : "Vefskólinn"}
                          {event.visibility === "restricted" &&
                            " · 🔒 only visible to selected people"}
                        </OwnerLine>
                        {event.canEdit && (
                          <EventActions>
                            <SmallActionButton
                              type="button"
                              disabled={isDeleting}
                              onClick={() =>
                                setForm({ open: true, initial: event })
                              }
                            >
                              Edit
                            </SmallActionButton>
                            <SmallActionButton
                              type="button"
                              $danger
                              disabled={isDeleting}
                              onClick={() => handleDelete(event)}
                            >
                              Delete
                            </SmallActionButton>
                          </EventActions>
                        )}
                      </EventItem>
                    );
                  })}
                </EventList>
              )}
              <PanelAddButton
                type="button"
                onClick={() => setForm({ open: true, defaultDate: selectedKey })}
              >
                + Add event on this day
              </PanelAddButton>
            </>
          ) : (
            <>
              <PanelDate>
                {MONTH_NAMES[month]} {year}
              </PanelDate>
              <PanelHint>
                {monthEventCount} event{monthEventCount === 1 ? "" : "s"} this
                month. Select a day to see what&apos;s on, or add your own —
                lectures, group work, study sessions and Module 2 events all
                live here.
              </PanelHint>
            </>
          )}
        </Panel>
      </Layout>

      {form.open && (
        <EventForm
          initial={form.initial}
          defaultDate={form.defaultDate}
          viewerRole={viewerRole}
          people={people}
          onClose={() => setForm({ open: false })}
        />
      )}
    </CalendarContainer>
  );
}
