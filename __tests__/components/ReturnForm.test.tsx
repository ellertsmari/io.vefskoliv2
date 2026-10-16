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
import { ReturnForm } from "app/guides/components/feedback/returnForm/ReturnForm";
import React from "react";
jest.mock("../../auth", () => ({
  signIn: jest.fn(),
  auth: jest.fn(),
}));
jest.mock("next-auth", () => ({
  AuthError: jest.fn().mockImplementation(), // Mock the AuthError class
}));

jest.mock("serverActions/returnGuide", () => ({
  returnGuide: jest.fn(),
}));

// The real field uploads a file to blob storage; a plain input stands in for it.
jest.mock("UIcomponents/imageUpload/ImageUploadField", () => ({
  ImageUploadField: ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </>
  ),
}));

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe("ReturnForm", () => {
  beforeAll(async () => await connect());

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => await closeDatabase());

  const guideId = "123456";
  const pictureUrl = "https://store.public.blob.vercel-storage.com/project.png";

  it("renders", async () => {
    const { getByLabelText, getByText } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    await waitFor(() => {
      expect(getByLabelText("GitHub repository")).toBeDefined();
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
    const liveVersion = "my-site.netlify.app";
    const comment = "comment";
    const projectName = "projectName";

    const { getByLabelText, getByText } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    await waitFor(() => {
      expect(getByLabelText("GitHub repository")).toBeDefined();
    });

    fireEvent.change(getByLabelText("GitHub repository"), {
      target: { value: projectUrl },
    });

    fireEvent.change(getByLabelText("Live page"), {
      target: { value: liveVersion },
    });

    fireEvent.change(getByLabelText("Project title"), {
      target: { value: projectName },
    });

    fireEvent.change(getByLabelText("Short project description"), {
      target: { value: comment },
    });

    fireEvent.change(getByLabelText("Image that suits your project (required)"), {
      target: { value: pictureUrl },
    });

    fireEvent.click(getByText("SUBMIT"));

    // Verify the server action was called with correct data
    await waitFor(() =>
      expect(returnGuide).toHaveBeenCalledWith(undefined, {
        projectUrl,
        // bare URLs are normalized with https:// before submission
        liveVersion: "https://my-site.netlify.app",
        projectName,
        comment,
        pictureUrl,
        guideId,
      })
    );
  });

  it("warns and does not submit without an image", async () => {
    const { getByLabelText, getByText, queryByRole } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    await waitFor(() => {
      expect(getByLabelText("GitHub repository")).toBeDefined();
    });

    // Fill the required text fields so only the image is missing
    fireEvent.change(getByLabelText("GitHub repository"), {
      target: { value: "https://github.com/me/project" },
    });
    fireEvent.change(getByLabelText("Live page"), {
      target: { value: "https://me.github.io/project" },
    });
    fireEvent.change(getByLabelText("Project title"), {
      target: { value: "My project" },
    });
    fireEvent.change(getByLabelText("Short project description"), {
      target: { value: "What I built" },
    });

    // No warning before the first try
    expect(queryByRole("alert")).toBeNull();

    fireEvent.click(getByText("SUBMIT"));

    expect(queryByRole("alert")).toHaveTextContent(
      "Please add a screenshot of your project before submitting."
    );
    expect(returnGuide).not.toHaveBeenCalled();

    // The warning goes away once an image is added
    fireEvent.change(getByLabelText("Image that suits your project (required)"), {
      target: { value: pictureUrl },
    });
    expect(queryByRole("alert")).toBeNull();
  });

  it("renders all form fields correctly", async () => {
    // Test that all form fields are present and correctly labeled
    const { getByLabelText, getByText, getByRole } = render(
      <ReturnForm guideId={guideId} />
    );

    fireEvent.click(getByText("RETURN"));

    // Wait for form to be visible
    await waitFor(() => {
      expect(getByLabelText("GitHub repository")).toBeDefined();
    });

    // Verify all form fields are rendered
    expect(getByLabelText("GitHub repository")).toBeDefined();
    expect(getByLabelText("Live page")).toBeDefined();
    expect(getByLabelText("Project title")).toBeDefined();
    expect(getByLabelText("Short project description")).toBeDefined();
    expect(getByLabelText("Image that suits your project (required)")).toBeDefined();
    expect(getByRole("button", { name: "SUBMIT" })).toBeDefined();
  });
});
