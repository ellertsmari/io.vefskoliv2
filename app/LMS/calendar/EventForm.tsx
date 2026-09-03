"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "serverActions/calendarEvents";
import {
  EVENT_CATEGORIES,
  MAX_REPEAT_WEEKS,
  defaultVisibility,
  todayKey,
  type CalendarEventInput,
} from "utils/calendarUtils";
import { CATEGORY_META } from "constants/semesterPlan";
import type {
  CalendarEvent,
  EventCategory,
  EventVisibility,
} from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import { Button } from "globalStyles/buttons/default/style";
import {
  Overlay,
  FormCard,
  FormTitle,
  FormGrid,
  FieldRow,
  Field,
  FieldLabel,
  NativeSelect,
  FieldHint,
  RadioRow,
  RadioLabel,
  FormActions,
  FormError,
} from "./style";

type Props = {
  /** Present when editing. */
  initial?: CalendarEvent;
  /** The day to prefill when creating. */
  defaultDate?: string;
  isTeacher: boolean;
  /** The viewer's team, when they have one; enables "My team". */
  teamName?: string | null;
  onClose: () => void;
};

/**
 * Create or edit one event, in a dialog over the calendar.
 *
 * Teachers publish to everyone and may repeat an event weekly, which is how
 * a term's lectures get in without typing each one. Students choose between
 * themselves and their team. Editing one occurrence of a repeating event
 * offers to apply the change to the whole series; dates stay per occurrence.
 */
export const EventForm = ({
  initial,
  defaultDate,
  isTeacher,
  teamName,
  onClose,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<EventCategory>(
    initial?.category ?? (isTeacher ? "lecture" : "groupwork")
  );
  const [startDate, setStartDate] = useState(
    initial?.date ?? defaultDate ?? todayKey()
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ?? initial?.date ?? defaultDate ?? todayKey()
  );
  const [startTime, setStartTime] = useState(initial?.time ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [visibility, setVisibility] = useState<EventVisibility>(
    initial?.visibility ?? defaultVisibility(isTeacher)
  );
  const [repeatUntil, setRepeatUntil] = useState("");
  const [applyToSeries, setApplyToSeries] = useState(false);

  const [formError, setFormError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const fieldError = (name: string) => fieldErrors[name]?.[0];

  // Escape closes, like any dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);
    setFieldErrors({});

    const input: CalendarEventInput = {
      title,
      category,
      startDate,
      endDate: endDate > startDate ? endDate : "",
      startTime,
      endTime,
      link,
      description,
      visibility,
      repeatWeeklyUntil: editing ? "" : repeatUntil,
    };

    startTransition(async () => {
      const result = editing
        ? await updateCalendarEvent(initial.id, input, { applyToSeries })
        : await createCalendarEvent(input);
      if (result.success) {
        router.refresh();
        onClose();
        return;
      }
      setFormError(result.message);
      if (result.errors) setFieldErrors(result.errors);
    });
  };

  const dialog = (
    <Overlay onClick={onClose}>
      <FormCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <FormTitle id="event-form-title">
          {editing ? "Edit event" : "New event"}
        </FormTitle>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <Input
              id="event-title"
              type="text"
              name="title"
              label="Title"
              required
              autoFocus
              maxLength={120}
              disabled={isPending}
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              error={fieldError("title")}
            />

            <Field>
              <FieldLabel htmlFor="event-category">Type</FieldLabel>
              <NativeSelect
                id="event-category"
                value={category}
                disabled={isPending}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
              >
                {EVENT_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_META[value].label}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <FieldRow>
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
                disabled={isPending}
                min={startDate}
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEndDate(e.target.value)
                }
                error={fieldError("endDate")}
              />
            </FieldRow>

            <FieldRow>
              <Input
                id="event-start-time"
                type="time"
                name="startTime"
                label="From (optional)"
                disabled={isPending}
                value={startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStartTime(e.target.value)
                }
                error={fieldError("startTime")}
              />
              <Input
                id="event-end-time"
                type="time"
                name="endTime"
                label="To (optional)"
                disabled={isPending}
                value={endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEndTime(e.target.value)
                }
                error={fieldError("endTime")}
              />
            </FieldRow>

            <Input
              id="event-link"
              type="url"
              name="link"
              label="Link (optional)"
              placeholder="https://…"
              disabled={isPending}
              value={link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLink(e.target.value)
              }
              error={fieldError("link")}
            />

            <Input
              id="event-description"
              type="textarea"
              name="description"
              label="Description (optional)"
              rows={3}
              maxLength={2000}
              disabled={isPending}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              error={fieldError("description")}
            />

            {isTeacher ? (
              <FieldHint>Visible to everyone.</FieldHint>
            ) : (
              <Field>
                <FieldLabel as="span">Who can see this?</FieldLabel>
                <RadioRow role="radiogroup" aria-label="Who can see this">
                  <RadioLabel>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "private"}
                      onChange={() => setVisibility("private")}
                      disabled={isPending}
                    />
                    Only me
                  </RadioLabel>
                  <RadioLabel>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "team"}
                      onChange={() => setVisibility("team")}
                      disabled={isPending || !teamName}
                    />
                    My team{teamName ? ` (${teamName})` : ""}
                  </RadioLabel>
                </RadioRow>
                {!teamName && (
                  <FieldHint>
                    You are not on a team right now, so this stays private.
                  </FieldHint>
                )}
              </Field>
            )}

            {!editing && (
              <Field>
                <Input
                  id="event-repeat-until"
                  type="date"
                  name="repeatWeeklyUntil"
                  label="Repeat weekly until (optional)"
                  disabled={isPending}
                  min={startDate}
                  value={repeatUntil}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRepeatUntil(e.target.value)
                  }
                  error={fieldError("repeatWeeklyUntil")}
                />
                <FieldHint>
                  Makes one event per week, up to {MAX_REPEAT_WEEKS} weeks. Each
                  can be edited or removed on its own afterwards.
                </FieldHint>
              </Field>
            )}

            {editing && initial?.seriesId && (
              <RadioLabel>
                <input
                  type="checkbox"
                  checked={applyToSeries}
                  onChange={(e) => setApplyToSeries(e.target.checked)}
                  disabled={isPending}
                />
                Apply to every week of this event (dates stay as they are)
              </RadioLabel>
            )}
          </FormGrid>

          {formError && <FormError role="alert">{formError}</FormError>}

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
              {isPending ? "SAVING…" : editing ? "SAVE" : "ADD EVENT"}
            </Button>
          </FormActions>
        </form>
      </FormCard>
    </Overlay>
  );

  // Rendered into <body>: a fixed overlay inside the page layout would be
  // positioned against whichever ancestor carries a transform.
  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
};
