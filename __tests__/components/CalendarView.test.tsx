import { fireEvent, render as renderComponent, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { StyleSheetManager } from "styled-components";
import CalendarView from "../../app/LMS/calendar/CalendarView";
import type { CalendarEvent, SemesterInfo } from "types/calendarTypes";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("serverActions/meetings", () => ({
  bookMeeting: jest.fn(),
}));
jest.mock("serverActions/calendarEvents", () => ({
  createCalendarEvent: jest.fn(),
  updateCalendarEvent: jest.fn(),
  deleteCalendarEvent: jest.fn().mockResolvedValue({ success: true }),
}));

// These tests exercise interactions. jsdom's CSS parser predates container
// queries; keep style tags detached and check layout in a real browser.
const render = (ui: ReactElement) =>
  renderComponent(
    <StyleSheetManager target={document.createElement("div")}>
      {ui}
    </StyleSheetManager>
  );

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

  it.each([
    ["legacy-category", undefined],
    [undefined, undefined],
    [null, undefined],
    ["legacy-category", "2026-10-09"],
    [undefined, "2026-10-09"],
    [null, "2026-10-09"],
  ])("browses and opens an event with category %s and end date %s", (category, endDate) => {
    // Stored records can predate the current category schema.
    const legacyEvent = {
      id: "legacy",
      date: "2026-10-05",
      endDate,
      title: "Existing event",
      category,
      canEdit: true,
    } as unknown as CalendarEvent;
    render(
      <CalendarView events={[...events, legacyEvent]} semester={semester} isTeacher />
    );

    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getAllByText("October 2026")).toHaveLength(2);
    expect(screen.getByText("Existing event")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Mon 5 October/));
    expect(screen.getAllByText("Existing event")).toHaveLength(2);
    expect(screen.getByText("Other event")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("CANCEL"));

    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getAllByText("September 2026")).toHaveLength(2);
  });

  it("opens a day whose overflow events have an unknown category", () => {
    const dayEvents = Array.from({ length: 4 }, (_, index) => ({
      ...events[0],
      id: `event-${index}`,
      title: `Event ${index}`,
      category: index === 3 ? "legacy-category" : "lecture",
    })) as CalendarEvent[];
    render(<CalendarView events={dayEvents} semester={semester} isTeacher />);

    expect(screen.getByText("+1 more")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Wed 16 September/));
    expect(screen.getByText("Event 3")).toBeInTheDocument();
    expect(screen.getByText("Other event")).toBeInTheDocument();
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
    expect(screen.getByText("Everyone")).toBeDefined();
    expect(screen.getByText("My team (Team Rocket)")).toBeDefined();
    expect(screen.getByText("People I pick")).toBeDefined();
    expect(screen.getByText("Only me")).toBeDefined();
    // Times are text, not locale-formatted native inputs.
    expect(
      (screen.getByLabelText("From (optional)") as HTMLInputElement).type
    ).toBe("text");
    unmount();

    render(<CalendarView events={[]} semester={semester} isTeacher />);
    fireEvent.click(screen.getByText("+ New event"));
    expect(screen.getByText("Visible to everyone.")).toBeDefined();
    expect(screen.queryByText("Only me")).toBeNull();
  });

  it("lets a student pick people to share with", () => {
    render(
      <CalendarView
        events={[]}
        semester={semester}
        isTeacher={false}
        people={[
          { id: "1", name: "Bjarni" },
          { id: "2", name: "Cecil" },
        ]}
      />
    );
    fireEvent.click(screen.getByText("+ New event"));

    fireEvent.click(screen.getByText("People I pick"));
    fireEvent.click(screen.getByLabelText(/Cecil/));

    expect(screen.getByText("Shared with Cecil.")).toBeDefined();
  });

  it("tidies a typed time into 24-hour form", () => {
    render(<CalendarView events={[]} semester={semester} isTeacher />);
    fireEvent.click(screen.getByText("+ New event"));
    const from = screen.getByLabelText("From (optional)") as HTMLInputElement;

    fireEvent.change(from, { target: { value: "930" } });
    fireEvent.blur(from);

    expect(from.value).toBe("09:30");
  });
});
