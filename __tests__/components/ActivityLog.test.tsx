import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ActivityProgress } from "app/guides/components/activityLog/ActivityProgress";
import { ActivityForm } from "app/guides/components/activityLog/ActivityForm";
import { ActivityLogView } from "app/guides/components/activityLog/ActivityLogView";
import { calculateActivityProgress } from "utils/activityLog";
import type { ActivityCycle, ActivityEntry, ActivityLogData } from "types/activityLogTypes";
import { getActivityLog, reviewActivityEntries } from "serverActions/activityLog";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("UIcomponents/markdown/reader", () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("serverActions/activityLog", () => ({ getActivityLog: jest.fn(), reviewActivityEntries: jest.fn(), saveActivityEntry: jest.fn(), deleteActivityEntry: jest.fn(), saveActivityCycle: jest.fn() }));

const cycle: ActivityCycle = { id: "cycle", guideId: "guide", label: "2025–2026", activityCapMinutes: 600, periods: [
  { id: "autumn", label: "Autumn", startDate: "2025-08-01", endDate: "2025-12-31", targetMinutes: 900 },
  { id: "spring", label: "Spring", startDate: "2026-01-01", endDate: "2026-07-31", targetMinutes: 900 },
] };
const entry: ActivityEntry = { id: "entry", ownerId: "anna", name: "Web meetup", description: "Helped host the event", location: "Online", sessions: [{ date: "2025-10-10", minutes: 600 }], links: [], imageIds: ["image"], status: "pending", revision: 0, teacherComment: "", updatedAt: "2025-10-10" };

beforeEach(() => { jest.clearAllMocks(); HTMLElement.prototype.scrollIntoView = jest.fn(); });

it("shows simple semester targets and names the source of carried hours", () => {
  const entries = [{ ...entry, id: "a", status: "approved" as const }, { ...entry, id: "b", status: "approved" as const }];
  render(<ActivityProgress progress={calculateActivityProgress(entries, cycle)} />);
  expect(screen.getByText("5h carried from Autumn")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "Autumn credited hours" })).toHaveAttribute("value", "900");
  expect(screen.getByRole("progressbar", { name: "Spring credited hours" })).toHaveAttribute("value", "300");
  expect(screen.getByText("10h to go")).toBeInTheDocument();
  expect(screen.getByText("20h of 30h credited.")).toBeInTheDocument();
});

it("keeps additional dates on the same activity and preserves the form after a failed save", async () => {
  const onSave = jest.fn().mockResolvedValue({ success: false, message: "Please try again." });
  render(<ActivityForm cycle={cycle} entry={entry} onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Add another date" }));
  fireEvent.change(screen.getByLabelText("Date 2"), { target: { value: "2026-02-10" } });
  fireEvent.change(screen.getByLabelText("Hours 2"), { target: { value: "2" } });
  expect(screen.getByText(/12h recorded · up to 10h can count/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Send for approval" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "entry", revision: 0, status: "pending", sessions: [{ date: "2025-10-10", minutes: 600 }, { date: "2026-02-10", minutes: 120 }] })));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please try again.");
  expect(screen.getByLabelText("Date 2")).toHaveValue("2026-02-10");
});

it("saves a draft explicitly and allows removal of existing evidence", async () => {
  const onSave = jest.fn().mockResolvedValue({ success: true });
  render(<ActivityForm cycle={cycle} entry={entry} onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "draft", images: [] })));
});

it("lets a teacher open a student's entries and approve the pending activity", async () => {
  const student = { id: "anna", name: "Anna", entries: [entry], progress: calculateActivityProgress([entry], cycle) };
  const data: ActivityLogData = { teacher: true, viewerId: "teacher", cycles: [cycle], cycle, students: [student] };
  (reviewActivityEntries as jest.Mock).mockResolvedValue({ success: true, message: "Approved." });
  (getActivityLog as jest.Mock).mockResolvedValue({ success: true, data });
  render(<ActivityLogView guideId="guide" title="Community participation" description="Take part in the community." initial={{ success: true, data }} />);
  expect(screen.queryByText("Web meetup")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Anna" }));
  const section = screen.getByRole("region", { name: "Anna's activities" });
  expect(within(section).getByText("Web meetup")).toBeInTheDocument();
  fireEvent.click(within(section).getByRole("button", { name: "Approve pending (1)" }));
  await waitFor(() => expect(reviewActivityEntries).toHaveBeenCalledWith("guide", "cycle", [{ id: "entry", revision: 0 }], "approved"));
});
