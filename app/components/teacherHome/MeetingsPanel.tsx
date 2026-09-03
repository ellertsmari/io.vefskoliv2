"use client";

import { useEffect, useState } from "react";
import { getUpcomingMeetings } from "serverActions/meetings";
import { describeDate, todayKey } from "utils/calendarUtils";
import type { UpcomingMeeting } from "types/calendarTypes";
import { Avatar } from "UIcomponents/avatar/Avatar";
import {
  MeetingsCard,
  MeetingsHeader,
  MeetingsTitle,
  MeetingsLink,
  MeetingList,
  MeetingRow,
  MeetingTime,
  MeetingBody,
  MeetingWho,
  MeetingTopic,
  MeetingMuted,
  BadgeCount,
} from "./styles.TeacherHomePage";

const UPCOMING_SHOWN = 3;

/**
 * What the teacher has booked with students: today's meetings in full, then
 * the next few. Bookings are the one thing students put on a teacher's
 * calendar without asking, and there is no notification path, so the
 * dashboard is where they get noticed.
 */
export const MeetingsPanel = () => {
  const [meetings, setMeetings] = useState<UpcomingMeeting[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUpcomingMeetings().then((list) => {
      if (!cancelled) setMeetings(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = todayKey();
  const todays = (meetings ?? []).filter((meeting) => meeting.date === today);
  const later = (meetings ?? [])
    .filter((meeting) => meeting.date > today)
    .slice(0, UPCOMING_SHOWN);

  const row = (meeting: UpcomingMeeting, withDate: boolean) => (
    <MeetingRow key={meeting.id}>
      <MeetingTime>
        {withDate && <span>{describeDate(meeting.date).slice(0, 6)}</span>}
        {meeting.startTime}–{meeting.endTime}
      </MeetingTime>
      <Avatar
        name={meeting.studentName}
        url={meeting.studentAvatarUrl}
        size={32}
      />
      <MeetingBody>
        <MeetingWho>
          {meeting.studentName}
          {meeting.teamName ? ` · ${meeting.teamName}` : ""}
          {meeting.withTeachers.length > 0 && (
            <MeetingMuted> · with {meeting.withTeachers.join(", ")}</MeetingMuted>
          )}
        </MeetingWho>
        <MeetingTopic>{meeting.topic}</MeetingTopic>
      </MeetingBody>
    </MeetingRow>
  );

  return (
    <MeetingsCard aria-live="polite">
      <MeetingsHeader>
        <MeetingsTitle>
          Today&apos;s meetings
          {todays.length > 0 && <BadgeCount>{todays.length}</BadgeCount>}
        </MeetingsTitle>
        <MeetingsLink href="/LMS/calendar">Open calendar</MeetingsLink>
      </MeetingsHeader>

      {meetings === null ? (
        <MeetingMuted>Checking the calendar…</MeetingMuted>
      ) : todays.length === 0 ? (
        <MeetingMuted>No meetings today.</MeetingMuted>
      ) : (
        <MeetingList>{todays.map((meeting) => row(meeting, false))}</MeetingList>
      )}

      {later.length > 0 && (
        <>
          <MeetingMuted as="h3">Coming up</MeetingMuted>
          <MeetingList>{later.map((meeting) => row(meeting, true))}</MeetingList>
        </>
      )}
    </MeetingsCard>
  );
};
