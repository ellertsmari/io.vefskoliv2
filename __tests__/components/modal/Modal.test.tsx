import { render, fireEvent } from "@testing-library/react";
import Modal from "components/modal/modal";
import { useState } from "react";

describe("Modal", () => {
  it("renders ModalTrigger initially and ModalContent after trigger is clicked", () => {
    const modalTrigger = <button>Open Modal</button>;
    const modalContent = <div>Test Content</div>;

    const { getByRole, queryByText } = render(
      <Modal modalTrigger={modalTrigger} modalContent={modalContent} />
    );

    // Check that only the trigger is rendered initially
    expect(getByRole("button")).toBeDefined();
    expect(queryByText("Test Content")).toBeNull();

    // Simulate a click on the trigger
    fireEvent.click(getByRole("button"));

    // Check that the content is rendered after the trigger is clicked
    expect(queryByText("Test Content")).toBeDefined();
  });

  it("Modal accepts external state", () => {
    const modalTrigger = <button>Open Modal</button>;
    const modalContent = (
      setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>
    ) => (
      <div>
        Test Content
        <button onClick={() => setIsModalOpen(false)}>Close Modal</button>
      </div>
    );

    const ExternalStateWrapper = () => {
      const [isModalOpen, setIsModalOpen] = useState(false);

      return (
        <Modal
          modalTrigger={modalTrigger}
          modalContent={modalContent(setIsModalOpen)}
          state={[isModalOpen, setIsModalOpen]}
        />
      );
    };

    const { getByRole, queryByText } = render(<ExternalStateWrapper />);

    expect(getByRole("button", { name: "Open Modal" })).toBeDefined();
    expect(queryByText("Test Content")).toBeNull();

    fireEvent.click(getByRole("button", { name: "Open Modal" }));

    expect(queryByText("Test Content")).toBeDefined();

    fireEvent.click(getByRole("button", { name: "Close Modal" }));

    expect(queryByText("Test Content")).toBeNull();
  });
});
