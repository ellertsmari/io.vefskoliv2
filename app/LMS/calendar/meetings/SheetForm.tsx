"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ShareableUser } from "serverActions/calendarEvents";
import { createSignupSheet } from "serverActions/signupSheets";
import { describeDate, normalizeTime, todayKey } from "utils/calendarUtils";
import { buildSlots, clashOf, lengthLabel } from "utils/meetingUtils";
import type {
  CalendarEvent,
  SignupAudience,
  SignupTargets,
} from "types/calendarTypes";
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
import {
  CheckLabel,
  DialogBody,
  Muted,
  Notice,
  PreviewChip,
  PrimaryButton,
  Section,
  SectionTitle,
  Toolbar,
} from "./style";

type Props = {
  isTeacher: boolean;
  targets: SignupTargets;
  people: ShareableUser[];
  /** The viewer's calendar, to spot times that are already taken. */
  events: CalendarEvent[];
  /** The day selected in the calendar, if any. */
  defaultDate?: string;
  onCreated: (sheetId: string) => void;
};

/**
 * Set up a sign-up sheet: who it is for, a day, a time range and a slot
 * length. The slots appear underneath as chips; times that clash with the
 * organiser's own calendar are left out unless they untick "Skip times I'm
 * busy", and any single slot can be switched off (lunch) or back on.
 */
