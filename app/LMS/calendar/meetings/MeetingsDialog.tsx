"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ShareableUser } from "serverActions/calendarEvents";
import { describeDate, todayKey } from "utils/calendarUtils";
import { lengthLabel, needsSignUp } from "utils/meetingUtils";
import type {
  BookingWindowInfo,
  CalendarEvent,
  SemesterInfo,
  SignupSheetInfo,
  SignupTargets,
} from "types/calendarTypes";
import { Overlay } from "../style";
import { MeetingHoursCard } from "../MeetingHoursCard";
import { SheetForm } from "./SheetForm";
import { SheetView } from "./SheetView";
import {
  ChoiceCard,
  ChoiceGrid,
  ChoiceIcon,
  ChoiceText,
  ChoiceTitle,
  DialogBody,
  DialogHeader,
  DialogTitle,
  IconButton,
  MeetingRow,
  MeetingsCard,
  Muted,
  PrimaryButton,
  RowAction,
  RowBody,
  RowList,
  RowSub,
  RowTitle,
  RowWhen,
  Section,
  SectionTitle,
  Toolbar,
} from "./style";

export type MeetingsView =
  | { name: "home" }
  | { name: "new" }
  | { name: "sheet-new" }
  | { name: "sheet"; id: string }
  | { name: "hours" };

type Props = {
  view: MeetingsView;
  onView: (view: MeetingsView) => void;
  onClose: () => void;
  /** Students: open the "meet the teachers" booking. */
  onBook: () => void;
  isTeacher: boolean;
  sheets: SignupSheetInfo[];
  targets: SignupTargets;
  people: ShareableUser[];
  /** Everything on the viewer's calendar, sheets included. */
  events: CalendarEvent[];
  /** Whether the teachers have any open time to book. */
  canBook: boolean;
  windows: BookingWindowInfo[];
  semester: SemesterInfo;
  /** The day selected in the calendar, if any. */
  selectedDate?: string;
};

/** "Thu 19 Nov" from a date key. */
const shortDate = (key: string) => {
  const [weekday, day, month] = describeDate(key).split(" ");
  return `${weekday} ${day} ${month.slice(0, 3)}`;
};

/**
 * Everything about meetings in one place: what is waiting for the viewer,
 * what is coming up, and "New meeting", which asks one question (what kind?)
 * before showing any form.
 */
