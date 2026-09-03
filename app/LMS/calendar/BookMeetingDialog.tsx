"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { bookMeeting } from "serverActions/meetings";
import {
  MEETING_SLOT_MINUTES,
  MIN_TEACHERS_PRESENT,
  addDays,
  describeDate,
  todayKey,
  weekdayOf,
} from "utils/calendarUtils";
import type { MeetingSlot } from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import { Button } from "globalStyles/buttons/default/style";
import {
  Overlay,
  FormCard,
  FormTitle,
  FormGrid,
  FieldHint,
  FormActions,
  FormError,
  RadioLabel,
  MonthNav,
  NavButton,
  MonthLabel,
  SlotDay,
  SlotDayLabel,
  SlotChips,
  SlotChip,
} from "./style";

type Props = {
  /** Every bookable slot for the term, from the server. */
  slots: MeetingSlot[];
  /** Open on the week containing this day, and preselect this time. */
  date?: string;
  startTime?: string;
  teamName?: string | null;
  onClose: () => void;
};

const mondayOf = (key: string) => addDays(key, -weekdayOf(key));

/**
 * Pick a time to meet the teachers.
 *
 * Only times when at least two teachers are free are offered, so a student
 * is never alone with one adult; the server checks the same rule again when
 * the booking is saved. Shown a week at a time, starting at the first week
 * that still has something free.
 */
export const BookMeetingDialog = ({
  slots,
  date,
  startTime,
  teamName,
  onClose,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const firstOpen = slots.find((slot) => slot.date >= todayKey());
  const [weekStart, setWeekStart] = useState(() =>
    mondayOf(date ?? firstOpen?.date ?? todayKey())
  );
  const [picked, setPicked] = useState<MeetingSlot | null>(
    () =>
      slots.find((slot) => slot.date === date && slot.startTime === startTime) ??
      null
  );
  const [topic, setTopic] = useState("");
  const [withTeam, setWithTeam] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const weekEnd = addDays(weekStart, 6);
  const week = useMemo(() => {
    const byDay = new Map<string, MeetingSlot[]>();
    for (const slot of slots) {
      if (slot.date < weekStart || slot.date > weekEnd) continue;
      const list = byDay.get(slot.date);
      if (list) list.push(slot);
      else byDay.set(slot.date, [slot]);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [slots, weekStart, weekEnd]);
  const hasEarlier = slots.some((slot) => slot.date < weekStart && slot.date >= todayKey());
  const hasLater = slots.some((slot) => slot.date > weekEnd);

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
        onClose();
        return;
      }
      setError(result.message);
      if (result.errors) setFieldErrors(result.errors);
    });
  };

  const dialog = (
    <Overlay onClick={onClose}>
      <FormCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-meeting-title"
        onClick={(event) => event.stopPropagation()}
      >
        <FormTitle id="book-meeting-title">Book a meeting</FormTitle>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <FieldHint>
              {MEETING_SLOT_MINUTES} minutes with at least {MIN_TEACHERS_PRESENT}{" "}
              teachers. Only times when they are both free are shown.
            </FieldHint>

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

            {week.length === 0 ? (
              <FieldHint>No free times this week. Try another week.</FieldHint>
            ) : (
              week.map(([day, daySlots]) => (
                <SlotDay key={day}>
                  <SlotDayLabel>{describeDate(day)}</SlotDayLabel>
                  <SlotChips role="group" aria-label={describeDate(day)}>
                    {daySlots.map((slot) => {
                      const selected =
                        picked?.date === slot.date &&
                        picked?.startTime === slot.startTime;
                      return (
                        <SlotChip
                          key={slot.startTime}
                          type="button"
                          $selected={selected}
                          aria-pressed={selected}
                          title={`With ${slot.teachers.join(" and ")}`}
                          onClick={() => setPicked(slot)}
                        >
                          {slot.startTime}
                        </SlotChip>
                      );
                    })}
                  </SlotChips>
                </SlotDay>
              ))
            )}

            {picked && (
              <FieldHint>
                {describeDate(picked.date)}, {picked.startTime}–{picked.endTime},
                with {picked.teachers.join(" and ")}.
              </FieldHint>
            )}

            <Input
              id="meeting-topic"
              type="textarea"
              name="topic"
              label="What is it about?"
              rows={2}
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
              <RadioLabel>
                <input
                  type="checkbox"
                  checked={withTeam}
                  onChange={(e) => setWithTeam(e.target.checked)}
                  disabled={isPending}
                />
                Put it on my team&apos;s calendar too ({teamName})
              </RadioLabel>
            )}
          </FormGrid>

          {error && <FormError role="alert">{error}</FormError>}

          <FormActions>
            <Button
              type="button"
              $styletype="outlined"
              onClick={onClose}
              disabled={isPending}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              $styletype="default"
              disabled={isPending || !picked || topic.trim().length < 2}
            >
              {isPending
                ? "BOOKING…"
                : picked
                  ? `BOOK ${picked.startTime}`
                  : "PICK A TIME"}
            </Button>
          </FormActions>
        </form>
      </FormCard>
    </Overlay>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
};
