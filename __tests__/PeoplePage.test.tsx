import { render } from "@testing-library/react";
import PeoplePage from "../app/people/page";
import { getUsers } from "../app/utils/actions";

jest.mock("../app/utils/actions", () => ({
  getUsers: jest.fn(),
}));

describe("People", () => {
  it("renders without crashing", async () => {
    render(await PeoplePage());
  });

  it("fetches users with correct roles", async () => {
    render(await PeoplePage());
    expect(getUsers).toHaveBeenCalledWith({ role: "teacher" });
    expect(getUsers).toHaveBeenCalledWith({ role: "user" });
  });

  it("renders UserInfoCards with correct props", async () => {
    (getUsers as jest.Mock)
      .mockResolvedValueOnce([{ id: "1", role: "teacher" }])
      .mockResolvedValueOnce([{ id: "2", role: "user" }]);

    const { getByText, debug } = render(await PeoplePage());
    expect(getByText("Teachers")).toBeDefined();
    expect(getByText("Students")).toBeDefined();
  });
});
