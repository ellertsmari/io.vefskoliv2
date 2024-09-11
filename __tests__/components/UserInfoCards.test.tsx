import { render, fireEvent, screen } from "@testing-library/react";
import { UserInfoCards } from "components/peopleCard/UserInfoCards";
import { UserDocument } from "../../app/models/user";

describe("UserInfoCards", () => {
  const background = "background info";
  const careerGoals = "career goals info";
  const interests = "interests info";
  const favoriteArtists = "favorite artists info";

  const mockUsers = [
    {
      name: "John Doe",
      email: "john@example.com",
      password: "password",
      role: "user",
      background,
      careerGoals,
      interests,
      favoriteArtists,
      avatarUrl: "avatar url",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as UserDocument[];

  it("renders without crashing", () => {
    render(<UserInfoCards users={mockUsers} title="Test Title" />);
  });

  it("displays user info when a user is selected", () => {
    const { getByText } = render(
      <UserInfoCards users={mockUsers} title="Test Title" />
    );

    fireEvent.click(getByText("TEST TITLE"));

    fireEvent.click(getByText("John Doe"));

    expect(getByText(background)).toBeDefined();
    expect(getByText(careerGoals)).toBeDefined();
    expect(getByText(interests)).toBeDefined();
    expect(getByText(favoriteArtists)).toBeDefined();
  });

  it("no longer displays user info when 'None' is selected", () => {
    const { getByText, queryByText } = render(
      <UserInfoCards users={mockUsers} title="Test Title" />
    );

    fireEvent.click(getByText("TEST TITLE"));

    fireEvent.click(getByText("John Doe"));

    fireEvent.click(getByText("None"));

    expect(queryByText(background)).toBeNull();
    expect(queryByText(careerGoals)).toBeNull();
    expect(queryByText(interests)).toBeNull();
    expect(queryByText(favoriteArtists)).toBeNull();
  });
});