export const SheetForm = ({
  isTeacher,
  targets,
  people,
  events,
  defaultDate,
  onCreated,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // One select covers both "which audience" and "which project".
  const firstProject = targets.projects[0]?.id;
  const [who, setWho] = useState<string>(
    isTeacher && firstProject ? `project:${firstProject}` : "everyone"
  );
  const audience = (who.startsWith("project:") ? "project" : who) as SignupAudience;
  const projectId = audience === "project" ? who.slice("project:".length) : undefined;
  const project = targets.projects.find((candidate) => candidate.id === projectId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    defaultDate && defaultDate >= todayKey() ? defaultDate : todayKey()
  );
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("12:00");
  const [minutes, setMinutes] = useState(20);
  const [capacity, setCapacity] = useState("1");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [skipBusy, setSkipBusy] = useState(true);
  /** Slots switched on or off by hand, by start time. */
  const [byHand, setByHand] = useState<Record<string, boolean>>({});

  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const candidates = useMemo(() => {
    const start = normalizeTime(from);
    const end = normalizeTime(to);
    return buildSlots(start, end, minutes).map((slot) => ({
      ...slot,
      clash: clashOf(events, date, slot.startTime, slot.endTime),
    }));
  }, [from, to, minutes, events, date]);

  const isOn = (slot: (typeof candidates)[number]) =>
    byHand[slot.startTime] ?? !(skipBusy && slot.clash);
  const chosen = candidates.filter(isOn);
  const busyCount = candidates.filter((slot) => slot.clash).length;

  // A new range or length makes hand-picked slots meaningless.
  const resetByHand = () => setByHand({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createSignupSheet({
        title,
        description,
        date,
        slotMinutes: minutes,
        capacity: audience === "project" ? 1 : Number(capacity) || 1,
        slots: chosen.map((slot) => slot.startTime),
        audience,
        projectId,
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

  const places = Number(capacity) || 1;
  const summary =
    chosen.length === 0
      ? "No slots yet. Check the times above."
      : `${chosen.length} slot${chosen.length === 1 ? "" : "s"} of ${lengthLabel(minutes)}, ${chosen[0].startTime}–${chosen[chosen.length - 1].endTime}`;

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody>
        <Input
          id="sheet-title"
          type="text"
          label="What is it?"
          placeholder={isTeacher ? "Design review" : "Portfolio meet-up"}
          required
          autoFocus
          maxLength={120}
          disabled={isPending}
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          error={fieldErrors.title?.[0]}
        />

        <Field>
          <FieldLabel htmlFor="sheet-who">Who signs up?</FieldLabel>
          <NativeSelect
            id="sheet-who"
            value={who}
            disabled={isPending}
            onChange={(e) => setWho(e.target.value)}
          >
            {targets.projects.map((candidate) => (
              <option key={candidate.id} value={`project:${candidate.id}`}>
                Teams of {candidate.title} ({candidate.teams} team
                {candidate.teams === 1 ? "" : "s"})
              </option>
            ))}
            <option value="everyone">Everyone, one by one</option>
            {targets.teamName && (
              <option value="team">My team ({targets.teamName})</option>
            )}
            <option value="shared">People I pick</option>
          </NativeSelect>
          {audience === "project" && (
            <FieldHint>
              Any member picks a slot for the whole team. One slot per team.
            </FieldHint>
          )}
        </Field>

        {audience === "shared" && (
          <PeopleField
            people={people}
            picked={picked}
            onChange={setPicked}
            disabled={isPending}
            error={fieldErrors.sharedWith?.[0]}
          />
        )}

        <FieldRow>
          <Field>
            <Input
              id="sheet-date"
              type="date"
              label="Day"
              required
              disabled={isPending}
              min={todayKey()}
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDate(e.target.value);
                resetByHand();
              }}
              error={fieldErrors.date?.[0]}
            />
            <FieldHint>{describeDate(date)}</FieldHint>
          </Field>
          <TimeField
            id="sheet-from"
            label="From"
            value={from}
            disabled={isPending}
            onChange={(next) => {
              setFrom(next);
              resetByHand();
            }}
          />
          <TimeField
            id="sheet-to"
            label="To"
            value={to}
            disabled={isPending}
            onChange={(next) => {
              setTo(next);
              resetByHand();
            }}
          />
        </FieldRow>

        <FieldRow>
          <LengthField
            id="sheet-length"
            label="Each slot lasts"
            value={minutes}
            disabled={isPending}
            onChange={(next) => {
              setMinutes(next);
              resetByHand();
            }}
          />
          {audience !== "project" && (
            <Input
              id="sheet-capacity"
              type="number"
              label="Places per slot"
              min={1}
              max={200}
              required
              disabled={isPending}
              value={capacity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCapacity(e.target.value)
              }
              hint={
                places > 1
                  ? `Up to ${places} people share each slot.`
                  : "One person per slot. Raise it for a meet-up."
              }
            />
          )}
        </FieldRow>

        <Section>
          <Toolbar>
            <SectionTitle>Slots</SectionTitle>
            {busyCount > 0 && (
              <CheckLabel>
                <input
                  type="checkbox"
                  checked={skipBusy}
                  disabled={isPending}
                  onChange={(e) => {
                    setSkipBusy(e.target.checked);
                    resetByHand();
                  }}
                />
                Skip times I&apos;m busy ({busyCount})
              </CheckLabel>
            )}
          </Toolbar>
          {candidates.length === 0 ? (
            <Muted>
              No slot of {lengthLabel(minutes)} fits between those times.
            </Muted>
          ) : (
            <SlotChips role="group" aria-label="Slots on the sheet">
              {candidates.map((slot) => {
                const on = isOn(slot);
                return (
                  <PreviewChip
                    key={slot.startTime}
                    type="button"
                    $on={on}
                    $taken={!!slot.clash}
                    aria-pressed={on}
                    disabled={isPending}
                    title={
                      slot.clash
                        ? `You have "${slot.clash.title}" then`
                        : on
                          ? "Click to leave this slot out"
                          : "Click to add this slot"
                    }
                    onClick={() =>
                      setByHand((prev) => ({ ...prev, [slot.startTime]: !on }))
                    }
                  >
                    {slot.startTime}
                  </PreviewChip>
                );
              })}
            </SlotChips>
          )}
          <Muted>
            {summary}. Click a time to leave it out or put it back.
          </Muted>
          {fieldErrors.slots?.[0] && (
            <FormError role="alert">{fieldErrors.slots[0]}</FormError>
          )}
          {project && chosen.length > 0 && chosen.length < project.teams && (
            <Notice $tone="warn">
              {project.title} has {project.teams} teams but there are only{" "}
              {chosen.length} slots.
            </Notice>
          )}
        </Section>

        <Input
          id="sheet-description"
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
            disabled={isPending || chosen.length === 0 || title.trim() === ""}
          >
            {isPending ? "Creating…" : "Create sign-up sheet"}
          </PrimaryButton>
        </div>
      </DialogBody>
    </form>
  );
};
