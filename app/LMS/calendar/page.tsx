import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import {
  getCalendarEvents,
  getShareableUsers,
} from "serverActions/calendarEvents";
import CalendarView from "./CalendarView";

export const metadata: Metadata = {
  title: "Calendar | Vefskólinn LMS",
  description: "Course schedule and key dates for the active semester.",
};

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const [events, people] = await Promise.all([
    getCalendarEvents(),
    getShareableUsers(),
  ]);

  return (
    <CalendarView
      events={events}
      people={people}
      viewerRole={session.user.role}
    />
  );
}
