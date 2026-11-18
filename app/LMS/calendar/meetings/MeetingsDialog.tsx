"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ShareableUser } from "serverActions/calendarEvents";
import { describeDate, todayKey } from "utils/calendarUtils";
import { lengthLabel, needsSignUp } from "utils/meetingUtils";
import type {
  BookingWindowInfo,
  CalendarEvent,
  MeetingPollInfo,
  MeetingSlot,
  SemesterInfo,
  SignupSheetInfo,
  SignupTargets,
} from "types/calendarTypes";
import { Overlay } from "../style";
import { BookPanel } from "./BookPanel";
import { HoursPanel } from "./HoursPanel";
import { PollForm } from "./PollForm";
import { PollView } from "./PollView";
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
  | { name: "poll-new" }
  | { name: "poll"; id: string }
  | { name: "hours" }
  | { name: "book"; date?: string; startTime?: string };

type Props = {
  view: MeetingsView;
  onView: (view: MeetingsView) => void;
  onClose: () => void;
  isTeacher: boolean;
  sheets: SignupSheetInfo[];
  polls: MeetingPollInfo[];
  targets: SignupTargets;
  /** The viewer's team, for "My team" polls. */
  teamName: string | null;
  people: ShareableUser[];
  /** Everything on the viewer's calendar, sheets included. */
  events: CalendarEvent[];
  /** Students: the teachers' open times. */
  slots: MeetingSlot[];
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
  isTeacher,
  sheets,
  polls,
  targets,
  teamName,
  people,
  events,
  slots,
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
  const canBook = !isTeacher && slots.length > 0;
  const sheet = view.name === "sheet" ? sheets.find((s) => s.id === view.id) : undefined;
  const poll = view.name === "poll" ? polls.find((p) => p.id === view.id) : undefined;

  const title =
    view.name === "home"
      ? "Meetings"
      : view.name === "new"
        ? "New meeting"
        : view.name === "sheet-new"
          ? "New sign-up sheet"
          : view.name === "poll-new"
            ? "Find a time"
            : view.name === "hours"
              ? "Meeting hours"
              : view.name === "book"
                ? "Meet the teachers"
              : view.name === "poll"
                ? (poll?.title ?? "Find a time")
                : (sheet?.title ?? "Sign-up sheet");
  const back: MeetingsView | null =
    view.name === "home"
      ? null
      : view.name === "sheet-new" ||
          view.name === "poll-new" ||
          view.name === "hours" ||
          view.name === "book"
        ? { name: "new" }
        : { name: "home" };

  const unanswered = polls.filter((p) => !p.answered);
  const answeredPolls = polls.filter((p) => p.answered);
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

  const pollRow = (p: MeetingPollInfo, attention: boolean) => (
    <li key={p.id}>
      <MeetingRow
        type="button"
        $attention={attention}
        onClick={() => onView({ name: "poll", id: p.id })}
      >
        <RowWhen>
          <strong>{shortDate(p.days[0])}</strong>
          {p.days.length > 1 ? `to ${shortDate(p.days[p.days.length - 1])}` : "one day"}
        </RowWhen>
        <RowBody>
          <RowTitle>{p.title}</RowTitle>
          <RowSub>
            {attention
              ? `${p.ownerName} asks when you are free · ${lengthLabel(p.lengthMinutes)}`
              : `Finding a time · ${p.responses.length}${p.invited ? ` of ${p.invited}` : ""} answered${p.isOwner ? "" : ` · by ${p.ownerName}`}`}
          </RowSub>
        </RowBody>
        <RowAction $strong={attention}>
          {attention ? "Mark my times →" : p.canManage ? "Pick a time →" : "Open →"}
        </RowAction>
      </MeetingRow>
    </li>
  );

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
                {todo.length + unanswered.length > 0
                  ? `${todo.length + unanswered.length} waiting for you.`
                  : "Sign-up sheets, polls and booked meetings."}
              </Muted>
              <PrimaryButton type="button" onClick={() => onView({ name: "new" })}>
                + New meeting
              </PrimaryButton>
            </Toolbar>

            {todo.length + unanswered.length > 0 && (
              <Section>
                <SectionTitle>Waiting for you</SectionTitle>
                <RowList>
                  {todo.map((s) => sheetRow(s, true))}
                  {unanswered.map((p) => pollRow(p, true))}
                </RowList>
              </Section>
            )}

            <Section>
              <SectionTitle>Coming up</SectionTitle>
              {upcoming.length === 0 && booked.length === 0 && answeredPolls.length === 0 ? (
                <Muted>Nothing planned yet.</Muted>
              ) : (
                <RowList>
                  {answeredPolls.map((p) => pollRow(p, false))}
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
              <ChoiceCard type="button" onClick={() => onView({ name: "poll-new" })}>
                <ChoiceIcon aria-hidden>▦</ChoiceIcon>
                <ChoiceTitle>Find a time</ChoiceTitle>
                <ChoiceText>
                  Everyone marks when they are free; you pick the time that suits
                  most.
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
                <ChoiceCard
                  type="button"
                  disabled={!canBook}
                  onClick={() => onView({ name: "book", date: selectedDate })}
                >
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

        {view.name === "poll-new" && (
          <PollForm
            teamName={teamName}
            people={people}
            defaultDate={selectedDate}
            onCreated={(id) => onView({ name: "poll", id })}
          />
        )}

        {view.name === "poll" &&
          (poll ? (
            <PollView
              key={poll.id}
              poll={poll}
              events={events}
              onGone={() => onView({ name: "home" })}
            />
          ) : (
            <DialogBody>
              <Muted>This poll is closed. If a time was picked, it is on the calendar.</Muted>
            </DialogBody>
          ))}

        {view.name === "hours" && <HoursPanel windows={windows} semester={semester} />}

        {view.name === "book" && (
          <BookPanel
            slots={slots}
            events={events}
            date={view.date}
            startTime={view.startTime}
            teamName={teamName}
            onBooked={() => onView({ name: "home" })}
          />
        )}
      </MeetingsCard>
    </Overlay>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
};