export const MeetingsDialog = ({
  view,
  onView,
  onClose,
  onBook,
  isTeacher,
  sheets,
  targets,
  people,
  events,
  canBook,
  windows,
  semester,
  selectedDate,
}: Props) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const today = todayKey();
  const sheet = view.name === "sheet" ? sheets.find((s) => s.id === view.id) : undefined;

  const title =
    view.name === "home"
      ? "Meetings"
      : view.name === "new"
        ? "New meeting"
        : view.name === "sheet-new"
          ? "New sign-up sheet"
          : view.name === "hours"
            ? "Meeting hours"
            : (sheet?.title ?? "Sign-up sheet");
  const back: MeetingsView | null =
    view.name === "home"
      ? null
      : view.name === "sheet-new" || view.name === "hours"
        ? { name: "new" }
        : { name: "home" };

  const todo = sheets.filter(needsSignUp);
  const upcoming = sheets.filter((s) => s.date >= today && !needsSignUp(s));
  const earlier = sheets.filter((s) => s.date < today);
  // Booked and scheduled meetings are ordinary calendar events.
  const booked = events.filter(
    (event) => event.category === "meeting" && !event.meetingRef && event.date >= today
  );

  const sheetRow = (s: SignupSheetInfo, attention: boolean) => {
    const mine = s.slots.find((slot) => slot.startTime === s.mySlot);
    const taken = s.slots.filter((slot) => slot.claims.length > 0).length;
    return (
      <li key={s.id}>
        <MeetingRow
          type="button"
          $attention={attention}
          onClick={() => onView({ name: "sheet", id: s.id })}
        >
          <RowWhen>
            <strong>{shortDate(s.date)}</strong>
            {mine
              ? `${mine.startTime}–${mine.endTime}`
              : `${s.slots[0]?.startTime}–${s.slots[s.slots.length - 1]?.endTime}`}
          </RowWhen>
          <RowBody>
            <RowTitle>{s.title}</RowTitle>
            <RowSub>
              {attention
                ? `Pick a ${lengthLabel(s.slotMinutes)} slot${s.signUpAs ? ` for ${s.signUpAs}` : ""}`
                : s.canManage
                  ? `${taken} of ${s.slots.length} slots taken · ${s.audienceLabel}`
                  : mine
                    ? `${s.signUpAs ?? "You"} signed up · by ${s.ownerName}`
                    : `Sign-up sheet · by ${s.ownerName}`}
            </RowSub>
          </RowBody>
          <RowAction $strong={attention}>{attention ? "Pick a time →" : "Open →"}</RowAction>
        </MeetingRow>
      </li>
    );
  };

  const dialog = (
    <Overlay onClick={onClose}>
      <MeetingsCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="meetings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          {back && (
            <IconButton type="button" onClick={() => onView(back)}>
              ‹ Back
            </IconButton>
          )}
          <DialogTitle id="meetings-title">{title}</DialogTitle>
          <IconButton type="button" aria-label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </DialogHeader>

        {view.name === "home" && (
          <DialogBody>
            <Toolbar>
              <Muted>
                {todo.length > 0
                  ? `${todo.length} waiting for you.`
                  : "Sign-up sheets and booked meetings."}
              </Muted>
              <PrimaryButton type="button" onClick={() => onView({ name: "new" })}>
                + New meeting
              </PrimaryButton>
            </Toolbar>

            {todo.length > 0 && (
              <Section>
                <SectionTitle>Waiting for you</SectionTitle>
                <RowList>{todo.map((s) => sheetRow(s, true))}</RowList>
              </Section>
            )}

            <Section>
              <SectionTitle>Coming up</SectionTitle>
              {upcoming.length === 0 && booked.length === 0 ? (
                <Muted>Nothing planned yet.</Muted>
              ) : (
                <RowList>
                  {upcoming.map((s) => sheetRow(s, false))}
                  {booked.map((event) => (
                    <li key={event.id}>
                      <MeetingRow as="div" style={{ cursor: "default" }}>
                        <RowWhen>
                          <strong>{shortDate(event.date)}</strong>
                          {event.time}
                          {event.endTime ? `–${event.endTime}` : ""}
                        </RowWhen>
                        <RowBody>
                          <RowTitle>{event.title}</RowTitle>
                          {event.description && <RowSub>{event.description}</RowSub>}
                        </RowBody>
                        <RowAction>On the calendar</RowAction>
                      </MeetingRow>
                    </li>
                  ))}
                </RowList>
              )}
            </Section>

            {earlier.length > 0 && (
              <Section>
                <SectionTitle>Earlier</SectionTitle>
                <RowList>{earlier.map((s) => sheetRow(s, false))}</RowList>
              </Section>
            )}
          </DialogBody>
        )}

        {view.name === "new" && (
          <DialogBody>
            <Muted>What kind of meeting is it?</Muted>
            <ChoiceGrid>
              <ChoiceCard type="button" onClick={() => onView({ name: "sheet-new" })}>
                <ChoiceIcon aria-hidden>▤</ChoiceIcon>
                <ChoiceTitle>Sign-up sheet</ChoiceTitle>
                <ChoiceText>
                  You set the times, {isTeacher ? "teams or people" : "people"} each
                  pick one. For reviews, presentations and meet-ups.
                </ChoiceText>
              </ChoiceCard>
              {isTeacher ? (
                <ChoiceCard type="button" onClick={() => onView({ name: "hours" })}>
                  <ChoiceIcon aria-hidden>↻</ChoiceIcon>
                  <ChoiceTitle>Meeting hours</ChoiceTitle>
                  <ChoiceText>
                    Weekly times when a student can book the teachers.
                  </ChoiceText>
                </ChoiceCard>
              ) : (
                <ChoiceCard type="button" disabled={!canBook} onClick={onBook}>
                  <ChoiceIcon aria-hidden>☺</ChoiceIcon>
                  <ChoiceTitle>Meet the teachers</ChoiceTitle>
                  <ChoiceText>
                    {canBook
                      ? "Book one of the teachers' open times."
                      : "The teachers have no open times right now."}
                  </ChoiceText>
                </ChoiceCard>
              )}
            </ChoiceGrid>
          </DialogBody>
        )}

        {view.name === "sheet-new" && (
          <SheetForm
            isTeacher={isTeacher}
            targets={targets}
            people={people}
            events={events}
            defaultDate={selectedDate}
            onCreated={(id) => onView({ name: "sheet", id })}
          />
        )}

        {view.name === "sheet" &&
          (sheet ? (
            <SheetView
              key={sheet.id}
              sheet={sheet}
              events={events}
              onDeleted={() => onView({ name: "home" })}
            />
          ) : (
            <DialogBody>
              <Muted>This sign-up sheet is no longer there.</Muted>
            </DialogBody>
          ))}

        {view.name === "hours" && (
          <DialogBody>
            <MeetingHoursCard windows={windows} semester={semester} />
          </DialogBody>
        )}
      </MeetingsCard>
    </Overlay>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
};
