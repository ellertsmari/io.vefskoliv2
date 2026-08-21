import { render, fireEvent } from "@testing-library/react";
import { UserInfoCards } from "../../app/LMS/people/components/userInfoCards/UserInfoCards";
import { ShareableUserInfo } from "types/types";
import { exitIconLabel } from "../../app/assets/iconLabels";

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

    // Click the person's card in the roster grid
    fireEvent.click(getByText("John Doe"));

    expect(getByText(background)).toBeDefined();
    expect(getByText(careerGoals)).toBeDefined();
    expect(getByText(interests)).toBeDefined();
    expect(getByText(favoriteArtists)).toBeDefined();
  });

  it("no longer displays user info once the card is dismissed", () => {
    const { getByText, getByLabelText, queryByText } = render(
      <UserInfoCards userInfo={mockUsers} title="Test Title" />
    );

    // First select a user
    fireEvent.click(getByText("John Doe"));

    // Then close the dialog
    fireEvent.click(getByLabelText(exitIconLabel));

    expect(queryByText(background)).toBeNull();
    expect(queryByText(careerGoals)).toBeNull();
    expect(queryByText(interests)).toBeNull();
    expect(queryByText(favoriteArtists)).toBeNull();
  });

  it("shows the person's initials when they have no picture", () => {
    const { getByText } = render(
      <UserInfoCards
        userInfo={[{ name: "Ada Lovelace" }]}
        title="Test Title"
      />
    );

    expect(getByText("AL")).toBeDefined();
  });
});
