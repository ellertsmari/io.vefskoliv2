import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReportsPage } from "app/LMS/reports/components/ReportsPage";
import { getStudentGuides } from "serverActions/getStudentGuides";
import { calculateActivityProgress } from "utils/activityLog";

jest.mock("serverActions/getStudentGuides", () => ({ getStudentGuides: jest.fn() }));
jest.mock("UIcomponents/modal/modal", () => ({ __esModule: true, default: () => <div>Peer-review modal</div> }));
jest.mock("../../app/LMS/reports/components/ReviewDetailsModal", () => ({ ReviewDetailsModal: () => null }));

it("shows activity hours in reports without requiring project returns or peer reviews", async () => {
  const progress = calculateActivityProgress([{ id: "entry", status: "approved", sessions: [{ date: "2025-09-10", minutes: 300 }] }], { activityCapMinutes: 600, periods: [
    { id: "autumn", label: "Autumn", startDate: "2025-08-01", endDate: "2025-12-31", targetMinutes: 900 },
    { id: "spring", label: "Spring", startDate: "2026-01-01", endDate: "2026-07-31", targetMinutes: 900 },
  ] });
  (getStudentGuides as jest.Mock).mockResolvedValue([{ _id: "guide", title: "Community participation", module: { title: "2 - Community & Networking" }, submissionType: "activityLog", activityProgress: progress, link: "/guides/guide", returnStatus: "IN PROGRESS", returnsSubmitted: [], reviewsGiven: [], gradesGiven: [] }]);
  render(<ReportsPage students={[{ _id: "anna", name: "Anna", email: "anna@example.com", role: "user" }]} />);
  fireEvent.click(screen.getByText("Anna"));
  expect(await screen.findByText("Autumn: 5h / 15h")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Community participation/ })).toHaveAttribute("href", "/guides/guide");
  expect(screen.queryByText("Peer-review modal")).not.toBeInTheDocument();
});
