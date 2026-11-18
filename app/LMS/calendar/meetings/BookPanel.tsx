"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookMeeting } from "serverActions/meetings";
import {
  MIN_TEACHERS_PRESENT,
  addDays,
  describeDate,
  todayKey,
  weekdayOf,
} from "utils/calendarUtils";
import { clashOf } from "utils/meetingUtils";
import type { CalendarEvent, MeetingSlot } from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import {
  FormError,
  MonthLabel,
  MonthNav,
  NavButton,
  SlotChip,
  SlotChips,
  SlotDay,
  SlotDayLabel,
} from "../style";
import {
  CheckLabel,
  DialogBody,
  Muted,
  Notice,
  PrimaryButton,
  Section,
  Toolbar,
} from "./style";

type Props = {
  /** Every bookable time for the term, from the server. */
  slots: MeetingSlot[];
  /** The viewer's calendar, to spot times they are already busy. */
  events: CalendarEvent[];
  /** Open on the week containing this day, and preselect this time. */
  date?: string;
  startTime?: string;
  teamName?: string | null;
  onBooked: () => void;
};

const mondayOf = (key: string) => addDays(key, -weekdayOf(key));

/**
 * Book one of the teachers' open times.
 *
 * Only times when at least two teachers are free are offered, so a student
 * is never alone with one adult; the server checks the same rule again when
 * the booking is saved. Shown a week at a time, starting at the first week
 * that still has something free, with the student's own busy times hidden
 * unless they ask to see them.
 */
export const BookPanel = ({
  slots,
  events,
  date,
  startTime,
  teamName,
  onBooked,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hideBusy, setHideBusy] = useState(true);

  const annotated = useMemo(
    () =>
      slots.map((slot) => ({
        ...slot,
        clash: clashOf(events, slot.date, slot.startTime, slot.endTime),
      })),
    [slots, events]
  );
  const clashing = annotated.filter((slot) => slot.clash).length;
  const offered = annotated.filter((slot) => !(hideBusy && slot.clash));

  const firstOpen = offered.find((slot) => slot.date >= todayKey());
  const [weekStart, setWeekStart] = useState(() =>
    mondayOf(date ?? firstOpen?.date ?? todayKey())
  );
  const [picked, setPicked] = useState<MeetingSlot | null>(
    () =>
      slots.find((slot) => slot.date === date && slot.startTime === startTime) ?? null
  );
  const [topic, setTopic] = useState("");
  const [withTeam, setWithTeam] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const weekEnd = addDays(weekStart, 6);
  const week = useMemo(() => {
    const byDay = new Map<string, typeof offered>();
    for (const slot of offered) {
      if (slot.date < weekStart || slot.date > weekEnd) continue;
      const list = byDay.get(slot.date);
      if (list) list.push(slot);
      else byDay.set(slot.date, [slot]);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [offered, weekStart, weekEnd]);
  const hasEarlier = offered.some(
    (slot) => slot.date < weekStart && slot.date >= todayKey()
  );
  const hasLater = offered.some((slot) => slot.date > weekEnd);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!picked) return;
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await bookMeeting({
        date: picked.date,
        startTime: picked.startTime,
        topic,
        withTeam,
      });
      if (result.success) {
        router.refresh();
        onBooked();
        return;
      }
      setError(result.message);
      if (result.errors) setFieldErrors(result.errors);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody>
        <Muted>
          You meet at least {MIN_TEACHERS_PRESENT} teachers. Only times when
          they are free are shown.
        </Muted>

        <Section>
          <Toolbar>
            <MonthNav>
              <NavButton
                type="button"
                aria-label="Earlier week"
                disabled={!hasEarlier}
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                ‹
              </NavButton>
              <MonthLabel>Week of {describeDate(weekStart).slice(4)}</MonthLabel>
              <NavButton
                type="button"
                aria-label="Later week"
                disabled={!hasLater}
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                ›
              </NavButton>
            </MonthNav>
            {clashing > 0 && (
              <CheckLabel>
                <input
                  type="checkbox"
                  checked={hideBusy}
                  onChange={(e) => setHideBusy(e.target.checked)}
                />
                Hide times I&apos;m busy ({clashing})
              </CheckLabel>
            )}
          </Toolbar>

          {week.length === 0 ? (
            <Muted>No free times this week. Try another week.</Muted>
          ) : (
            week.map(([day, daySlots]) => (
              <SlotDay key={day}>
                <SlotDayLabel>{describeDate(day)}</SlotDayLabel>
                <SlotChips role="group" aria-label={describeDate(day)}>
                  {daySlots.map((slot) => {
                    const selected =
                      picked?.date === slot.date && picked?.startTime === slot.startTime;
                    return (
                      <SlotChip
                        key={slot.startTime}
                        type="button"
                        $selected={selected}
                        aria-pressed={selected}
                        title={
                          slot.clash
                            ? `You have “${slot.clash.title}” then`
                            : `With ${slot.teachers.join(" and ")}`
                        }
                        style={slot.clash ? { opacity: 0.55 } : undefined}
                        onClick={() => setPicked(slot)}
                      >
                        {slot.startTime}–{slot.endTime}
                      </SlotChip>
                    );
                  })}
                </SlotChips>
              </SlotDay>
            ))
          )}
        </Section>

        {picked && (
          <Notice $tone="done">
            {describeDate(picked.date)}, {picked.startTime}–{picked.endTime}, with{" "}
            {picked.teachers.join(" and ")}.
          </Notice>
        )}

        <Input
          id="meeting-topic"
          type="textarea"
          name="topic"
          label="What is it about?"
          rows={2}
          style={{ minHeight: "4.5rem", height: "4.5rem" }}
          maxLength={500}
          required
          disabled={isPending}
          value={topic}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTopic(e.target.value)
          }
          error={fieldErrors.topic?.[0]}
        />

        {teamName && (
          <CheckLabel>
            <input
              type="checkbox"
              checked={withTeam}
              onChange={(e) => setWithTeam(e.target.checked)}
              disabled={isPending}
            />
            Put it on my team&apos;s calendar too ({teamName})
          </CheckLabel>
        )}

        {error && <FormError role="alert">{error}</FormError>}

        <div>
          <PrimaryButton
            type="submit"
            disabled={isPending || !picked || topic.trim().length < 2}
          >
            {isPending
              ? "Booking…"
              : picked
                ? `Book ${picked.startTime}–${picked.endTime}`
                : "Pick a time"}
          </PrimaryButton>
        </div>
      </DialogBody>
    </form>
  );
};
