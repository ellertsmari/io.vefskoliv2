"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSemester } from "serverActions/semester";
import {
  copyCalendarEvents,
  importSemesterPlan,
} from "serverActions/calendarEvents";
import { addDays } from "utils/calendarUtils";
import type { SemesterInfo } from "types/calendarTypes";
import { Input } from "UIcomponents/input/Input";
import { Button } from "globalStyles/buttons/default/style";
import {
  SettingsCard,
  SettingsSummary,
  SettingsBody,
  SettingsSection,
  SettingsTitle,
  FieldRow,
  FieldHint,
  FormError,
  FormSuccess,
} from "./style";

type Errors = Record<string, string[] | undefined>;

/**
 * Teacher-only term settings, folded away under the calendar header.
 *
 * Left: the term's dates, which decide which months the calendar shows.
 * Right: two ways to fill a new term without typing. "Import the built-in
 * plan" loads the autumn 2026 schedule that used to be hardcoded; "Copy
 * events" moves a past range forward by whole weeks, so last year's
 * Wednesday lectures land on this year's Wednesdays. Both are safe to run
 * twice.
 */
export const SemesterCard = ({
  semester,
  eventCount,
}: {
  semester: SemesterInfo;
  eventCount: number;
}) => {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [label, setLabel] = useState(semester.label);
  const [startDate, setStartDate] = useState(semester.startDate);
  const [endDate, setEndDate] = useState(semester.endDate);
  const [spann2Start, setSpann2Start] = useState(semester.spann2Start ?? "");
  const [saveErrors, setSaveErrors] = useState<Errors>({});
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string }>();

  const [copying, startCopy] = useTransition();
  const [fromDate, setFromDate] = useState(addDays(semester.startDate, -364));
  const [toDate, setToDate] = useState(addDays(semester.endDate, -364));
  const [weeks, setWeeks] = useState("52");
  const [copyErrors, setCopyErrors] = useState<Errors>({});
  const [copyMessage, setCopyMessage] = useState<{ ok: boolean; text: string }>();

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage(undefined);
    setSaveErrors({});
    startSave(async () => {
      const result = await saveSemester({ label, startDate, endDate, spann2Start });
      if (result.success) {
        setSaveMessage({ ok: true, text: result.message ?? "Saved" });
        router.refresh();
      } else {
        setSaveMessage({ ok: false, text: result.message });
        if (result.errors) setSaveErrors(result.errors);
      }
    });
  };

  const handleImport = () => {
    setCopyMessage(undefined);
    startCopy(async () => {
      const result = await importSemesterPlan();
      setCopyMessage({ ok: result.success, text: result.message ?? "" });
      if (result.success) router.refresh();
    });
  };

  const handleCopy = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCopyMessage(undefined);
    setCopyErrors({});
    startCopy(async () => {
      const result = await copyCalendarEvents({
        fromDate,
        toDate,
        weeks: Number(weeks),
      });
      setCopyMessage({ ok: result.success, text: result.message ?? "" });
      if (result.success) router.refresh();
      else if (result.errors) setCopyErrors(result.errors);
    });
  };

  return (
    <SettingsCard>
      <details>
        <SettingsSummary>
          Semester settings
          {!semester.saved && " · using the built-in default until saved"}
        </SettingsSummary>
        <SettingsBody>
          <SettingsSection as="form" onSubmit={handleSave}>
            <SettingsTitle>This term</SettingsTitle>
            <Input
              id="semester-label"
              type="text"
              label="Name"
              required
              maxLength={80}
              disabled={saving}
              value={label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLabel(e.target.value)
              }
              error={saveErrors.label?.[0]}
            />
            <FieldRow>
              <Input
                id="semester-start"
                type="date"
                label="First day"
                required
                disabled={saving}
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStartDate(e.target.value)
                }
                error={saveErrors.startDate?.[0]}
              />
              <Input
                id="semester-end"
                type="date"
                label="Last day"
                required
                disabled={saving}
                min={startDate}
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEndDate(e.target.value)
                }
                error={saveErrors.endDate?.[0]}
              />
              <Input
                id="semester-spann2"
                type="date"
                label="Spönn 2 starts (optional)"
                disabled={saving}
                min={startDate}
                max={endDate}
                value={spann2Start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSpann2Start(e.target.value)
                }
                error={saveErrors.spann2Start?.[0]}
              />
            </FieldRow>
            <FieldHint>
              The calendar shows every month from the first day to the last.
            </FieldHint>
            <div>
              <Button type="submit" $styletype="default" disabled={saving}>
                {saving ? "SAVING…" : "SAVE TERM"}
              </Button>
            </div>
            {saveMessage &&
              (saveMessage.ok ? (
                <FormSuccess role="status">{saveMessage.text}</FormSuccess>
              ) : (
                <FormError role="alert">{saveMessage.text}</FormError>
              ))}
          </SettingsSection>

          <SettingsSection as="form" onSubmit={handleCopy}>
            <SettingsTitle>Fill the calendar</SettingsTitle>
            <FieldHint>
              {eventCount === 0
                ? "The calendar is empty."
                : `${eventCount} events in the calendar.`}{" "}
              Copy a past range forward by whole weeks so lectures keep their
              weekday, or load the built-in autumn 2026 plan.
            </FieldHint>
            <FieldRow>
              <Input
                id="copy-from"
                type="date"
                label="Copy from"
                required
                disabled={copying}
                value={fromDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFromDate(e.target.value)
                }
                error={copyErrors.fromDate?.[0]}
              />
              <Input
                id="copy-to"
                type="date"
                label="Copy to"
                required
                disabled={copying}
                min={fromDate}
                value={toDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setToDate(e.target.value)
                }
                error={copyErrors.toDate?.[0]}
              />
              <Input
                id="copy-weeks"
                type="number"
                label="Move forward (weeks)"
                required
                min={1}
                max={104}
                disabled={copying}
                value={weeks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWeeks(e.target.value)
                }
                error={copyErrors.weeks?.[0]}
              />
            </FieldRow>
            <FieldRow>
              <Button type="submit" $styletype="default" disabled={copying}>
                {copying ? "WORKING…" : "COPY EVENTS"}
              </Button>
              <Button
                type="button"
                $styletype="outlined"
                disabled={copying}
                onClick={handleImport}
              >
                IMPORT BUILT-IN PLAN
              </Button>
            </FieldRow>
            {copyMessage &&
              (copyMessage.ok ? (
                <FormSuccess role="status">{copyMessage.text}</FormSuccess>
              ) : (
                <FormError role="alert">{copyMessage.text}</FormError>
              ))}
          </SettingsSection>
        </SettingsBody>
      </details>
    </SettingsCard>
  );
};
