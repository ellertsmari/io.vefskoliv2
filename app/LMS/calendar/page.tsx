import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { isActingAsTeacher } from "utils/userUtils";
import { getGroupCalendarEvents } from "serverActions/groups/getGroupCalendarEvents";
import {
  getCalendarEvents,
  getViewerTeamName,
} from "serverActions/calendarEvents";
import { getSemester } from "serverActions/semester";
import type { CalendarEvent } from "types/calendarTypes";
import CalendarView from "./CalendarView";
import { SemesterCard } from "./SemesterCard";

export const metadata: Metadata = {
  title: "Calendar | Vefskólinn LMS",
  description: "Course schedule and key dates for the active semester.",
};

// Events and the semester come from the database, and what the viewer may
// see depends on who they are: render per request.
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  // The proxy already redirects anonymous visitors; this is the page's own
  // check so a matcher change cannot expose the schedule.
  const session = await auth();
  if (!session?.user) redirect("/signin");
  // While a teacher views as a student, the calendar behaves as that student.
  const isTeacher = isActingAsTeacher(session);

  const [events, groupProjectEvents, semester, teamName] = await Promise.all([
    getCalendarEvents(),
    getGroupCalendarEvents(),
    getSemester(),
    isTeacher ? Promise.resolve(null) : getViewerTeamName(),
  ]);

  // Group projects are managed on their own pages; here they are read-only.
  const generated: CalendarEvent[] = groupProjectEvents.map((event) => ({
    ...event,
    source: "generated",
    canEdit: false,
  }));

  return (
    <CalendarView
      events={[...events, ...generated]}
      semester={semester}
      isTeacher={isTeacher}
      teamName={teamName}
      settings={
        isTeacher ? (
          <SemesterCard
            key="semester-settings"
            semester={semester}
            eventCount={events.length}
          />
        ) : undefined
      }
    />
  );
}
