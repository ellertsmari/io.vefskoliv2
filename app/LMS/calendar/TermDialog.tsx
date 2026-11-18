"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
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
  Overlay,
  SettingsSection,
  FieldRow,
  FieldHint,
  FormError,
  FormSuccess,
} from "./style";
import {
  DialogBody,
  DialogHeader,
  DialogTitle,
  IconButton,
  MeetingsCard,
  Tab,
  Tabs,
} from "./meetings/style";

type Errors = Record<string, string[] | undefined>;

/**
 * Teacher-only term setup, opened from the "Term" button. It is needed about
 * twice a year, so it stays out of the calendar's way and shows one job at a
 * time.
 *
 * "Dates" decides which months the calendar shows. "Fill the calendar" has
 * two ways to fill a new term without typing: copy a past range forward by
 * whole weeks, so last year's Wednesday lectures land on this year's
 * Wednesdays, or load the built-in autumn 2026 plan. Both are safe to run
 * twice.
 */
export const TermDialog = ({
  semester,
  eventCount,
  onClose,
}: {
  semester: SemesterInfo;
  eventCount: number;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [tab, setTab] = useState<"dates" | "fill">("dates");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const dialog = (
    <Overlay onClick={onClose}>
      <MeetingsCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="term-title"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle id="term-title">Term setup</DialogTitle>
          <IconButton type="button" aria-label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </DialogHeader>
        <DialogBody>
          <Tabs role="tablist">
            <Tab
              type="button"
              role="tab"
              aria-selected={tab === "dates"}
              $active={tab === "dates"}
              onClick={() => setTab("dates")}
            >
              Dates
            </Tab>
            <Tab
              type="button"
              role="tab"
              aria-selected={tab === "fill"}
              $active={tab === "fill"}
              onClick={() => setTab("fill")}
            >
              Fill the calendar
            </Tab>
          </Tabs>

          {tab === "dates" && (
          <SettingsSection as="form" onSubmit={handleSave}>
            {!semester.saved && (
              <FieldHint>
                Showing the built-in default until you save a term.
              </FieldHint>
            )}
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
          )}

          {tab === "fill" && (
          <SettingsSection as="form" onSubmit={handleCopy}>
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
          )}
        </DialogBody>
      </MeetingsCard>
    </Overlay>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
};
