import { fireEvent, render, screen } from "@testing-library/react";
import CalendarView from "../../app/LMS/calendar/CalendarView";
import type { CalendarEvent, SemesterInfo } from "types/calendarTypes";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("serverActions/calendarEvents", () => ({
  createCalendarEvent: jest.fn(),
  updateCalendarEvent: jest.fn(),
  deleteCalendarEvent: jest.fn().mockResolvedValue({ success: true }),
}));

const semester: SemesterInfo = {
  label: "Autumn Semester 2026",
  startDate: "2026-08-17",
  endDate: "2026-12-21",
  saved: true,
};

const events: CalendarEvent[] = [
  {
    id: "lecture",
    date: "2026-09-16",
    title: "Intro to CSS",
    category: "lecture",
    time: "10:00",
    visibility: "everyone",
    source: "school",
    ownerName: "Smári",
    canEdit: false,
  },
  {
    id: "mine",
    date: "2026-09-16",
    title: "Study session",
    category: "groupwork",
    visibility: "private",
    source: "user",
    ownerLabel: "You",
    canEdit: true,
  },
];

describe("CalendarView", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 3) });
  });
  afterAll(() => jest.useRealTimers());

  it("opens on the current month, not the first month of term", () => {
    render(<CalendarView events={events} semester={semester} isTeacher />);

    // Month label in the header and in the side panel.
    expect(screen.getAllByText("September 2026")).toHaveLength(2);
  });

  it("jumps back to today after browsing", () => {
    render(<CalendarView events={events} semester={semester} isTeacher />);

    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getAllByText("October 2026").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Today"));
    expect(screen.getAllByText("September 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Thu 3 September")).toBeDefined();
  });

  it("shows edit and delete only for events the viewer may edit", () => {
    render(
      <CalendarView events={events} semester={semester} isTeacher={false} />
    );

    fireEvent.click(screen.getByLabelText(/Wed 16 September/));

    // Each title once in the grid (with its time) and once in the panel.
    expect(screen.getAllByText(/Intro to CSS/)).toHaveLength(2);
    expect(screen.getAllByText("Study session")).toHaveLength(2);
    expect(screen.getByText("Smári")).toBeDefined();
    expect(screen.getByText("· everyone")).toBeDefined();
    expect(screen.getByText("· only you")).toBeDefined();
    // One editable event: one Edit button, one Delete button.
    expect(screen.getAllByText("Edit")).toHaveLength(1);
    expect(screen.getAllByText("Delete")).toHaveLength(1);
  });

  it("asks before deleting", () => {
    render(
      <CalendarView events={events} semester={semester} isTeacher={false} />
    );
    fireEvent.click(screen.getByLabelText(/Wed 16 September/));

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByText("Delete this event?")).toBeDefined();
    expect(screen.getByText("Keep")).toBeDefined();
  });

  it("opens the new event dialog from the header and from a selected day", () => {
    render(<CalendarView events={events} semester={semester} isTeacher />);

    fireEvent.click(screen.getByText("+ New event"));
    expect(screen.getByRole("dialog")).toBeDefined();
    fireEvent.click(screen.getByText("CANCEL"));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByLabelText(/Wed 16 September/));
    fireEvent.click(screen.getByText("+ Add an event on this day"));
    expect(
      (screen.getByLabelText("First day") as HTMLInputElement).value
    ).toBe("2026-09-16");
  });

  it("gives students the audience choice and teachers none", () => {
    const { unmount } = render(
      <CalendarView
        events={[]}
        semester={semester}
        isTeacher={false}
        teamName="Team Rocket"
      />
    );
    fireEvent.click(screen.getByText("+ New event"));
    expect(screen.getByText("Only me")).toBeDefined();
    expect(screen.getByText("My team (Team Rocket)")).toBeDefined();
    unmount();

    render(<CalendarView events={[]} semester={semester} isTeacher />);
    fireEvent.click(screen.getByText("+ New event"));
    expect(screen.getByText("Visible to everyone.")).toBeDefined();
    expect(screen.queryByText("Only me")).toBeNull();
  });
});
