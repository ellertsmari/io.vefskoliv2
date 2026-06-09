import type { Metadata } from "next";
import CalendarView from "./CalendarView";

export const metadata: Metadata = {
  title: "Calendar | Vefskólinn LMS",
  description: "Course schedule and key dates for the active semester.",
};

export default function CalendarPage() {
  return <CalendarView />;
}
