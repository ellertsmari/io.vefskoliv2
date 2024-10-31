import { auth } from "../../auth";
import { Return } from "models/return";
import {
  closeDatabase,
  clearDatabase,
  connect,
} from "../__mocks__/mongoHandler";
import { Types } from "mongoose";
import { returnGuide } from "serverActions/returnGuide";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("returnGuide", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });
  const projectUrl = "https://github.com/example/project";
  const liveVersion = "https://example.com/live-version";
  const projectName = "Example Project";
  const comment = "This is an example project.";
  const guideId = new Types.ObjectId();
  const returnUserId = new Types.ObjectId();
  (auth as jest.Mock).mockResolvedValueOnce({
    user: { id: returnUserId },
  });
  it("should return a guide", async () => {
    const state = {}; // Add any necessary properties to this object
    const formData = new FormData();
    formData.append("projectUrl", projectUrl);
    formData.append("liveVersion", liveVersion);
    formData.append("projectName", projectName);
    formData.append("comment", comment);
    formData.append("imageOfProject", "");
    formData.append("guideId", guideId.toString());
    const result = await returnGuide(state, formData);
    expect(result).toEqual({
      success: true,
      message: "Return submitted successfully",
    });
    const theReturn = await Return.findOne({ owner: returnUserId });
    expect(theReturn).toMatchObject({
      projectUrl,
      liveVersion,
      projectName,
      comment,
      owner: returnUserId,
      guide: guideId,
    });
  });
  it("should handle form parsing errors", async () => {
    const state = {};
    const formData = new FormData();
    formData.append("projectUrl", ""); // Empty string should fail validation
    formData.append("liveVersion", ""); // Empty string should fail validation
    formData.append("projectName", ""); // Empty string should fail validation
    formData.append("comment", ""); // Empty string should fail validation
    formData.append("guideId", guideId.toString());
    const result = await returnGuide(state, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
