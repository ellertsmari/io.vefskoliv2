import { fireEvent, render, waitFor } from "@testing-library/react";
import { ModuleOptions } from "../../app/UIcomponents/dropdown/Dropdown";

describe("ModuleOptions", () => {
  const options = ["Option 1", "Option 2", "Option 3"].map((option) => ({
    optionName: option,
    onClick: jest.fn(),
  }));

  const title = "Select an option";

  it("should render correctly", async () => {
    const { getByText, queryByText } = render(
      <ModuleOptions
        options={options}
      />
    );

    // check if initial render is correct
    expect(getByText(title.toUpperCase())).toBeTruthy();

    // check if options are rendered after clicking on the dropdown
    fireEvent.click(getByText(title.toUpperCase()));
    options.forEach(({ optionName }) => {
      expect(getByText(optionName)).toBeDefined();
    });

    //check if the options are removed after clicking on an option
    fireEvent.click(getByText(options[1].optionName));

    expect(options[1].onClick).toHaveBeenCalled();

    await waitFor(() => {
      expect(getByText(options[1].optionName.toUpperCase())).toBeTruthy();
      options.forEach(({ optionName }) => {
        if (optionName !== options[1].optionName) {
          expect(queryByText(optionName)).toBeNull();
        }
      });
    });
  });

  it("should render with initial option", async () => {
    const initialOption = options[1].optionName;
    const { getByText, queryByText } = render(
      <ModuleOptions
        options={options}
      />
    );

    expect(getByText(initialOption.toUpperCase())).toBeTruthy();

    fireEvent.click(getByText(initialOption.toUpperCase()));

    options.forEach(({ optionName }) => {
      expect(getByText(optionName)).toBeDefined();
    });

    fireEvent.click(getByText(options[2].optionName));

    expect(options[2].onClick).toHaveBeenCalled();

    await waitFor(() => {
      expect(getByText(options[2].optionName.toUpperCase())).toBeTruthy();
      options.forEach(({ optionName }) => {
        if (optionName !== options[2].optionName) {
          expect(queryByText(optionName)).toBeNull();
        }
      });
    });
  });

  it("should open and close the dropdown when the title is clicked", async () => {
    const { getByText, queryByText } = render(
      <ModuleOptions
        options={options}
      />
    );

    // check if dropdown is closed initially
    options.forEach(({ optionName }) => {
      expect(queryByText(optionName)).toBeNull();
    });

    // open the dropdown
    fireEvent.click(getByText(title.toUpperCase()));

    // check if options are rendered
    options.forEach(({ optionName }) => {
      expect(getByText(optionName)).toBeDefined();
    });

    // close the dropdown
    fireEvent.click(getByText(title.toUpperCase()));

    // check if options are removed
    await waitFor(() => {
      options.forEach(({ optionName }) => {
        expect(queryByText(optionName)).toBeNull();
      });
    });
  });

  it("should render correctly when no options are provided", async () => {
    const { getByText, queryByText } = render(
      <ModuleOptions
        options={[]}
      />
    );

    // check if title is rendered
    expect(getByText(title.toUpperCase())).toBeDefined();

    // open the dropdown
    fireEvent.click(getByText(title.toUpperCase()));

    // check if no options are rendered
    await waitFor(() =>
      options.forEach(({ optionName }) => {
        expect(queryByText(optionName)).toBeNull();
      })
    );
  });
});
