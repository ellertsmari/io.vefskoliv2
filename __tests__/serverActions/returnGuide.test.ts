import { auth } from "auth";
import { Return } from "models/return";
import {
  closeDatabase,
  clearDatabase,
  connect,
} from "../__mocks__/mongoHandler";
import { ObjectId } from "mongodb";
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

  it("should return a guide", async () => {
    const projectUrl = "https://github.com/example/project";
    const liveVersion = "https://example.com/live-version";
    const projectName = "Example Project";
    const comment = "This is an example project.";
    const guideId = new ObjectId().toString();
    const returnUserId = new ObjectId().toString();

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: returnUserId },
    });

    const formData = {
      projectUrl,
      liveVersion,
      projectName,
      comment,
      guideId,
    };
    const result = await returnGuide(undefined, formData);
    expect(result).toEqual({
      success: true,
      message: "Return submitted successfully",
    });
    const theReturn = await Return.findOne({ owner: returnUserId });

    const actualReturn = theReturn.toObject();
    const expectedReturn = expect.objectContaining({
      projectUrl,
      liveVersion,
      projectName,
      comment,
      owner: new ObjectId(returnUserId),
      guide: new ObjectId(guideId),
    });

    expect(actualReturn).toMatchObject(expectedReturn);
  });
  it("should handle form parsing errors", async () => {
    const formData = {
      projectUrl: "",
      liveVersion: "",
      projectName: "",
      comment: "",
      guideId: "",
    };
    const result = await returnGuide(undefined, formData);
    expect(result).toEqual(
      expect.objectContaining({
        errors: {
          projectUrl: [expect.any(String)],
          liveVersion: [expect.any(String)],
          projectName: [expect.any(String)],
          comment: [expect.any(String)],
        },
        success: false,
      })
    );
  });
});
