import { fireEvent, render, screen } from "@testing-library/react";
import { EventForm } from "../../app/LMS/calendar/EventForm";

jest.mock("serverActions/calendarEvents", () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ success: true }),
  updateCalendarEvent: jest.fn().mockResolvedValue({ success: true }),
}));

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const people = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

describe("EventForm", () => {
  it("defaults students to a Module 2 event with time fields", () => {
    render(
      <EventForm viewerRole="user" people={people} onClose={jest.fn()} />
    );

    const select = screen.getByLabelText("Event type") as HTMLSelectElement;
    expect(select.value).toBe("module2");
    expect(screen.getByLabelText(/From/)).toBeInTheDocument();
    expect(screen.getByLabelText(/To/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Last day/)).not.toBeInTheDocument();
  });

  it("defaults teachers to a lecture", () => {
    render(
      <EventForm viewerRole="teacher" people={people} onClose={jest.fn()} />
    );

    const select = screen.getByLabelText("Event type") as HTMLSelectElement;
    expect(select.value).toBe("lecture");
  });

  it("switches to date-range fields for ranged categories", () => {
    render(
      <EventForm viewerRole="teacher" people={people} onClose={jest.fn()} />
    );

    fireEvent.change(screen.getByLabelText("Event type"), {
      target: { value: "holiday" },
    });

    expect(screen.getByLabelText(/First day/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last day/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/From/)).not.toBeInTheDocument();
  });

  it("reveals the people picker only when sharing with specific people", () => {
    render(
      <EventForm viewerRole="user" people={people} onClose={jest.fn()} />
    );

    expect(screen.queryByText("Alice")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Me + people I pick"));
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Only me"));
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("prefills when editing an existing event", () => {
    render(
      <EventForm
        viewerRole="user"
        people={people}
        onClose={jest.fn()}
        initial={{
          id: "e1",
          title: "Study session",
          category: "module2",
          startDate: "2026-09-02",
          endDate: "2026-09-02",
          startTime: "16:00",
          endTime: "18:00",
          ownerId: "me",
          ownerName: "Me",
          visibility: "restricted",
          sharedWith: ["1"],
          canEdit: true,
        }}
      />
    );

    expect(screen.getByDisplayValue("Study session")).toBeInTheDocument();
    expect(screen.getByDisplayValue("16:00")).toBeInTheDocument();
    // restricted with a shared list selects the "people I pick" mode
    expect(
      (screen.getByLabelText("Me + people I pick") as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (screen.getByText("Alice").querySelector("input") ||
        screen.getByLabelText("Alice")) as HTMLInputElement
    ).toBeChecked();
  });
});
