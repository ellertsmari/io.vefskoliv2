import { render, screen, waitFor } from "@testing-library/react";
import { MeetingsPanel } from "../../app/components/teacherHome/MeetingsPanel";
import { todayKey, addDays } from "utils/calendarUtils";

jest.mock("serverActions/meetings", () => ({
  getUpcomingMeetings: jest.fn(),
}));
import { getUpcomingMeetings } from "serverActions/meetings";

describe("MeetingsPanel", () => {
  it("lists today's meetings and what is coming up", async () => {
    (getUpcomingMeetings as jest.Mock).mockResolvedValue([
      {
        id: "1",
        date: todayKey(),
        startTime: "13:00",
        endTime: "13:20",
        topic: "Feedback on our prototype",
        studentName: "Anna",
        withTeachers: ["Hanna"],
        teamName: "Team Rocket",
      },
      {
        id: "2",
        date: addDays(todayKey(), 2),
        startTime: "10:00",
        endTime: "10:20",
        topic: "Career advice",
        studentName: "Bjarni",
        withTeachers: [],
      },
    ]);

    render(<MeetingsPanel />);

    await waitFor(() => expect(screen.getByText("Feedback on our prototype")).toBeDefined());
    expect(screen.getByText(/Anna · Team Rocket/)).toBeDefined();
    expect(screen.getByText(/with Hanna/)).toBeDefined();
    expect(screen.getByText("Coming up")).toBeDefined();
    expect(screen.getByText("Career advice")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("says when there is nothing today", async () => {
    (getUpcomingMeetings as jest.Mock).mockResolvedValue([]);

    render(<MeetingsPanel />);

    await waitFor(() => expect(screen.getByText("No meetings today.")).toBeDefined());
    expect(screen.queryByText("Coming up")).toBeNull();
  });
});
