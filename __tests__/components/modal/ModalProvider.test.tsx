import { act, render, renderHook, waitFor } from "@testing-library/react";
import {
  ModalProvider,
  useModal,
} from "../../../app/UIcomponents/modal/ModalProvider";
import React from "react";

describe("ModalProvider", () => {
  it("renders children", () => {
    const { getByText } = render(
      <ModalProvider>
        <div>Test Child</div>
      </ModalProvider>
    );

    expect(getByText("Test Child")).toBeDefined();
  });

  it("useModal returns correct initial state", () => {
    const wrapper = ({ children }: any) => (
      <ModalProvider>{children}</ModalProvider>
    );

    const { result } = renderHook(() => useModal(), { wrapper });

    expect(result.current.isModalOpen).toBe(false);
  });

  it("setIsModalOpen changes isModalOpen state", async () => {
    const wrapper = ({ children }: any) => (
      <ModalProvider>{children}</ModalProvider>
    );

    const { result } = renderHook(() => useModal(), { wrapper });

    act(() => {
      result.current.setIsModalOpen(true);
    });

    expect(result.current.isModalOpen).toBe(true);
  });

  it("ModalProvider accepts external state", () => {
    const setIsModalOpen = jest.fn();
    const externalState = [true, setIsModalOpen] as [
      boolean,
      React.Dispatch<React.SetStateAction<boolean>>
    ];
    const wrapper = ({ children }: any) => (
      <ModalProvider state={externalState}>{children}</ModalProvider>
    );

    const { result } = renderHook(() => useModal(), { wrapper });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.setIsModalOpen).toBe(setIsModalOpen);
  });
});
