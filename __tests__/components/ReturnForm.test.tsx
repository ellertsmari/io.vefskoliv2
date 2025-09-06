/**
 * @jest-environment jsdom
 */
import { fireEvent, render, waitFor } from "@testing-library/react";
import { ObjectId } from "mongodb";
import {
  clearDatabase,
  closeDatabase,
  connect,
} from "../__mocks__/mongoHandler";
import { auth } from "../../auth";
import { returnGuide } from "serverActions/returnGuide";
import { ReturnForm } from "app/LMS/components/feedback/returnForm/ReturnForm";
import React from "react";
jest.mock("../../auth", () => ({
  getUser: jest.fn(),
  signIn: jest.fn(),
  auth: jest.fn(),
}));
jest.mock("next-auth", () => ({
  AuthError: jest.fn().mockImplementation(), // Mock the AuthError class
}));

jest.mock("serverActions/returnGuide", () => ({
  returnGuide: jest.fn(),
}));

describe("ReturnForm", () => {
  beforeAll(async () => await connect());

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => await closeDatabase());

  const guideId = "123456";

  it("renders", async () => {
    const { getByLabelText, getByText } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    await waitFor(() => {
      expect(getByLabelText("Github or Figma URL")).toBeDefined();
    });
  });

  it("successfully submits form", async () => {
    // Mock window.location.replace
    const replaceMock = jest.fn();
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        replace: replaceMock,
      },
      writable: true,
    });

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: new ObjectId("123456789012345678901234") },
    });

    (returnGuide as jest.Mock).mockResolvedValueOnce({
      success: true,
    });

    const projectUrl =
      "https://www.figma.com/board/zzY1HfwDdoUVAXJrJTwtYW/Untitled?node-id=24-1599&t=obAcOpdLEllhnacc-1";
    const liveVersion = "liveVersion";
    const comment = "comment";
    const projectName = "projectName";

    const { getByLabelText, getByText } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    fireEvent.change(getByLabelText("Github or Figma URL"), {
      target: { value: projectUrl },
    });

    fireEvent.change(getByLabelText("Live version or prototype(Figma)"), {
      target: { value: liveVersion },
    });

    fireEvent.change(getByLabelText("Project title"), {
      target: { value: projectName },
    });

    fireEvent.change(getByLabelText("Short project description"), {
      target: { value: comment },
    });

    fireEvent.click(getByText("SUBMIT"));

    await waitFor(() =>
      expect(returnGuide).toHaveBeenCalledWith(undefined, {
        projectUrl,
        liveVersion,
        projectName,
        comment,
        guideId,
      })
    );

    const actualFormData = (returnGuide as jest.Mock).mock.calls[0][1];

    expect(replaceMock).toHaveBeenCalledWith("/guides");
  });

  it("displays error message on failed form submission", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "123456789012345678901234" },
    });

    (returnGuide as jest.Mock).mockResolvedValueOnce({
      success: false,
      message: "Failed to return guide",
      errors: {
        projectUrl: ["Please provide a valid URL"],
        liveVersion: ["Please provide a valid URL"],
        projectName: ["Please provide a project name"],
        comment: ["Please provide a comment"],
      },
    });

    const { getByLabelText, getByText, container } = render(
      <ReturnForm guideId={guideId} />
    );

    await waitFor(() => {
      expect(container.querySelector("#liveVersion-error")).toBeNull();
      expect(container.querySelector("#projectUrl-error")).toBeNull();
      expect(container.querySelector("#projectName-error")).toBeNull();
      expect(container.querySelector("#comment-error")).toBeNull();
    });

    fireEvent.click(getByText("RETURN"));

    fireEvent.click(getByText("SUBMIT"));

    await waitFor(() => {
      expect(container.querySelector("#liveVersion-error")).toHaveTextContent(
        "Please provide a valid URL"
      );
      expect(container.querySelector("#projectUrl-error")).toHaveTextContent(
        "Please provide a valid URL"
      );
      expect(container.querySelector("#projectName-error")).toHaveTextContent(
        "Please provide a project name"
      );
      expect(container.querySelector("#comment-error")).toHaveTextContent(
        "Please provide a comment"
      );
    });
  });
});
