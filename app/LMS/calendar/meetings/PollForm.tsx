"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ShareableUser } from "serverActions/calendarEvents";
import { createMeetingPoll } from "serverActions/meetingPolls";
import {
  addDays,
  describeDate,
  normalizeTime,
  todayKey,
  weekdayOf,
} from "utils/calendarUtils";
import { MAX_POLL_DAYS } from "utils/meetingUtils";
import type { PollAudience } from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import {
  Field,
  FieldLabel,
  FieldHint,
  FieldRow,
  FormError,
  NativeSelect,
  SlotChips,
} from "../style";
import { LengthField, PeopleField, TimeField } from "./fields";
import { DayChip, DialogBody, PrimaryButton, Section, SectionTitle } from "./style";

type Props = {
  /** The viewer's team, when they have one; enables "My team". */
  teamName: string | null;
  people: ShareableUser[];
  /** The day selected in the calendar, if any. */
  defaultDate?: string;
  onCreated: (pollId: string) => void;
};

/** The next few weekdays from a day on: a sensible first guess. */
const firstWeekdays = (from: string, count: number): string[] => {
  const days: string[] = [];
  for (let i = 0; i < MAX_POLL_DAYS && days.length < count; i++) {
    const day = addDays(from, i);
    if (weekdayOf(day) < 5) days.push(day);
  }
  return days;
};

/**
 * Start a "find a time" poll: who to ask, how long the meeting is, and which
 * days and hours could work. The days are a strip of the next two weeks to
 * tick; the grid everyone fills in comes after.
 */
export const PollForm = ({ teamName, people, defaultDate, onCreated }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<PollAudience>(teamName ? "team" : "shared");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [minutes, setMinutes] = useState(30);
  const [from, setFrom] = useState(
    defaultDate && defaultDate >= todayKey() ? defaultDate : todayKey()
  );
  const [days, setDays] = useState<Set<string>>(() => new Set(firstWeekdays(from, 5)));
  const [dayStart, setDayStart] = useState("09:00");
  const [dayEnd, setDayEnd] = useState("16:00");

  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const strip = Array.from({ length: MAX_POLL_DAYS }, (_, i) => addDays(from, i));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createMeetingPoll({
        title,
        description,
        days: [...days],
        dayStart: normalizeTime(dayStart),
        dayEnd: normalizeTime(dayEnd),
        lengthMinutes: minutes,
        audience,
        sharedWith: audience === "shared" ? [...picked] : [],
      });
      if (result.success) {
        router.refresh();
        onCreated(result.data.id);
        return;
      }
      setError(result.message);
      if (result.errors) setFieldErrors(result.errors);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody>
        <Input
          id="poll-title"
          type="text"
          label="What is the meeting?"
          placeholder="Plan the demo"
          required
          autoFocus
          maxLength={120}
          disabled={isPending}
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          error={fieldErrors.title?.[0]}
        />

        <FieldRow>
          <Field>
            <FieldLabel htmlFor="poll-who">Who needs to be there?</FieldLabel>
            <NativeSelect
              id="poll-who"
              value={audience}
              disabled={isPending}
              onChange={(e) => setAudience(e.target.value as PollAudience)}
            >
              {teamName && <option value="team">My team ({teamName})</option>}
              <option value="shared">People I pick</option>
              <option value="everyone">Everyone</option>
            </NativeSelect>
          </Field>
          <LengthField
            id="poll-length"
            label="How long?"
            value={minutes}
            disabled={isPending}
            onChange={setMinutes}
          />
        </FieldRow>

        {audience === "shared" && (
          <PeopleField
            people={people}
            picked={picked}
            onChange={setPicked}
            disabled={isPending}
            error={fieldErrors.sharedWith?.[0]}
          />
        )}

        <Section>
          <SectionTitle>Which days could work?</SectionTitle>
          <SlotChips role="group" aria-label="Days that could work">
            {strip.map((day) => {
              const on = days.has(day);
              const [weekday, date] = describeDate(day).split(" ");
              return (
                <DayChip
                  key={day}
                  type="button"
                  $on={on}
                  $weekend={weekdayOf(day) >= 5}
                  aria-pressed={on}
                  aria-label={describeDate(day)}
                  disabled={isPending}
                  onClick={() =>
                    setDays((prev) => {
                      const next = new Set(prev);
                      if (next.has(day)) next.delete(day);
                      else next.add(day);
                      return next;
                    })
                  }
                >
                  {weekday}
                  <strong>{date}</strong>
                </DayChip>
              );
            })}
          </SlotChips>
          <FieldHint>
            {days.size === 0
              ? "Tick at least one day."
              : `${days.size} day${days.size === 1 ? "" : "s"} ticked.`}{" "}
            Looking further ahead? Change the first day below.
          </FieldHint>
          {fieldErrors.days?.[0] && (
            <FormError role="alert">{fieldErrors.days[0]}</FormError>
          )}
        </Section>

        <FieldRow>
          <Input
            id="poll-from"
            type="date"
            label="First day shown"
            required
            disabled={isPending}
            min={todayKey()}
            value={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!e.target.value) return;
              setFrom(e.target.value);
              setDays(new Set(firstWeekdays(e.target.value, 5)));
            }}
          />
          <TimeField
            id="poll-start"
            label="Earliest"
            value={dayStart}
            disabled={isPending}
            onChange={setDayStart}
            error={fieldErrors.dayStart?.[0]}
          />
          <TimeField
            id="poll-end"
            label="Latest"
            value={dayEnd}
            disabled={isPending}
            onChange={setDayEnd}
            error={fieldErrors.dayEnd?.[0]}
          />
        </FieldRow>

        <Input
          id="poll-description"
          type="textarea"
          label="Anything they should know? (optional)"
          rows={2}
          style={{ minHeight: "4.5rem", height: "4.5rem" }}
          maxLength={1000}
          disabled={isPending}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          error={fieldErrors.description?.[0]}
        />

        {error && <FormError role="alert">{error}</FormError>}

        <div>
          <PrimaryButton
            type="submit"
            disabled={isPending || days.size === 0 || title.trim() === ""}
          >
            {isPending ? "Creating…" : "Ask when people are free"}
          </PrimaryButton>
        </div>
      </DialogBody>
    </form>
  );
};
