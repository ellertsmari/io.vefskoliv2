import {
  fireEvent,
  getByTestId,
  render,
  waitFor,
} from "@testing-library/react";
import { useModal } from "components/modal/ModalProvider";
import { ModalContent } from "components/modal/ModalContent";

jest.mock("components/modal/ModalProvider");

describe("ModalContent", () => {
  it("does not render content when isModalOpen is false", () => {
    (useModal as jest.Mock).mockReturnValue({
      isModalOpen: false,
      setIsModalOpen: jest.fn(),
    });

    const { queryByText } = render(
      <ModalContent content={<div>Test Content</div>} />
    );

    expect(queryByText("Test Content")).toBeNull();
  });

  it("renders content when isModalOpen is true", () => {
    (useModal as jest.Mock).mockReturnValue({
      isModalOpen: true,
      setIsModalOpen: jest.fn(),
    });

    const { getByText } = render(
      <ModalContent content={<div>Test Content</div>} />
    );

    expect(getByText("Test Content")).toBeDefined();
  });

  it("closes when exit button is clicked", () => {
    const setIsModalOpen = jest.fn();

    (useModal as jest.Mock).mockReturnValue({
      isModalOpen: true,
      setIsModalOpen,
    });

    const { getByRole } = render(
      <ModalContent content={<div>Test Content</div>} />
    );

    fireEvent.click(getByRole("button"));

    expect(setIsModalOpen).toHaveBeenCalledWith(false);
  });

  it("closes when outside of content is clicked", async () => {
    const setIsModalOpen = jest.fn();

    (useModal as jest.Mock).mockReturnValue({
      isModalOpen: true,
      setIsModalOpen,
    });

    const { getByTestId } = render(
      <ModalContent content={<div>Test Content</div>} />
    );

    fireEvent.click(getByTestId("modal-wrapper"));

    await waitFor(() => expect(setIsModalOpen).toHaveBeenCalledWith(false));
  });

  it("does not close when content is clicked", () => {
    const setIsModalOpen = jest.fn();

    (useModal as jest.Mock).mockReturnValue({
      isModalOpen: true,
      setIsModalOpen,
    });

    const { getByText } = render(
      <ModalContent content={<div>Test Content</div>} />
    );

    fireEvent.click(getByText("Test Content"));

    expect(setIsModalOpen).not.toHaveBeenCalled();
  });

  it("does not render exit button when hideExitButton is true", () => {
    (useModal as jest.Mock).mockReturnValue({
      isModalOpen: true,
      setIsModalOpen: jest.fn(),
    });

    const { queryByRole } = render(
      <ModalContent content={<div>Test Content</div>} hideExitButton={true} />
    );

    expect(queryByRole("button")).toBeNull();
  });
});
