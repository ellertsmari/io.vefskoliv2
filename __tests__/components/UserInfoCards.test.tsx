import { render, fireEvent } from "@testing-library/react";
import { UserInfoCards } from "../../app/LMS/people/components/userInfoCards/UserInfoCards";
import { ShareableUserInfo } from "types/types";

describe("UserInfoCards", () => {
  const background = "background info";
  const careerGoals = "career goals info";
  const interests = "interests info";
  const favoriteArtists = "favorite artists info";

  const mockUsers: ShareableUserInfo[] = [
    {
      name: "John Doe",
      background,
      careerGoals,
      interests,
      favoriteArtists,
      avatarUrl: "avatar url",
    },
  ];

  it("renders without crashing", () => {
    render(<UserInfoCards userInfo={mockUsers} title="Test Title" />);
  });

  it("displays user info when a user is selected", () => {
    const { getByText } = render(
      <UserInfoCards userInfo={mockUsers} title="Test Title" />
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
      <UserInfoCards userInfo={mockUsers} title="Test Title" />
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
