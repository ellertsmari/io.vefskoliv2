import { Types } from "mongoose";
import { User, UserDocument } from "models/user";
import {
  closeDatabase,
  clearDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { updateUserInfo } from "serverActions/updateUserInfo";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("updateUserInfo", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it("should update user info", async () => {
    const updatedUserInfo = {
      background: "New background",
      careerGoals: "New career goals",
      interests: "New interests",
      favoriteArtists: "New favorite artists",
    };

    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });

    const result = await updateUserInfo(updatedUserInfo);

    expect(result.success).toBe(true);

    const expectedUser = {
      ...mockUser.toObject(), // Get plain object representation of mockUser
      ...updatedUserInfo, // Merge in the updated fields
    };

    const actualUser = await User.findById(mockUser._id).lean();

    // Type assertion to inform TypeScript that these properties can be deleted
    delete (actualUser as any).updatedAt;
    delete (expectedUser as any).updatedAt;

    expect(actualUser).toEqual(expectedUser);
  });

  it("should return error if user is not logged in", async () => {
    const updatedUserInfo = {
      background: "New background",
      careerGoals: "New career goals",
      interests: "New interests",
      favoriteArtists: "New favorite artists",
    };

    (auth as jest.Mock).mockResolvedValue(null);

    const result = await updateUserInfo(updatedUserInfo);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe(
        "You must be logged in to perform this action"
      );
    }
  });

  it("should return error if user info is invalid", async () => {
    // Mock user document
    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });

    const updatedUserInfo = {
      background: "New background",
      careerGoals: "New career goals",
      interests: "New interests",
      favoriteArtists: "New favorite artists",
      unallowedField: "This field should not be allowed",
    };

    // Spy on console.warn to avoid printing the warning to the console
    jest.spyOn(console, "warn").mockImplementationOnce(() => {});

    const result = await updateUserInfo(updatedUserInfo);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("Invalid input provided");
    }
  });
});
