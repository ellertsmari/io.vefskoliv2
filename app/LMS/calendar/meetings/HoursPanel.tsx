"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBookingWindow, saveBookingWindow } from "serverActions/meetings";
import {
  MIN_TEACHERS_PRESENT,
  WEEKDAY_NAMES,
  describeDate,
  normalizeTime,
} from "utils/calendarUtils";
import { buildSlots, lengthLabel } from "utils/meetingUtils";
import type { BookingWindowInfo, SemesterInfo } from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import {
  Field,
  FieldLabel,
  FieldRow,
  FormError,
  FormSuccess,
  NativeSelect,
} from "../style";
import { LengthField, TimeField } from "./fields";
import {
  DialogBody,
  Muted,
  PrimaryButton,
  QuietButton,
  Section,
  SectionTitle,
  SlotActions,
  SlotList,
  SlotRow,
  SlotTime,
  SlotWho,
} from "./style";

/** "19 Nov" from a date key. */
const dayMonth = (key: string) => {
  const [, day, month] = describeDate(key).split(" ");
  return `${day} ${month.slice(0, 3)}`;
};

/**
 * The weekly hours in which a student may book the teachers, e.g. Tuesdays
 * 13:00–15:00 in 30-minute meetings. Hours belong to the whole teacher team;
 * a time inside them is offered only when no lecture or holiday is on and at
 * least two teachers are free.
 */
export const HoursPanel = ({
  windows,
  semester,
}: {
  windows: BookingWindowInfo[];
  semester: SemesterInfo;
}) => {
  const router = useRouter();
  const [busy, startWork] = useTransition();
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("15:00");
  const [minutes, setMinutes] = useState(20);
  const [validFrom, setValidFrom] = useState(semester.startDate);
  const [validTo, setValidTo] = useState(semester.endDate);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const perWeek = buildSlots(normalizeTime(startTime), normalizeTime(endTime), minutes)
    .length;

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(undefined);
    setErrors({});
    startWork(async () => {
      const result = await saveBookingWindow({
        weekday: Number(weekday),
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
        slotMinutes: minutes,
        validFrom,
        validTo,
      });
      setMessage({ ok: result.success, text: result.message ?? "" });
      if (result.success) router.refresh();
      else if (result.errors) setErrors(result.errors);
    });
  };

  const handleRemove = (id: string) => {
    setMessage(undefined);
    startWork(async () => {
      const result = await deleteBookingWindow(id);
      setMessage({ ok: result.success, text: result.message ?? "" });
      if (result.success) router.refresh();
    });
  };

  return (
    <DialogBody>
      <Muted>
        Students can book any free time inside these hours. A time is offered
        only while at least {MIN_TEACHERS_PRESENT} teachers are free: lectures,
        holidays, other meetings and your own “Not available” events take
        times out on their own.
      </Muted>

      <Section>
        <SectionTitle>Current hours</SectionTitle>
        {windows.length === 0 ? (
          <Muted>None yet. Students cannot book a meeting until you add some.</Muted>
        ) : (
          <SlotList>
            {windows.map((window) => (
              <SlotRow key={window.id}>
                <SlotTime>
                  {window.startTime}–{window.endTime}
                </SlotTime>
                <SlotWho>
                  <span>
                    {WEEKDAY_NAMES[window.weekday]}s · {lengthLabel(window.slotMinutes)}{" "}
                    each
                  </span>
                  <small>
                    {dayMonth(window.validFrom)} to {dayMonth(window.validTo)}
                  </small>
                </SlotWho>
                <SlotActions>
                  <QuietButton
                    type="button"
                    $danger
                    disabled={busy}
                    aria-label={`Remove ${WEEKDAY_NAMES[window.weekday]}s ${window.startTime}`}
                    onClick={() => handleRemove(window.id)}
                  >
                    Remove
                  </QuietButton>
                </SlotActions>
              </SlotRow>
            ))}
          </SlotList>
        )}
      </Section>

      <Section as="form" onSubmit={handleAdd}>
        <SectionTitle>Add hours</SectionTitle>
        <FieldRow>
          <Field>
            <FieldLabel htmlFor="hours-weekday">Every</FieldLabel>
            <NativeSelect
              id="hours-weekday"
              value={weekday}
              disabled={busy}
              onChange={(e) => setWeekday(e.target.value)}
            >
              {WEEKDAY_NAMES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <TimeField
            id="hours-start"
            label="From"
            value={startTime}
            disabled={busy}
            onChange={setStartTime}
            error={errors.startTime?.[0]}
          />
          <TimeField
            id="hours-end"
            label="To"
            value={endTime}
            disabled={busy}
            onChange={setEndTime}
            error={errors.endTime?.[0]}
          />
          <LengthField
            id="hours-length"
            label="Each meeting lasts"
            value={minutes}
            disabled={busy}
            onChange={setMinutes}
          />
        </FieldRow>
        <FieldRow>
          <Input
            id="hours-from"
            type="date"
            label="First week from"
            required
            disabled={busy}
            value={validFrom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValidFrom(e.target.value)
            }
            error={errors.validFrom?.[0]}
          />
          <Input
            id="hours-to"
            type="date"
            label="Until"
            required
            disabled={busy}
            min={validFrom}
            value={validTo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValidTo(e.target.value)
            }
            error={errors.validTo?.[0]}
          />
        </FieldRow>
        <Muted>
          {perWeek === 0
            ? `No meeting of ${lengthLabel(minutes)} fits between those times.`
            : `Up to ${perWeek} meeting${perWeek === 1 ? "" : "s"} of ${lengthLabel(minutes)} each ${WEEKDAY_NAMES[Number(weekday)]}.`}
        </Muted>
        <div>
          <PrimaryButton type="submit" disabled={busy || perWeek === 0}>
            {busy ? "Working…" : "Add meeting hours"}
          </PrimaryButton>
        </div>
        {message &&
          (message.ok ? (
            <FormSuccess role="status">{message.text}</FormSuccess>
          ) : (
            <FormError role="alert">{message.text}</FormError>
          ))}
      </Section>
    </DialogBody>
  );
};
