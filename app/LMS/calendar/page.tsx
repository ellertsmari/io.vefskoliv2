import type { Metadata } from "next";
import { getGroupCalendarEvents } from "serverActions/groups/getGroupCalendarEvents";
import CalendarView from "./CalendarView";

export const metadata: Metadata = {
  title: "Calendar | Vefskólinn LMS",
  description: "Course schedule and key dates for the active semester.",
};

// Group project events come from the database — render per request.
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const groupProjectEvents = await getGroupCalendarEvents();
  return <CalendarView extraEvents={groupProjectEvents} />;
}
