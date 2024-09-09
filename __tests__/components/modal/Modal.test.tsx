import { render, fireEvent } from "@testing-library/react";
import Modal from "components/modal/modal";

test("renders ModalTrigger initially and ModalContent after trigger is clicked", () => {
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
