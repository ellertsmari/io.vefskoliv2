import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getGroupCalendarEvents } from "serverActions/groups/getGroupCalendarEvents";
import CalendarView from "./CalendarView";

export const metadata: Metadata = {
  title: "Calendar | Vefskólinn LMS",
  description: "Course schedule and key dates for the active semester.",
};

// Group project events come from the database — render per request.
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  // The proxy already redirects anonymous visitors; this is the page's own
  // check so a matcher change cannot expose the schedule.
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const groupProjectEvents = await getGroupCalendarEvents();
  return <CalendarView extraEvents={groupProjectEvents} />;
}
