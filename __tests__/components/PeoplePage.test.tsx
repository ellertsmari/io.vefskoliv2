import { render } from "@testing-library/react";
import PeoplePage from "../../app/LMS/people/page";
import { getUsers } from "serverActions/getUsers";

jest.mock("serverActions/getUsers", () => ({
  getUsers: jest.fn(),
}));

describe("People", () => {
  beforeEach(() => {
    // Default mock implementation that returns empty arrays
    (getUsers as jest.Mock).mockResolvedValue([]);
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
