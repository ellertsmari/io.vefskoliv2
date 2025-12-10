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

  it("submits form with correct data", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: new ObjectId("123456789012345678901234") },
    });

    (returnGuide as jest.Mock).mockResolvedValue({
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

    await waitFor(() => {
      expect(getByLabelText("Github or Figma URL")).toBeDefined();
    });

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

    // Verify the server action was called with correct data
    await waitFor(() =>
      expect(returnGuide).toHaveBeenCalledWith(undefined, {
        projectUrl,
        liveVersion,
        projectName,
        comment,
        guideId,
      })
    );
  });

  it("renders all form fields correctly", async () => {
    // Test that all form fields are present and correctly labeled
    const { getByLabelText, getByText, getByRole } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    // Wait for form to be visible
    await waitFor(() => {
      expect(getByLabelText("Github or Figma URL")).toBeDefined();
    });

    // Verify all form fields are rendered
    expect(getByLabelText("Github or Figma URL")).toBeDefined();
    expect(getByLabelText("Live version or prototype(Figma)")).toBeDefined();
    expect(getByLabelText("Project title")).toBeDefined();
    expect(getByLabelText("Short project description")).toBeDefined();
    expect(getByLabelText("Image that suits your project (optional)")).toBeDefined();
    expect(getByRole("button", { name: "SUBMIT" })).toBeDefined();
  });
});
