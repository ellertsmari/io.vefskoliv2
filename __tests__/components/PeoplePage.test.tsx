import { render } from "@testing-library/react";
import PeoplePage from "../../app/LMS/people/page";
import { getUsers } from "serverActions/getUsers";

jest.mock("serverActions/getUsers", () => ({
  getUsers: jest.fn(),
}));

// The page signs the viewer in itself (defence in depth behind the proxy) and
// shows teachers who is waiting for approval.
jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));
jest.mock("serverActions/approveUsers", () => ({
  getPendingUsers: jest.fn(),
  approveUser: jest.fn(),
  rejectUser: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useRouter: () => ({ refresh: jest.fn() }),
}));
import { auth } from "../../auth";
import { getPendingUsers } from "serverActions/approveUsers";
import { redirect } from "next/navigation";

describe("People", () => {
  beforeEach(() => {
    // Default mock implementation that returns empty arrays
    (getUsers as jest.Mock).mockResolvedValue([]);
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "t", role: "teacher" },
    });
    (getPendingUsers as jest.Mock).mockResolvedValue([]);
  });

  it("sends a logged-out visitor to sign in", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    await PeoplePage();

    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("shows a teacher the registrations waiting for approval", async () => {
    (getPendingUsers as jest.Mock).mockResolvedValue([
      {
        id: "1",
        name: "New Student",
        email: "new@example.com",
        createdAt: "2026-09-01T10:00:00.000Z",
      },
    ]);

    const { getByText } = render(await PeoplePage());

    expect(getByText("Waiting for approval")).toBeDefined();
    expect(getByText("New Student")).toBeDefined();
    expect(getByText("Approve")).toBeDefined();
  });

  it("does not look up pending registrations for a student", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "s", role: "user" } });

    const { queryByText } = render(await PeoplePage());

    expect(getPendingUsers).not.toHaveBeenCalled();
    expect(queryByText("Waiting for approval")).toBeNull();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", async () => {
    (getUsers as jest.Mock)
      .mockResolvedValueOnce([{ name: "Teacher 1", role: "teacher" }])
      .mockResolvedValueOnce([{ name: "Student 1", role: "user" }]);

    render(await PeoplePage());
  });

  it("fetches users with correct roles", async () => {
    (getUsers as jest.Mock)
      .mockResolvedValueOnce([{ name: "Teacher 1", role: "teacher" }])
      .mockResolvedValueOnce([{ name: "Student 1", role: "user" }]);

    render(await PeoplePage());
    expect(getUsers).toHaveBeenCalledWith({ role: "teacher" });
    expect(getUsers).toHaveBeenCalledWith({ role: "user" });
  });

  it("renders UserInfoCards with correct props", async () => {
    (getUsers as jest.Mock)
      .mockResolvedValueOnce([{ name: "Teacher 1", role: "teacher" }])
      .mockResolvedValueOnce([{ name: "Student 1", role: "user" }]);

    const { getByText } = render(await PeoplePage());
    expect(getByText("Teachers")).toBeDefined();
    expect(getByText("Students")).toBeDefined();
  });
});
