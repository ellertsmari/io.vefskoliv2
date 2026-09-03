"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBookingWindow,
  saveBookingWindow,
} from "serverActions/meetings";
import {
  MEETING_SLOT_MINUTES,
  MIN_TEACHERS_PRESENT,
  WEEKDAY_NAMES,
  normalizeTime,
} from "utils/calendarUtils";
import type { BookingWindowInfo, SemesterInfo } from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import { Button } from "globalStyles/buttons/default/style";
import {
  SettingsSection,
  SettingsTitle,
  FieldRow,
  Field,
  FieldLabel,
  FieldHint,
  FormError,
  FormSuccess,
  NativeSelect,
  WindowList,
  WindowRow,
  SmallActionButton,
} from "./style";

/**
 * The weekly hours in which students may book a meeting. Windows belong to
 * the whole teacher team; a slot inside one is offered only when at least
 * two teachers have no "Not available" event at that time.
 */
export const MeetingHoursCard = ({
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
  const [validFrom, setValidFrom] = useState(semester.startDate);
  const [validTo, setValidTo] = useState(semester.endDate);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(undefined);
    setErrors({});
    startWork(async () => {
      const result = await saveBookingWindow({
        weekday: Number(weekday),
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
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
    <SettingsSection as="form" onSubmit={handleAdd}>
      <SettingsTitle>Meeting hours</SettingsTitle>
      <FieldHint>
        When students may book a {MEETING_SLOT_MINUTES}-minute meeting. A time
        is offered only while at least {MIN_TEACHERS_PRESENT} teachers are free,
        so mark yourself &quot;Not available&quot; on the calendar when you
        teach elsewhere and those times drop out on their own.
      </FieldHint>

      {windows.length > 0 && (
        <WindowList>
          {windows.map((window) => (
            <WindowRow key={window.id}>
              <span>
                <strong>{WEEKDAY_NAMES[window.weekday]}s</strong>{" "}
                {window.startTime}–{window.endTime} · {window.validFrom} to{" "}
                {window.validTo}
              </span>
              <SmallActionButton
                type="button"
                $danger
                disabled={busy}
                onClick={() => handleRemove(window.id)}
              >
                Remove
              </SmallActionButton>
            </WindowRow>
          ))}
        </WindowList>
      )}

      <FieldRow>
        <Field>
          <FieldLabel htmlFor="window-weekday">Day</FieldLabel>
          <NativeSelect
            id="window-weekday"
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
        <Input
          id="window-start"
          type="text"
          label="From"
          inputMode="numeric"
          placeholder="13:00"
          maxLength={5}
          required
          disabled={busy}
          value={startTime}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setStartTime(e.target.value)
          }
          onBlur={() => setStartTime(normalizeTime(startTime))}
          error={errors.startTime?.[0]}
        />
        <Input
          id="window-end"
          type="text"
          label="To"
          inputMode="numeric"
          placeholder="15:00"
          maxLength={5}
          required
          disabled={busy}
          value={endTime}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEndTime(e.target.value)
          }
          onBlur={() => setEndTime(normalizeTime(endTime))}
          error={errors.endTime?.[0]}
        />
      </FieldRow>
      <FieldRow>
        <Input
          id="window-from"
          type="date"
          label="First day"
          required
          disabled={busy}
          value={validFrom}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValidFrom(e.target.value)
          }
          error={errors.validFrom?.[0]}
        />
        <Input
          id="window-to"
          type="date"
          label="Last day"
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
      <div>
        <Button type="submit" $styletype="default" disabled={busy}>
          {busy ? "WORKING…" : "ADD MEETING HOURS"}
        </Button>
      </div>
      {message &&
        (message.ok ? (
          <FormSuccess role="status">{message.text}</FormSuccess>
        ) : (
          <FormError role="alert">{message.text}</FormError>
        ))}
    </SettingsSection>
  );
};
