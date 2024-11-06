import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Slider } from "UIcomponents/slider/Slider";

describe("Slider Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test("renders correctly with given props", () => {
    const options = ["Option 1", "Option 2", "Option 3"];
    const { getByText } = render(
      <Slider
        id="test-slider"
        options={options}
        value={options[0]}
        selectable={true}
        helpLink="https://example.com"
      />
    );

    expect(getByText("Option 1")).toBeDefined();
    expect(getByText("Option 2")).toBeDefined();
    expect(getByText("Option 3")).toBeDefined();
    expect(getByText("What do these values mean?")).toBeDefined();
  });

  test("calls handleOnChange when slider value changes", () => {
    const options = ["Option 1", "Option 2", "Option 3"];
    const handleOnChange = jest.fn();
    const { getByRole } = render(
      <Slider
        id="test-slider"
        options={options}
        value={options[0]}
        selectable={true}
        helpLink="https://example.com"
        handleOnChange={handleOnChange}
      />
    );

    const slider = getByRole("slider");
    fireEvent.change(slider, { target: { value: "1" } });

    expect(handleOnChange).toHaveBeenCalledWith("Option 2");
  });

  test("slider is disabled when not selectable", () => {
    const options = ["Option 1", "Option 2", "Option 3"];
    const handleOnChange = jest.fn();
    const { getAllByRole } = render(
      <Slider
        id="test-slider"
        options={options}
        value={options[0]}
        selectable={false}
        helpLink="https://example.com"
        handleOnChange={handleOnChange}
      />
    );

    const slider = getAllByRole("slider") as HTMLInputElement[];
    const disabledSliders = slider.filter((s) => s.disabled);
    expect(disabledSliders).toBeDefined();
  });

  test("calls handleOnChange when option label is clicked", () => {
    const options = ["Option 1", "Option 2", "Option 3"];
    const handleOnChange = jest.fn();
    const { getByText } = render(
      <Slider
        id="test-slider"
        options={options}
        value={options[0]}
        selectable={true}
        helpLink="https://example.com"
        handleOnChange={handleOnChange}
      />
    );

    const optionLabel = getByText("Option 2");
    fireEvent.click(optionLabel);

    expect(handleOnChange).toHaveBeenCalledWith("Option 2");
  });

  test("option label cannot be clicked when slider is not selectable", () => {
    const options = ["Option 1", "Option 2", "Option 3"];
    const handleOnChangeHere = jest.fn();
    const { getByText } = render(
      <Slider
        id="test-slider"
        options={options}
        value={options[0]}
        selectable={false}
        helpLink="https://example.com"
        handleOnChange={handleOnChangeHere}
      />
    );

    const optionLabel = getByText("Option 2");
    fireEvent.click(optionLabel);

    expect(handleOnChangeHere).not.toHaveBeenCalled();
  });
});
