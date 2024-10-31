import { render, fireEvent } from "@testing-library/react";
import { Toggle, ToggleOption } from "../../app/UIcomponents/toggle/Toggle";

describe("Toggle", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const options: ToggleOption[] = [
    ["Option 1", jest.fn(), false],
    ["Option 2", jest.fn(), true],
    ["Option 3", jest.fn()],
  ];

  it("renders without crashing", () => {
    render(<Toggle currentSelection="Option 1" options={options} />);
  });

  it("renders the correct number of options", () => {
    const { getAllByRole } = render(
      <Toggle currentSelection="Option 1" options={options} />
    );
    const buttons = getAllByRole("button");
    expect(buttons.length).toBe(options.length);
  });

  it("calls the correct onClick handler when an option is clicked", () => {
    const { getByLabelText } = render(
      <Toggle currentSelection="Option 1" options={options} />
    );
    fireEvent.click(getByLabelText("Select Option 1"));
    expect(options[0][1]).toHaveBeenCalled();
    fireEvent.click(getByLabelText("Select Option 2"));
    expect(options[1][1]).toHaveBeenCalled();
  });
  it("does renders a notification icon if notification prop is true", () => {
    const { queryByLabelText } = render(
      <Toggle currentSelection="Option 1" options={options} />
    );
    const notificationIcon1 = queryByLabelText(
      `Notification icon for ${options[0][0]}`
    );
    const notificationIcon2 = queryByLabelText(
      `Notification icon for ${options[1][0]}`
    );
    const notificationIcon3 = queryByLabelText(
      `Notification icon for ${options[2][0]}`
    );
    expect(notificationIcon1).toBeNull();
    expect(notificationIcon2).not.toBeNull();
    expect(notificationIcon3).toBeNull();
  });
});
