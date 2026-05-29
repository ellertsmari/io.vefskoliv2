import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar | Vefskólinn LMS",
};

export default function CalendarPage() {
  return (
    <div>
      <h1>Calendar</h1>
      <p>Course schedule and events will be available here.</p>
    </div>
  );
}