import { render, fireEvent } from "@testing-library/react";
import { useModal } from "UIcomponents/modal/ModalProvider";
import { ModalTrigger } from "UIcomponents/modal/ModalTrigger";

jest.mock("UIcomponents/modal/ModalProvider");

test("calls setIsModalOpen with true when trigger is clicked", () => {
  const setIsModalOpen = jest.fn();

  (useModal as jest.Mock).mockReturnValue({
    setIsModalOpen,
  });

  const { getByRole } = render(
    <ModalTrigger trigger={<button>Open Modal</button>} />
  );

  fireEvent.click(getByRole("button"));

  expect(setIsModalOpen).toHaveBeenCalledWith(true);
});
