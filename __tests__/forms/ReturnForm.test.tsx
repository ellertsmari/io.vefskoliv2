/**
 * @jest-environment jsdom
 */
import {
  fireEvent,
  queryByLabelText,
  render,
  waitFor,
} from "@testing-library/react";
import { ObjectId } from "mongodb";
import {
  clearDatabase,
  closeDatabase,
  connect,
} from "../__mocks__/mongoHandler";
import { auth } from "../../auth";
import { returnGuide } from "../../app/utils/actions";
import ReturnForm from "../../app/guides/[id]/returnForm";
jest.mock("../../auth", () => ({
  getUser: jest.fn(),
  signIn: jest.fn(),
  auth: jest.fn(),
}));
jest.mock("next-auth", () => ({
  AuthError: jest.fn().mockImplementation(), // Mock the AuthError class
}));

jest.mock("../../app/providers/GuideProvider", () => ({
  useGuide: jest.fn().mockReturnValue({ _id: "123456789012345678901234" }),
}));
jest.mock("../../app/utils/actions", () => ({
  returnGuide: jest.fn(),
}));

describe("ReturnForm", () => {
  beforeAll(async () => await connect());

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => await closeDatabase());

  it("renders", async () => {
    const { getByLabelText, getByText } = render(<ReturnForm />);

    fireEvent.click(getByText("RETURN"));

    await waitFor(() => {
      expect(getByLabelText("Github or Figma URL")).toBeDefined();
    });
  });

  it("submits form", async () => {
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

    const projectUrl = "projectUrl";
    const liveVersion = "liveVersion";
    const comment = "comment";
    const projectName = "projectName";

    const { getByLabelText, getByText, queryByLabelText } = render(
      <ReturnForm />
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

    const expectedFormData = new FormData();
    expectedFormData.append("projectUrl", projectUrl);
    expectedFormData.append("liveVersion", liveVersion);
    expectedFormData.append("comment", comment);
    expectedFormData.append("projectName", projectName);
    expectedFormData.append("imageOfProject", "");
    expectedFormData.append("guideId", "123456789012345678901234");

    const formatDataObject = (formData: FormData) => {
      const obj: { [key: string]: string } = {};
      for (let [key, value] of formData.entries()) {
        obj[key] = value.toString();
      }
      return obj;
    };

    await waitFor(() => expect(returnGuide).toHaveBeenCalled());

    const actualFormData = (returnGuide as jest.Mock).mock.calls[0][1];

    await waitFor(() => {
      expect(formatDataObject(actualFormData)).toEqual(
        formatDataObject(expectedFormData)
      );
    });

    expect(replaceMock).toHaveBeenCalledWith("/guides");
  });
});
