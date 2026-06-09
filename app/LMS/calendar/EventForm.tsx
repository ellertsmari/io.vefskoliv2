"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCalendarEvent,
  updateCalendarEvent,
  type ShareableUser,
} from "serverActions/calendarEvents";
import {
  CATEGORY_META,
  defaultCategoryForRole,
  isTimedCategory,
  type CalendarEventInput,
  type ClientCalendarEvent,
  type EventCategory,
} from "utils/calendarUtils";
import { Input } from "UIcomponents/input/Input";
import { Button } from "globalStyles/buttons/default/style";
import {
  Overlay,
  FormCard,
  FormTitle,
  FormGrid,
  Field,
  FieldLabel,
  NativeSelect,
  RadioRow,
  RadioLabel,
  PeoplePicker,
  PersonOption,
  FormActions,
  FormError,
  FieldHint,
} from "./style";

const CATEGORY_ORDER: EventCategory[] = [
  "lecture",
  "module2",
  "guide",
  "groupwork",
  "holiday",
];

type Visibility = "everyone" | "onlyMe" | "shared";

const todayKey = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Create/edit form for calendar events.
 *
 * Defaults follow the role: students most often log Module 2 (community)
 * events, teachers most often schedule lectures. Timed categories (lecture,
 * module 2) take a single day with start/end times; ranged categories (guide,
 * group work, holiday) take a start and end date.
 */
export const EventForm = ({
  initial,
  defaultDate,
  viewerRole,
  people,
  onClose,
}: {
  /** present = edit mode */
  initial?: ClientCalendarEvent;
  /** prefill for create mode (the selected day) */
  defaultDate?: string;
  viewerRole?: string;
  people: ShareableUser[];
  onClose: () => void;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(
    initial?.category ?? defaultCategoryForRole(viewerRole)
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? defaultDate ?? todayKey()
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ?? initial?.startDate ?? defaultDate ?? todayKey()
  );
  const [startTime, setStartTime] = useState(initial?.startTime ?? "10:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "11:00");
  const [visibility, setVisibility] = useState<Visibility>(
    initial
      ? initial.visibility === "everyone"
        ? "everyone"
        : initial.sharedWith.length > 0
        ? "shared"
        : "onlyMe"
      : "everyone"
  );
  const [sharedWith, setSharedWith] = useState<Set<string>>(
    new Set(initial?.sharedWith ?? [])
  );

  const [formError, setFormError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  const timed = isTimedCategory(category);
  const editing = !!initial;

  const togglePerson = (id: string) => {
    setSharedWith((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);
    setFieldErrors({});

    const input: CalendarEventInput = {
      title,
      description: description || undefined,
      category,
      startDate,
      endDate: timed ? undefined : endDate,
      startTime: timed ? startTime : undefined,
      endTime: timed ? endTime : undefined,
      visibility: visibility === "everyone" ? "everyone" : "restricted",
      sharedWith: visibility === "shared" ? [...sharedWith] : [],
    };

    startTransition(async () => {
      const result = editing
        ? await updateCalendarEvent(initial.id, input)
        : await createCalendarEvent(input);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setFormError(result.message);
        if ("errors" in result && result.errors) {
          setFieldErrors(result.errors as Record<string, string[]>);
        }
      }
    });
  };

  const fieldError = (name: string) => fieldErrors[name]?.[0];

  return (
    <Overlay onClick={onClose}>
      <FormCard onClick={(e) => e.stopPropagation()}>
        <FormTitle>{editing ? "Edit event" : "Add event"}</FormTitle>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <Input
              id="event-title"
              type="text"
              name="title"
              label="Title"
              required
              disabled={isPending}
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              error={fieldError("title")}
            />

            <Field>
              <FieldLabel htmlFor="event-category">Event type</FieldLabel>
              <NativeSelect
                id="event-category"
                value={category}
                disabled={isPending}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
              >
                {CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </NativeSelect>
              <FieldHint>
                {timed
                  ? "Scheduled on a single day with a start and end time."
                  : "Spans one or more whole days."}
              </FieldHint>
            </Field>

            {timed ? (
              <>
                <Input
                  id="event-date"
                  type="date"
                  name="startDate"
                  label="Date"
                  required
                  disabled={isPending}
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStartDate(e.target.value)
                  }
                  error={fieldError("startDate")}
                />
                <Input
                  id="event-start-time"
                  type="time"
                  name="startTime"
                  label="From"
                  required
                  disabled={isPending}
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                  error={fieldError("startTime")}
                />
                <Input
                  id="event-end-time"
                  type="time"
                  name="endTime"
                  label="To"
                  required
                  disabled={isPending}
                  value={endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                  error={fieldError("endTime")}
                />
              </>
            ) : (
              <>
                <Input
                  id="event-start-date"
                  type="date"
                  name="startDate"
                  label="First day"
                  required
                  disabled={isPending}
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  error={fieldError("startDate")}
                />
                <Input
                  id="event-end-date"
                  type="date"
                  name="endDate"
                  label="Last day"
                  required
                  disabled={isPending}
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  error={fieldError("endDate")}
                />
              </>
            )}

            <Input
              id="event-description"
              type="textarea"
              name="description"
              label="Description (optional)"
              required={false}
              disabled={isPending}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              error={fieldError("description")}
            />

            <Field>
              <FieldLabel as="span">Who can see this?</FieldLabel>
              <RadioRow role="radiogroup" aria-label="Event visibility">
                <RadioLabel>
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "everyone"}
                    onChange={() => setVisibility("everyone")}
                    disabled={isPending}
                  />
                  Everyone
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "onlyMe"}
                    onChange={() => setVisibility("onlyMe")}
                    disabled={isPending}
                  />
                  Only me
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "shared"}
                    onChange={() => setVisibility("shared")}
                    disabled={isPending}
                  />
                  Me + people I pick
                </RadioLabel>
              </RadioRow>
              {visibility === "shared" && (
                <PeoplePicker aria-label="People to share with">
                  {people.length === 0 && (
                    <FieldHint>No one else to share with yet.</FieldHint>
                  )}
                  {people.map((person) => (
                    <PersonOption key={person.id}>
                      <input
                        type="checkbox"
                        checked={sharedWith.has(person.id)}
                        onChange={() => togglePerson(person.id)}
                        disabled={isPending}
                      />
                      {person.name}
                    </PersonOption>
                  ))}
                </PeoplePicker>
              )}
            </Field>
          </FormGrid>

          {formError && <FormError>{formError}</FormError>}

          <FormActions>
            <Button
              type="button"
              $styletype="outlined"
              onClick={onClose}
              disabled={isPending}
            >
              CANCEL
            </Button>
            <Button type="submit" $styletype="default" disabled={isPending}>
              {isPending
                ? "SAVING…"
                : editing
                ? "SAVE CHANGES"
                : "ADD EVENT"}
            </Button>
          </FormActions>
        </form>
      </FormCard>
    </Overlay>
  );
};
