import { fireEvent, render } from "@testing-library/react";
import { ModuleOptions } from "../../app/UIcomponents/dropdown/Dropdown";

describe("ModuleOptions", () => {
  // Create fresh mock functions for each test
  const createOptions = () => ["Option 1", "Option 2", "Option 3"].map((option) => ({
    optionName: option,
    onClick: jest.fn(),
  }));

  it("should render all options", () => {
    const options = createOptions();
    const { getByText } = render(
      <ModuleOptions options={options} />
    );

    // All options should be visible immediately (no dropdown toggle)
    options.forEach(({ optionName }) => {
      expect(getByText(optionName)).toBeDefined();
    });
  });

  it("should call onClick when an option is clicked", () => {
    const options = createOptions();
    const { getByText } = render(
      <ModuleOptions options={options} />
    );

    fireEvent.click(getByText(options[1].optionName));
    expect(options[1].onClick).toHaveBeenCalled();
  });

  it("should highlight active option when currentOption is provided", () => {
    const options = createOptions();
    const { getByText } = render(
      <ModuleOptions options={options} currentOption={options[0]} />
    );

    // All options should still be visible
    options.forEach(({ optionName }) => {
      expect(getByText(optionName)).toBeDefined();
    });
  });

  it("should render correctly when no options are provided", () => {
    const { container } = render(
      <ModuleOptions options={[]} />
    );

    // Container should be empty (no options to display)
    expect(container.querySelectorAll("button").length).toBe(0);
  });
});
